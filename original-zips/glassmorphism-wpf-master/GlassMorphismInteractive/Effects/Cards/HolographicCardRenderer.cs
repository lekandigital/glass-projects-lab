using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

public class HolographicCardRenderer(IBackgroundSampler backgroundSampler) : ICardRenderer
{
    private readonly HolographicBackgroundEffect _backgroundEffect = new();
    private readonly HolographicBorderEffect _borderEffect = new();
    private readonly HolographicContentEffect _contentEffect = new();
    private readonly HolographicOverlayEffect _overlayEffect = new();
    private readonly HolographicShadowEffect _shadowEffect = new();

    public string Name => "Holographic";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        var renderContext = new HolographicRenderContext
        {
            X = card.X - card.Width / 2,
            Y = card.Y - card.Height / 2,
            Width = card.Width,
            Height = card.Height,
            AnimationTime = animationTime,
            Card = card
        };

        var colorContext = CreateColorContext(card, animationTime);

        // Direct rendering without builder overhead
        _shadowEffect.Apply(canvas, renderContext, colorContext);
        _backgroundEffect.Apply(canvas, renderContext, colorContext);
        _overlayEffect.Apply(canvas, renderContext, colorContext);
        _borderEffect.Apply(canvas, renderContext, colorContext);
        _contentEffect.Apply(canvas, renderContext, colorContext);
    }

    private HolographicColorContext CreateColorContext(Card card, double animationTime)
    {
        var backgroundColors = backgroundSampler.SampleBackgroundRegion(
            card.X, card.Y, card.Width, card.Height);
        var avgBackgroundColor = ColorUtilities.AverageColors(backgroundColors);

        var shimmerOffset = (float)(animationTime * 100) % (card.Width + card.Height);
        var overlayColor = CalculateOverlayColor(card);

        return new HolographicColorContext
        {
            BackgroundColor = avgBackgroundColor,
            OverlayColor = overlayColor,
            ShimmerOffset = shimmerOffset,
            BackgroundBlendStrength = RenderingConstants.HolographicCardBackgroundBlendStrength,
            BaseOpacity = RenderingConstants.HolographicCardBaseOpacity
        };
    }

    private SKColor CalculateOverlayColor(Card card)
    {
        var overlayColor = card.EffectiveBaseColor;
        if (card is { BlendFactor: > 0, InfluencingCard: not null })
        {
            overlayColor = ColorUtilities.BlendColors(card.EffectiveBaseColor, card.InfluencingCard.EffectiveBaseColor,
                card.BlendFactor * 0.6f);
        }

        return overlayColor;
    }
}

internal class HolographicRenderContext
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public double AnimationTime { get; set; }
    public Card Card { get; set; } = null!;
}

internal class HolographicColorContext
{
    public SKColor BackgroundColor { get; set; }
    public SKColor OverlayColor { get; set; }
    public float ShimmerOffset { get; set; }
    public float BackgroundBlendStrength { get; set; }
    public float BaseOpacity { get; set; }
}

internal interface IHolographicEffect
{
    void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext);
}

internal class HolographicShadowEffect : IHolographicEffect
{
    public void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext)
    {
        using var shadowPaint = new SKPaint
        {
            IsAntialias = true,
            Color = context.Card.EffectiveBaseColor.WithAlpha((byte)(80 * context.Card.EffectiveOpacity)),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 20 + context.Card.EffectiveBlur)
        };
        canvas.DrawRoundRect(context.X + 8, context.Y + 8, context.Width, context.Height, 25, 25, shadowPaint);
    }
}

internal class HolographicBackgroundEffect : IHolographicEffect
{
    public void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext)
    {
        // Simplified with fewer colors for better performance
        var alpha = (byte)(40 * context.Card.EffectiveOpacity * colorContext.BaseOpacity);
        var holoColors = new[]
        {
            ColorUtilities.BlendColors(SKColor.Parse(RenderingColors.HolographicPink), colorContext.BackgroundColor,
                colorContext.BackgroundBlendStrength).WithAlpha(alpha),
            ColorUtilities.BlendColors(SKColor.Parse(RenderingColors.HolographicBlue), colorContext.BackgroundColor,
                colorContext.BackgroundBlendStrength).WithAlpha(alpha),
            ColorUtilities.BlendColors(SKColor.Parse(RenderingColors.HolographicPurple), colorContext.BackgroundColor,
                colorContext.BackgroundBlendStrength).WithAlpha(alpha)
        };

        using var holoPaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateLinearGradient(
                new SKPoint(context.X - colorContext.ShimmerOffset * 0.3f, context.Y),
                new SKPoint(context.X + context.Width + colorContext.ShimmerOffset * 0.3f, context.Y + context.Height),
                holoColors,
                null,
                SKShaderTileMode.Mirror)
        };

        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 25, 25, holoPaint);
    }
}

internal class HolographicOverlayEffect : IHolographicEffect
{
    public void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext)
    {
        using var overlayPaint = new SKPaint
        {
            IsAntialias = true,
            Color = colorContext.OverlayColor.WithAlpha((byte)(60 * context.Card.EffectiveOpacity)),
            BlendMode = SKBlendMode.Overlay
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 25, 25, overlayPaint);
    }
}

internal class HolographicBorderEffect : IHolographicEffect
{
    public void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext)
    {
        using var borderPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 2,
            Color = SKColor.Parse(RenderingColors.HolographicMagenta).WithAlpha(150)
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 25, 25, borderPaint);
    }
}

internal class HolographicContentEffect : IHolographicEffect
{
    private static readonly SKFont TitleFont = new(
        SKTypeface.FromFamilyName("Segoe UI", SKFontStyleWeight.Bold, SKFontStyleWidth.Normal,
            SKFontStyleSlant.Upright), 22);

    private static readonly SKPaint TitlePaint = new() { IsAntialias = true, Color = SKColors.White.WithAlpha(200) };

    public void Apply(SKCanvas canvas, HolographicRenderContext context, HolographicColorContext colorContext)
    {
        DrawSimpleTitle(canvas, context, colorContext);
        DrawSimplePattern(canvas, context, colorContext);
        DrawSimpleOrb(canvas, context, colorContext);
    }

    private void DrawSimpleTitle(SKCanvas canvas, HolographicRenderContext context,
        HolographicColorContext colorContext)
    {
        var title = HolographicTitleProvider.GetTitle(context.Card);
        canvas.DrawText(title, context.X + 20, context.Y + 40, TitleFont, TitlePaint);
    }

    private void DrawSimplePattern(SKCanvas canvas, HolographicRenderContext context,
        HolographicColorContext colorContext)
    {
        using var patternPaint = new SKPaint { IsAntialias = true, Color = colorContext.OverlayColor.WithAlpha(60) };

        // Reduce from 5 to 3 pattern lines for better performance
        for (var i = 0; i < 3; i++)
        {
            var patternY = context.Y + 60 + i * 25;
            var patternWidth = 80 + (float)(Math.Sin(context.AnimationTime * 1.5 + i) * 30);
            canvas.DrawRect(context.X + 20, patternY, patternWidth, 2, patternPaint);
        }
    }

    private void DrawSimpleOrb(SKCanvas canvas, HolographicRenderContext context,
        HolographicColorContext colorContext)
    {
        var orbX = context.X + context.Width - 35;
        var orbY = context.Y + 35;
        var orbSize = 10 + (float)(Math.Sin(context.AnimationTime * 2) * 2); // Reduced frequency and amplitude

        using var orbPaint = new SKPaint
        {
            IsAntialias = true, Color = SKColor.Parse(RenderingColors.HolographicMagenta).WithAlpha(150)
        };

        // Simple circle instead of complex radial gradient
        canvas.DrawCircle(orbX, orbY, orbSize, orbPaint);
    }
}

internal static class HolographicTitleProvider
{
    public static string GetTitle(Card card)
    {
        return card.BaseColor switch
        {
            var color when color == SKColors.CornflowerBlue => "HOLO-BLUE",
            var color when color == SKColors.Orange => "HOLO-ORANGE",
            var color when color == SKColors.White => "HOLO-CRYSTAL",
            _ => "HOLOGRAPHIC"
        };
    }
}
