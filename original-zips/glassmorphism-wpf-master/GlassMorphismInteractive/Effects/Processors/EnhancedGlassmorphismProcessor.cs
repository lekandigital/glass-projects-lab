using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Processors;

public class EnhancedGlassmorphismProcessor : IGlassmorphismEffectProcessor
{
    private const float MAX_INTERACTION_DISTANCE = 450f;
    private const float MAGNETIC_THRESHOLD = 250f;
    private const float COLOR_HARMONY_DISTANCE = 300f;

    // Cache for reusable arrays to reduce allocations
    private float[]? _cachedInfluenceArray;
    private int _lastCardCount;

    public string Name => "Enhanced Glassmorphism";

    public void UpdateEffects(IEnumerable<Card> cards, double animationTime)
    {
        var cardList = cards.ToList();
        var cardCount = cardList.Count;

        // Optimize array allocation
        if (_cachedInfluenceArray == null || _lastCardCount != cardCount)
        {
            _cachedInfluenceArray = new float[cardCount];
            _lastCardCount = cardCount;
        }

        // Calculate simplified network influence (O(n²) instead of O(n³))
        CalculateOptimizedNetworkInfluence(cardList, animationTime, _cachedInfluenceArray);

        // Apply enhanced effects to each card
        for (var i = 0; i < cardCount; i++)
        {
            var card = cardList[i];
            var maxBlendFactor = 0f;
            Card? mostInfluentialCard = null;
            var totalInfluence = 0f;
            var harmonyBonus = 0f;

            // Single pass through other cards (O(n) per card)
            for (var j = 0; j < cardCount; j++)
            {
                if (i == j)
                {
                    continue;
                }

                var otherCard = cardList[j];
                var distance = CalculateDistance(card, otherCard);
                var blendFactor = CalculateEnhancedBlendFactor(distance, animationTime);

                totalInfluence += blendFactor;

                if (blendFactor > maxBlendFactor)
                {
                    maxBlendFactor = blendFactor;
                    mostInfluentialCard = otherCard;
                }

                // Simplified color harmony calculation
                if (distance < COLOR_HARMONY_DISTANCE)
                {
                    harmonyBonus += CalculateSimplifiedColorHarmony(card, otherCard) * blendFactor;
                }
            }

            // Enhanced blending with simplified network effects
            var networkBonus = _cachedInfluenceArray[i] * 0.2f; // Reduced intensity
            var finalBlendFactor = Math.Min(1.0f, maxBlendFactor + totalInfluence * 0.1f + networkBonus + harmonyBonus);

            // Smoother transitions
            card.BlendFactor = SmoothStepAdvanced(card.BlendFactor, finalBlendFactor, 0.12f, animationTime);
            card.InfluencingCard = mostInfluentialCard;

            // Apply optimized properties
            UpdateOptimizedCardProperties(card, totalInfluence, _cachedInfluenceArray[i], harmonyBonus, animationTime);
        }
    }

    private void CalculateOptimizedNetworkInfluence(IList<Card> cards, double animationTime, float[] influence)
    {
        var cardCount = cards.Count;

        for (var i = 0; i < cardCount; i++)
        {
            var networkEffect = 0f;
            var connectionCount = 0;

            // Simplified network calculation - just count nearby connections
            for (var j = 0; j < cardCount; j++)
            {
                if (i == j)
                {
                    continue;
                }

                var distance = CalculateDistance(cards[i], cards[j]);
                if (distance < MAX_INTERACTION_DISTANCE)
                {
                    networkEffect += 1f / (1f + distance * 0.01f);
                    connectionCount++;
                }
            }

            // Network effect based on connection density
            influence[i] = Math.Min(0.5f, networkEffect * 0.1f + connectionCount * 0.05f);
        }
    }

    private float CalculateSimplifiedColorHarmony(Card card1, Card card2)
    {
        var color1 = card1.BaseColor;
        var color2 = card2.BaseColor;

        // Simplified harmony calculation
        if ((color1 == SKColors.CornflowerBlue && color2 == SKColors.Orange) ||
            (color1 == SKColors.Orange && color2 == SKColors.CornflowerBlue))
        {
            return 0.3f; // Complementary colors
        }

        if (color1 == SKColors.White || color2 == SKColors.White)
        {
            return 0.15f; // White harmonizes with everything
        }

        return 0.05f; // Base harmony
    }

    private void UpdateOptimizedCardProperties(Card card, float totalInfluence, float networkInfluence,
        float harmonyBonus, double animationTime)
    {
        // Simplified opacity changes with gentle pulsing
        var baseOpacity = card.BaseColor == SKColors.White ? 0.6f : 0.8f;
        var gentlePulse = (float)(0.1 * Math.Sin(animationTime * 2));
        var harmonyGlow = harmonyBonus * 0.2f;

        var targetOpacity = baseOpacity + card.BlendFactor * 0.3f + gentlePulse + harmonyGlow;
        card.Opacity = SmoothStepAdvanced(card.Opacity, Math.Max(0.3f, Math.Min(1.0f, targetOpacity)), 0.08f,
            animationTime);

        // Simplified blur with less intensity
        var targetBlur = card.BlendFactor * 12f + totalInfluence * 5f + networkInfluence * 8f;
        card.Blur = SmoothStepAdvanced(card.Blur, targetBlur, 0.1f, animationTime);

        // Simplified saturation
        var targetSaturation = card.BaseColor == SKColors.White
            ? 0.2f + card.BlendFactor * 0.8f + harmonyBonus
            : 0.8f + card.BlendFactor * 0.3f;

        card.Saturation = SmoothStepAdvanced(card.Saturation, Math.Max(0, Math.Min(1.5f, targetSaturation)), 0.08f,
            animationTime);
    }

    private static float CalculateEnhancedBlendFactor(float distance, double animationTime)
    {
        if (distance > MAX_INTERACTION_DISTANCE)
        {
            return 0f;
        }

        // Simplified enhanced curve
        var normalizedDistance = distance / MAX_INTERACTION_DISTANCE;
        var baseFactor = (float)Math.Pow(1f - normalizedDistance, 2.0f);

        // Magnetic attraction for close cards (simplified)
        if (distance < MAGNETIC_THRESHOLD)
        {
            var magneticIntensity = (MAGNETIC_THRESHOLD - distance) / MAGNETIC_THRESHOLD;
            baseFactor += magneticIntensity * 0.4f;
        }

        // Gentle time-based variation
        var timeFactor = (float)(0.1 * Math.Sin(animationTime * 1.5f + distance * 0.01f));

        return Math.Min(1.0f, baseFactor + timeFactor);
    }

    private static float SmoothStepAdvanced(float current, float target, float factor, double animationTime)
    {
        // Simplified smooth step without micro-oscillations
        var difference = target - current;
        var adjustedFactor = factor * (1f + Math.Abs(difference) * 0.3f);

        return current + difference * Math.Min(1f, adjustedFactor);
    }

    private static float CalculateDistance(Card card1, Card card2)
    {
        var dx = card1.X - card2.X;
        var dy = card1.Y - card2.Y;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }
}
