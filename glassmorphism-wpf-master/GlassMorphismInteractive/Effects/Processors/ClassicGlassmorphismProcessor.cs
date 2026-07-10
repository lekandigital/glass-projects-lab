using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Processors;

public class ClassicGlassmorphismProcessor : IGlassmorphismEffectProcessor
{
    private const float MAX_INTERACTION_DISTANCE = 400f;
    public string Name => "Classic Glassmorphism";

    public void UpdateEffects(IEnumerable<Card> cards, double animationTime)
    {
        var cardList = cards.ToList();

        // Calculate all pairwise interactions
        for (var i = 0; i < cardList.Count; i++)
        {
            var card1 = cardList[i];
            var maxBlendFactor = 0f;
            Card? mostInfluentialCard = null;

            for (var j = 0; j < cardList.Count; j++)
            {
                if (i == j)
                {
                    continue;
                }

                var card2 = cardList[j];
                var distance = CalculateDistance(card1, card2);
                var blendFactor = CalculateBlendFactor(distance);

                if (blendFactor > maxBlendFactor)
                {
                    maxBlendFactor = blendFactor;
                    mostInfluentialCard = card2;
                }
            }

            // Apply smooth blend factor changes
            card1.BlendFactor = SmoothStep(card1.BlendFactor, maxBlendFactor, 0.1f);
            card1.InfluencingCard = mostInfluentialCard;

            // Update glassmorphism properties based on interactions
            UpdateCardProperties(card1);
        }
    }

    private void UpdateCardProperties(Card card)
    {
        // Use centralized constants for base opacity values
        var targetOpacity = card.BaseColor == SKColors.White
            ? UiConstants.DefaultWhiteCardOpacity
            : UiConstants.DefaultColoredCardOpacity;
        targetOpacity += card.BlendFactor * 0.2f;
        card.Opacity = SmoothStep(card.Opacity, targetOpacity, 0.05f);

        // Adjust blur based on movement and interaction
        var targetBlur = card.BlendFactor * 8f;
        card.Blur = SmoothStep(card.Blur, targetBlur, 0.08f);

        // Adjust saturation for white card color bleeding
        if (card.BaseColor == SKColors.White)
        {
            var targetSaturation = UiConstants.DefaultWhiteCardSaturation + card.BlendFactor * 0.7f;
            card.Saturation = SmoothStep(card.Saturation, targetSaturation, 0.05f);
        }
    }

    private static float CalculateDistance(Card card1, Card card2)
    {
        var dx = card1.X - card2.X;
        var dy = card1.Y - card2.Y;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    private static float CalculateBlendFactor(float distance)
    {
        return Math.Max(0, (MAX_INTERACTION_DISTANCE - distance) / MAX_INTERACTION_DISTANCE);
    }

    private static float SmoothStep(float current, float target, float factor)
    {
        return current + (target - current) * factor;
    }
}
