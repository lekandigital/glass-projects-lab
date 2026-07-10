using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Utilities;

/// <summary>
///     Advanced color bleeding utility for realistic glassmorphism effects.
///     Implements physically-based color bleeding algorithms including:
///     - Distance-based attenuation
///     - Angular dispersion
///     - Multi-layer color interaction
///     - Chromatic aberration simulation
/// </summary>
public static class ColorBleedingUtilities
{
    private const float MAX_BLEEDING_DISTANCE = 400f;
    private const float CHROMATIC_ABERRATION_STRENGTH = 0.15f;
    private const float ANGULAR_DISPERSION_FACTOR = 0.3f;
    private const float LIGHT_REFRACTION_INDEX = 1.5f;

    /// <summary>
    ///     Calculates accurate color bleeding between two cards with physical light dispersion
    /// </summary>
    private static ColorBleedingResult CalculateColorBleeding(
        Card sourceCard,
        Card targetCard,
        IBackgroundSampler backgroundSampler,
        double animationTime)
    {
        var distance = CalculateDistance(sourceCard, targetCard);
        if (distance > MAX_BLEEDING_DISTANCE)
        {
            return new ColorBleedingResult { BleedingStrength = 0f };
        }

        // Calculate basic attenuation based on distance
        var baseAttenuation = CalculateDistanceAttenuation(distance);

        // Calculate angular dispersion effect
        var angularDispersion = CalculateAngularDispersion(sourceCard, targetCard, animationTime);

        // Calculate chromatic aberration (color separation)
        var chromaticAberration = CalculateChromaticAberration(sourceCard, targetCard, distance);

        // Sample intermediate colors between cards
        var intermediateColors = SampleIntermediateColors(sourceCard, targetCard, backgroundSampler);

        // Calculate refracted color bleeding through background medium
        var refractedColors = CalculateRefractedBleeding(
            sourceCard.EffectiveBaseColor,
            sourceCard.EffectiveSecondaryColor,
            intermediateColors,
            distance,
            angularDispersion);

        return new ColorBleedingResult
        {
            BleedingStrength = baseAttenuation * angularDispersion.Intensity,
            PrimaryBleedColor = ApplyChromaticAberration(refractedColors.Primary, chromaticAberration),
            SecondaryBleedColor = ApplyChromaticAberration(refractedColors.Secondary, chromaticAberration),
            EdgeBleedColor = refractedColors.Edge,
            DispersionAngle = angularDispersion.Angle,
            AngularIntensity = angularDispersion.Intensity
        };
    }

    /// <summary>
    ///     Calculates multi-card color bleeding for complex interactions
    /// </summary>
    public static MultiCardBleedingResult CalculateMultiCardBleeding(
        Card targetCard,
        IEnumerable<Card> sourceCards,
        IBackgroundSampler backgroundSampler,
        double animationTime)
    {
        var result = new MultiCardBleedingResult();
        var totalWeight = 0f;

        foreach (var sourceCard in sourceCards)
        {
            if (sourceCard == targetCard)
            {
                continue;
            }

            var bleeding = CalculateColorBleeding(sourceCard, targetCard, backgroundSampler, animationTime);
            if (bleeding.BleedingStrength <= 0.01f)
            {
                continue;
            }

            var weight = bleeding.BleedingStrength;
            result.AccumulatedPrimaryColor = BlendColorsWeighted(
                result.AccumulatedPrimaryColor,
                bleeding.PrimaryBleedColor,
                weight,
                totalWeight);

            result.AccumulatedSecondaryColor = BlendColorsWeighted(
                result.AccumulatedSecondaryColor,
                bleeding.SecondaryBleedColor,
                weight,
                totalWeight);

            result.AccumulatedEdgeColor = BlendColorsWeighted(
                result.AccumulatedEdgeColor,
                bleeding.EdgeBleedColor,
                weight,
                totalWeight);

            result.TotalBleedingStrength += weight;
            totalWeight += weight;
        }

        // Normalize bleeding strength
        result.TotalBleedingStrength = Math.Min(1f, result.TotalBleedingStrength);

        return result;
    }

    /// <summary>
    ///     Creates directional color bleeding gradients for realistic edge effects
    /// </summary>
    public static DirectionalBleedingGradient CreateDirectionalBleedingGradient(
        SKRect cardBounds,
        MultiCardBleedingResult bleeding,
        Card targetCard,
        IEnumerable<Card> sourceCards)
    {
        var gradient = new DirectionalBleedingGradient();

        // Calculate directional influences
        var influences = new Dictionary<CardDirection, (SKColor Color, float Strength)>();

        foreach (var sourceCard in sourceCards)
        {
            if (sourceCard == targetCard)
            {
                continue;
            }

            var direction = CalculateCardDirection(targetCard, sourceCard);
            var distance = CalculateDistance(targetCard, sourceCard);
            var strength = CalculateDistanceAttenuation(distance);

            if (strength > 0.01f)
            {
                var bleedColor = BlendCardColors(sourceCard.EffectiveBaseColor, sourceCard.EffectiveSecondaryColor,
                    0.7f);

                if (influences.TryGetValue(direction, out var existing))
                {
                    influences[direction] = (
                        ColorUtilities.BlendColors(existing.Color, bleedColor,
                            strength / (existing.Strength + strength)),
                        existing.Strength + strength
                    );
                }
                else
                {
                    influences[direction] = (bleedColor, strength);
                }
            }
        }

        // Create gradient based on directional influences
        gradient.TopColor = influences.GetValueOrDefault(CardDirection.Top).Color;
        gradient.BottomColor = influences.GetValueOrDefault(CardDirection.Bottom).Color;
        gradient.LeftColor = influences.GetValueOrDefault(CardDirection.Left).Color;
        gradient.RightColor = influences.GetValueOrDefault(CardDirection.Right).Color;

        gradient.TopStrength = influences.GetValueOrDefault(CardDirection.Top).Strength;
        gradient.BottomStrength = influences.GetValueOrDefault(CardDirection.Bottom).Strength;
        gradient.LeftStrength = influences.GetValueOrDefault(CardDirection.Left).Strength;
        gradient.RightStrength = influences.GetValueOrDefault(CardDirection.Right).Strength;

        return gradient;
    }

    private static float CalculateDistance(Card card1, Card card2)
    {
        var dx = card1.X - card2.X;
        var dy = card1.Y - card2.Y;
        return (float)Math.Sqrt(dx * dx + dy * dy);
    }

    private static float CalculateDistanceAttenuation(float distance)
    {
        if (distance >= MAX_BLEEDING_DISTANCE)
        {
            return 0f;
        }

        // Realistic inverse square law with minimum threshold
        var normalizedDistance = distance / MAX_BLEEDING_DISTANCE;
        var attenuation = 1f / (1f + normalizedDistance * normalizedDistance * 9f);

        // Apply smooth falloff
        return (float)Math.Pow(attenuation, 0.8);
    }

    private static AngularDispersion CalculateAngularDispersion(Card sourceCard, Card targetCard, double animationTime)
    {
        var dx = targetCard.X - sourceCard.X;
        var dy = targetCard.Y - sourceCard.Y;
        var angle = (float)Math.Atan2(dy, dx);

        // Add subtle animation to dispersion
        var animationOffset = (float)(Math.Sin(animationTime * 0.5) * 0.1);
        var adjustedAngle = angle + animationOffset;

        // Calculate intensity based on angle and distance
        var distance = (float)Math.Sqrt(dx * dx + dy * dy);
        var intensity = CalculateDistanceAttenuation(distance) *
                        (1f + ANGULAR_DISPERSION_FACTOR * (float)Math.Sin(adjustedAngle * 2));

        return new AngularDispersion { Angle = adjustedAngle, Intensity = Math.Max(0f, intensity) };
    }

    private static ChromaticAberration CalculateChromaticAberration(Card sourceCard, Card targetCard, float distance)
    {
        var normalizedDistance = distance / MAX_BLEEDING_DISTANCE;
        var aberrationStrength = CHROMATIC_ABERRATION_STRENGTH * normalizedDistance;

        return new ChromaticAberration
        {
            RedShift = aberrationStrength * 0.8f,
            GreenShift = aberrationStrength * 0.5f,
            BlueShift = aberrationStrength * 1.2f
        };
    }

    private static SKColor[] SampleIntermediateColors(Card sourceCard, Card targetCard,
        IBackgroundSampler backgroundSampler)
    {
        var samples = new List<SKColor>();
        var sampleCount = 5;

        for (var i = 0; i <= sampleCount; i++)
        {
            var t = (float)i / sampleCount;
            var x = sourceCard.X + (targetCard.X - sourceCard.X) * t;
            var y = sourceCard.Y + (targetCard.Y - sourceCard.Y) * t;

            samples.Add(backgroundSampler.SampleBackgroundAt(x, y));
        }

        return samples.ToArray();
    }

    private static RefractedColors CalculateRefractedBleeding(
        SKColor primaryColor,
        SKColor secondaryColor,
        SKColor[] intermediateColors,
        float distance,
        AngularDispersion dispersion)
    {
        var avgIntermediate = ColorUtilities.AverageColors(intermediateColors);
        var refractionFactor = 1f / LIGHT_REFRACTION_INDEX;
        var distanceAttenuation = CalculateDistanceAttenuation(distance);

        // Simulate light refraction through the medium
        var refractedPrimary =
            BlendWithRefraction(primaryColor, avgIntermediate, refractionFactor * distanceAttenuation);
        var refractedSecondary =
            BlendWithRefraction(secondaryColor, avgIntermediate, refractionFactor * distanceAttenuation * 0.8f);

        // Create edge color with enhanced dispersion
        var edgeColor = ColorUtilities.BlendColors(refractedPrimary, refractedSecondary, 0.6f);
        edgeColor = AdjustColorIntensity(edgeColor, dispersion.Intensity);

        return new RefractedColors { Primary = refractedPrimary, Secondary = refractedSecondary, Edge = edgeColor };
    }

    private static SKColor ApplyChromaticAberration(SKColor color, ChromaticAberration aberration)
    {
        var r = (byte)Math.Min(255, Math.Max(0, color.Red + aberration.RedShift * 255));
        var g = (byte)Math.Min(255, Math.Max(0, color.Green + aberration.GreenShift * 255));
        var b = (byte)Math.Min(255, Math.Max(0, color.Blue + aberration.BlueShift * 255));

        return new SKColor(r, g, b, color.Alpha);
    }

    private static SKColor BlendColorsWeighted(SKColor color1, SKColor color2, float weight2, float totalWeight)
    {
        if (totalWeight <= 0)
        {
            return color2;
        }

        var factor = weight2 / (totalWeight + weight2);
        return ColorUtilities.BlendColors(color1, color2, factor);
    }

    private static SKColor BlendWithRefraction(SKColor color, SKColor medium, float refractionFactor)
    {
        var blendFactor = Math.Min(0.7f, refractionFactor);
        return ColorUtilities.BlendColors(color, medium, blendFactor);
    }

    private static SKColor AdjustColorIntensity(SKColor color, float intensity)
    {
        var factor = Math.Min(1.5f, 1f + intensity);
        return new SKColor(
            (byte)Math.Min(255, color.Red * factor),
            (byte)Math.Min(255, color.Green * factor),
            (byte)Math.Min(255, color.Blue * factor),
            color.Alpha);
    }

    private static SKColor BlendCardColors(SKColor primary, SKColor secondary, float ratio)
    {
        return ColorUtilities.BlendColors(primary, secondary, ratio);
    }

    private static CardDirection CalculateCardDirection(Card center, Card other)
    {
        var dx = other.X - center.X;
        var dy = other.Y - center.Y;
        var angle = Math.Atan2(dy, dx) * 180 / Math.PI;

        // Normalize angle to 0-360
        if (angle < 0)
        {
            angle += 360;
        }

        return angle switch
        {
            >= 315 or < 45 => CardDirection.Right,
            >= 45 and < 135 => CardDirection.Bottom,
            >= 135 and < 225 => CardDirection.Left,
            _ => CardDirection.Top
        };
    }
}

public struct ColorBleedingResult
{
    public float BleedingStrength { get; set; }
    public SKColor PrimaryBleedColor { get; set; }
    public SKColor SecondaryBleedColor { get; set; }
    public SKColor EdgeBleedColor { get; set; }
    public float DispersionAngle { get; set; }
    public float AngularIntensity { get; set; }
}

public struct MultiCardBleedingResult
{
    public SKColor AccumulatedPrimaryColor { get; set; }
    public SKColor AccumulatedSecondaryColor { get; set; }
    public SKColor AccumulatedEdgeColor { get; set; }
    public float TotalBleedingStrength { get; set; }
}

public struct DirectionalBleedingGradient
{
    public SKColor TopColor { get; set; }
    public SKColor BottomColor { get; set; }
    public SKColor LeftColor { get; set; }
    public SKColor RightColor { get; set; }
    public float TopStrength { get; set; }
    public float BottomStrength { get; set; }
    public float LeftStrength { get; set; }
    public float RightStrength { get; set; }
}

internal struct AngularDispersion
{
    public float Angle { get; set; }
    public float Intensity { get; set; }
}

internal struct ChromaticAberration
{
    public float RedShift { get; set; }
    public float GreenShift { get; set; }
    public float BlueShift { get; set; }
}

internal struct RefractedColors
{
    public SKColor Primary { get; set; }
    public SKColor Secondary { get; set; }
    public SKColor Edge { get; set; }
}

public enum CardDirection
{
    Top,
    Right,
    Bottom,
    Left
}
