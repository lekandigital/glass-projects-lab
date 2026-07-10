using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Services;

public class RenderService(EffectManager effectManager, IBackgroundSampler backgroundSampler) : IRenderService
{
    private const double BACKGROUND_CAPTURE_INTERVAL = 1.0 / 60.0; // Capture at 60 FPS max for responsive sampling
    private const float ENHANCED_BLEEDING_DISTANCE = 400f;
    private double _lastBackgroundCaptureTime = -1;
    private IBackgroundRenderer? _lastBackgroundRenderer;
    private int _lastCaptureHeight = -1;
    private int _lastCaptureWidth = -1;
    private ICardRenderer? _lastCardRenderer;
    private double _pausedBackgroundTime;

    public void RenderFrame(SKCanvas canvas, int width, int height, IEnumerable<Card> cards, double animationTime,
        bool isBackgroundAnimationEnabled)
    {
        // Clear canvas
        canvas.Clear(SKColor.Parse(RenderingConstants.BackgroundClearColor));

        // Determine background animation time based on pause state
        var backgroundAnimationTime = isBackgroundAnimationEnabled ? animationTime : _pausedBackgroundTime;

        // Update paused time when background animation is disabled
        if (!isBackgroundAnimationEnabled && _pausedBackgroundTime == 0)
        {
            _pausedBackgroundTime = animationTime;
        }
        else if (isBackgroundAnimationEnabled)
        {
            _pausedBackgroundTime = 0;
        }

        // Always capture background for sampling BEFORE rendering to main canvas
        // This ensures transparent glass cards get accurate, up-to-date background data for all background types
        CaptureBackgroundForSampling(width, height, backgroundAnimationTime);

        // THEN: Render background to main canvas
        effectManager.CurrentBackgroundRenderer.Render(canvas, width, height, backgroundAnimationTime);

        var cardList = cards.ToList();

        // Render cards with enhanced color bleeding if renderer supports it
        RenderCardsWithEnhancedBleeding(canvas, cardList, animationTime);
    }

    private void RenderCardsWithEnhancedBleeding(SKCanvas canvas, List<Card> cards, double animationTime)
    {
        // Check if current renderer supports enhanced bleeding
        if (effectManager.CurrentCardRenderer is IEnhancedCardRenderer enhancedRenderer)
        {
            // Render each card with color bleeding from nearby cards
            foreach (var card in cards)
            {
                var nearbyCards = GetNearbyCards(card, cards);
                enhancedRenderer.RenderWithColorBleeding(canvas, card, nearbyCards, backgroundSampler, animationTime);
            }
        }
        else
        {
            // Fallback to standard rendering
            foreach (var card in cards)
            {
                effectManager.CurrentCardRenderer.Render(canvas, card, animationTime);
            }
        }
    }

    private IEnumerable<Card> GetNearbyCards(Card targetCard, List<Card> allCards)
    {
        return allCards.Where(card =>
            card != targetCard &&
            CalculateDistance(targetCard, card) <= ENHANCED_BLEEDING_DISTANCE);
    }

    private static float CalculateDistance(Card card1, Card card2)
    {
        var dx = card1.X - card2.X;
        var dy = card1.Y - card2.Y;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    private void CaptureBackgroundForSampling(int width, int height, double backgroundAnimationTime)
    {
        // Check if we switched to transparent glass card (which needs background sampling)
        var switchedToTransparentGlass = _lastCardRenderer != effectManager.CurrentCardRenderer &&
                                         effectManager.CurrentCardRenderer.Name.Contains("Transparent");

        // Always capture for the first frame or when conditions change
        var forceCapture = _lastBackgroundCaptureTime < 0 ||
                           _lastCaptureWidth != width ||
                           _lastCaptureHeight != height ||
                           _lastBackgroundRenderer != effectManager.CurrentBackgroundRenderer ||
                           switchedToTransparentGlass;

        // Simplified logic: Always capture when forced, or use time-based updates
        var shouldCapture = forceCapture || ShouldUpdateBackground(width, height, backgroundAnimationTime);

        if (backgroundSampler is BackgroundSampler sampler && shouldCapture)
        {
            try
            {
                // Create a separate bitmap to capture just the background
                using var backgroundBitmap = new SKBitmap(width, height);
                using var backgroundCanvas = new SKCanvas(backgroundBitmap);

                // Ensure clean background capture
                backgroundCanvas.Clear(SKColor.Parse(RenderingConstants.BackgroundClearColor));
                effectManager.CurrentBackgroundRenderer.Render(backgroundCanvas, width, height,
                    backgroundAnimationTime);

                // Force canvas to complete rendering before sampling
                backgroundCanvas.Flush();

                // Update the background sampler with the captured background
                sampler.SetBackgroundData(backgroundBitmap);

                _lastCaptureWidth = width;
                _lastCaptureHeight = height;
                _lastBackgroundRenderer = effectManager.CurrentBackgroundRenderer;
                _lastCardRenderer = effectManager.CurrentCardRenderer;
                _lastBackgroundCaptureTime = backgroundAnimationTime;
            }
            catch (Exception)
            {
                // If background capture fails, at least ensure we have some fallback data
                try
                {
                    using var fallbackBitmap = new SKBitmap(width, height);
                    fallbackBitmap.Erase(new SKColor(245, 250, 255)); // Light glass fallback
                    sampler.SetBackgroundData(fallbackBitmap);
                }
                catch
                {
                    // If even the fallback fails, the sampler will use its internal fallback
                }
            }
        }
    }

    private bool ShouldUpdateBackground(int width, int height, double animationTime)
    {
        // Always update if dimensions changed or renderer changed
        if (_lastCaptureWidth != width ||
            _lastCaptureHeight != height ||
            _lastBackgroundRenderer != effectManager.CurrentBackgroundRenderer)
        {
            return true;
        }

        // If we're using transparent glass cards, we need regular updates for all background types
        var usingTransparentGlass = effectManager.CurrentCardRenderer.Name.Contains("Transparent");

        if (usingTransparentGlass)
        {
            // For image backgrounds with transparent glass, update every few frames to ensure fresh sampling
            // For animated backgrounds with transparent glass, update more frequently
            var isImageBackground = effectManager.CurrentBackgroundRenderer.Name.Contains("Image");
            var captureInterval =
                isImageBackground ? 0.2 : BACKGROUND_CAPTURE_INTERVAL; // 5 FPS for images, 60 FPS for animated

            return animationTime - _lastBackgroundCaptureTime >= captureInterval;
        }

        // For non-transparent cards, we don't need frequent background updates
        return false;
    }
}
