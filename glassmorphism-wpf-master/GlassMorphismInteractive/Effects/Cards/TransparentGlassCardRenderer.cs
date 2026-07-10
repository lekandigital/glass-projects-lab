using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

public class TransparentGlassCardRenderer(IBackgroundSampler backgroundSampler) : ICardRenderer, IDisposable
{
    private readonly TransparentGlassAnimatedReflectionEffect _animatedReflectionEffect = new();
    private readonly TransparentGlassEdgeHighlightEffect _edgeHighlightEffect = new();
    private readonly TransparentGlassFrostingEffect _frostingEffect = new();
    private readonly TransparentGlassSurfaceEffect _glassSurfaceEffect = new();
    private readonly TransparentGlassRefractionEffect _refractionEffect = new();
    private readonly TransparentGlassShadowEffect _shadowEffect = new();

    public string Name => "Transparent Glass";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        var renderContext = CreateRenderContext(card, animationTime);
        var backgroundColorContext = CreateBackgroundColorContext(card);

        // Apply shadow first (lowest layer)
        _shadowEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);

        // Apply the main glass surface with directional bleeding (this is the key visual effect)
        _glassSurfaceEffect.Apply(canvas, renderContext, backgroundColorContext);

        // Apply subtle effects that enhance but don't overpower the glass surface
        _refractionEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _edgeHighlightEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);

        // Apply minimal frosting and animated reflection last (lightest effects on top)
        _frostingEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _animatedReflectionEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
    }

    public void Dispose()
    {
        _animatedReflectionEffect?.Dispose();
        _edgeHighlightEffect?.Dispose();
        _frostingEffect?.Dispose();
        _glassSurfaceEffect?.Dispose();
        _refractionEffect?.Dispose();
        _shadowEffect?.Dispose();
    }

    private TransparentGlassRenderContext CreateRenderContext(Card card, double animationTime)
    {
        return new TransparentGlassRenderContext
        {
            X = card.X - card.Width / 2,
            Y = card.Y - card.Height / 2,
            Width = card.Width,
            Height = card.Height,
            AnimationTime = animationTime,
            EffectiveOpacity = card.EffectiveOpacity
        };
    }

    private TransparentGlassBackgroundColorContext CreateBackgroundColorContext(Card card)
    {
        // Default to plain whitish glass colors
        var defaultGlassColor = new SKColor(248, 252, 255, 45); // Very light whitish glass

        // Convert card center position to top-left for sampling
        var cardCenterX = card.X;
        var cardCenterY = card.Y;

        // Sample the center area for base color using proper coordinates
        var backgroundColors = backgroundSampler.SampleBackgroundRegion(
            cardCenterX, cardCenterY, card.Width * 0.8f, card.Height * 0.8f, 16); // More samples for better averaging
        var avgBackgroundColor = ColorUtilities.AverageColors(backgroundColors);

        // Check if we have actual varied background content (not just fallback)
        var hasRealBackground = HasVariedBackgroundContent(backgroundColors);

        var baseBackgroundColor = defaultGlassColor;

        // Sample directional colors for bleeding effect
        var sampleSize = Math.Min(card.Width, card.Height) * 0.3f; // Smaller sample for more precise directional colors

        SKColor topColor, bottomColor, leftColor, rightColor, centerColor;

        if (hasRealBackground)
        {
            // Use enhanced background colors when real content is available
            baseBackgroundColor = ColorUtilities.EnhanceBackgroundForVisibility(avgBackgroundColor);

            // Sample actual background colors with less aggressive enhancement for more natural look
            topColor = ModeratelyEnhanceDirectionalColor(SampleDirectionalColor(cardCenterX,
                cardCenterY - card.Height * 0.4f, sampleSize));
            bottomColor =
                ModeratelyEnhanceDirectionalColor(SampleDirectionalColor(cardCenterX, cardCenterY + card.Height * 0.4f,
                    sampleSize));
            leftColor = ModeratelyEnhanceDirectionalColor(SampleDirectionalColor(cardCenterX - card.Width * 0.4f,
                cardCenterY, sampleSize));
            rightColor =
                ModeratelyEnhanceDirectionalColor(SampleDirectionalColor(cardCenterX + card.Width * 0.4f, cardCenterY,
                    sampleSize));
            centerColor =
                ModeratelyEnhanceDirectionalColor(SampleDirectionalColor(cardCenterX, cardCenterY, sampleSize));
        }
        else
        {
            // Use subtle variations of the default glass color for a plain glass look
            topColor = new SKColor(252, 255, 255, 35); // Slightly brighter top
            bottomColor = new SKColor(242, 248, 252, 40); // Slightly cooler bottom
            leftColor = new SKColor(245, 250, 255, 38); // Neutral left
            rightColor = new SKColor(250, 253, 255, 36); // Slightly warmer right
            centerColor = defaultGlassColor;
        }

        if (HasInfluencingCard(card))
        {
            baseBackgroundColor = BlendWithInfluencingCard(card, baseBackgroundColor);
            // Also blend the directional colors with influence
            var influenceStrength = card.BlendFactor * 0.3f;
            var influenceColor = card.InfluencingCard!.EffectiveBaseColor;

            topColor = ColorUtilities.BlendColors(topColor, influenceColor, influenceStrength);
            bottomColor = ColorUtilities.BlendColors(bottomColor, influenceColor, influenceStrength);
            leftColor = ColorUtilities.BlendColors(leftColor, influenceColor, influenceStrength);
            rightColor = ColorUtilities.BlendColors(rightColor, influenceColor, influenceStrength);
            centerColor = ColorUtilities.BlendColors(centerColor, influenceColor, influenceStrength);
        }

        return new TransparentGlassBackgroundColorContext
        {
            BaseColor = baseBackgroundColor,
            TopColor = topColor,
            BottomColor = bottomColor,
            LeftColor = leftColor,
            RightColor = rightColor,
            CenterColor = centerColor
        };
    }

    private bool HasVariedBackgroundContent(SKColor[] colors)
    {
        if (colors.Length <= 1)
        {
            return false;
        }

        // Check if colors have meaningful variation (not just fallback colors)
        var firstColor = colors[0];
        var hasVariation = false;
        var colorThreshold = 3; // Very sensitive threshold to detect even subtle color differences
        var significantVariationCount = 0;

        foreach (var color in colors)
        {
            if (Math.Abs(color.Red - firstColor.Red) > colorThreshold ||
                Math.Abs(color.Green - firstColor.Green) > colorThreshold ||
                Math.Abs(color.Blue - firstColor.Blue) > colorThreshold)
            {
                significantVariationCount++;
                if (significantVariationCount >= 2) // Need at least 2 different colors
                {
                    hasVariation = true;
                    break;
                }
            }
        }

        // Check if most colors are NOT the exact fallback value
        var fallbackCount = colors.Count(c => c.Red == 245 && c.Green == 250 && c.Blue == 255);
        var mostlyNotFallback = fallbackCount < colors.Length * 0.7f; // Less than 70% fallback colors

        // Also check for any meaningful alpha values which indicate real content
        var hasVariedAlpha = colors.Any(c => c.Alpha > 10 && c.Alpha < 245);

        // Consider content valid if we have color variation, varied alpha, or if it's mostly not fallback
        return hasVariation || hasVariedAlpha || mostlyNotFallback;
    }

    private SKColor SampleAndBlurDirectionalColor(float x, float y, float sampleSize)
    {
        // Sample a larger area for blur effect
        var colors =
            backgroundSampler.SampleBackgroundRegion(x, y, sampleSize * 1.5f, sampleSize * 1.5f); // 3x3 grid for blur
        var averageColor = ColorUtilities.AverageColors(colors);

        // Apply additional blur/smear effect by reducing saturation and increasing transparency
        var blurredColor = new SKColor(
            averageColor.Red,
            averageColor.Green,
            averageColor.Blue,
            (byte)(averageColor.Alpha * 0.6f) // More transparent for smear effect
        );

        return blurredColor;
    }

    private SKColor SampleDirectionalColor(float x, float y, float sampleSize)
    {
        // Use more samples for better averaging and reduce sampling artifacts
        var colors =
            backgroundSampler.SampleBackgroundRegion(x, y, sampleSize, sampleSize); // 3x3 grid for better sampling
        var averageColor = ColorUtilities.AverageColors(colors);

        // Check if all sampled colors are identical (indicating potential fallback/no data)
        var allIdentical = colors.Length > 1 && colors.All(c =>
            c.Red == colors[0].Red &&
            c.Green == colors[0].Green &&
            c.Blue == colors[0].Blue &&
            c.Alpha == colors[0].Alpha);

        // If we get all identical colors and they're the fallback color, add position-based variation
        if (allIdentical && averageColor.Red == 245 && averageColor.Green == 250 && averageColor.Blue == 255)
        {
            // Add subtle variation based on position to create directional differences
            var hash = (int)(x * 17 + y * 23) % 20; // Smaller variation range
            return new SKColor(
                (byte)Math.Max(0, Math.Min(255, averageColor.Red + hash - 10)),
                (byte)Math.Max(0, Math.Min(255, averageColor.Green + hash - 10)),
                (byte)Math.Max(0, Math.Min(255, averageColor.Blue + hash - 5)),
                Math.Max((byte)25, averageColor.Alpha));
        }

        // For real content, preserve the original color characteristics
        return averageColor;
    }

    private bool HasInfluencingCard(Card card)
    {
        return card.BlendFactor > 0 && card.InfluencingCard != null;
    }

    private SKColor BlendWithInfluencingCard(Card card, SKColor baseBackgroundColor)
    {
        var influenceBackgroundColors = backgroundSampler.SampleBackgroundRegion(
            card.InfluencingCard!.X, card.InfluencingCard.Y,
            card.InfluencingCard.Width, card.InfluencingCard.Height);

        var influenceBackgroundColor = ColorUtilities.AverageColors(influenceBackgroundColors);
        var enhancedInfluenceColor = ColorUtilities.EnhanceBackgroundForVisibility(influenceBackgroundColor);
        var blendStrength = card.BlendFactor * RenderingConstants.TransparentGlassCardBackgroundBlendStrength;

        return ColorUtilities.BlendColors(baseBackgroundColor, enhancedInfluenceColor, blendStrength);
    }

    private SKColor EnhanceDirectionalColor(SKColor color)
    {
        // Enhance the color for better visibility in glass effects
        var enhanced = ColorUtilities.EnhanceBackgroundForVisibility(color);

        // Increase saturation slightly more for directional colors to make them more prominent
        enhanced.ToHsv(out var h, out var s, out var v);
        s = Math.Min(100, s * 1.3f); // More saturation boost
        v = Math.Min(100, Math.Max(35, v * 1.15f)); // Slightly more brightness

        return SKColor.FromHsv(h, s, v);
    }

    private SKColor ModeratelyEnhanceDirectionalColor(SKColor color)
    {
        // Apply moderate enhancement for more natural glass effects
        var enhanced = ColorUtilities.EnhanceBackgroundForVisibility(color);

        // Apply more subtle adjustments for directional colors
        enhanced.ToHsv(out var h, out var s, out var v);
        s = Math.Min(100, s * 1.1f); // Gentle saturation boost
        v = Math.Min(100, Math.Max(30, v * 1.05f)); // Very gentle brightness adjustment

        // Preserve more of the original alpha for transparency
        var originalAlpha = color.Alpha;
        var enhancedColor = SKColor.FromHsv(h, s, v);

        return new SKColor(enhancedColor.Red, enhancedColor.Green, enhancedColor.Blue,
            Math.Max((byte)20, (byte)(originalAlpha * 0.8f))); // Preserve some transparency
    }
}

internal class TransparentGlassRenderContext
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public double AnimationTime { get; set; }
    public float EffectiveOpacity { get; set; }
}

internal class TransparentGlassBackgroundColorContext
{
    public SKColor BaseColor { get; set; }
    public SKColor TopColor { get; set; }
    public SKColor BottomColor { get; set; }
    public SKColor LeftColor { get; set; }
    public SKColor RightColor { get; set; }
    public SKColor CenterColor { get; set; }
}

internal interface ITransparentGlassEffect : IDisposable
{
    void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor);
}

internal interface ITransparentGlassDirectionalEffect : IDisposable
{
    void Apply(SKCanvas canvas, TransparentGlassRenderContext context,
        TransparentGlassBackgroundColorContext backgroundContext);
}

internal class TransparentGlassShadowEffect : ITransparentGlassEffect
{
    private readonly SKPaint _shadowPaint = new()
    {
        IsAntialias = true,
        Color = new SKColor(0, 0, 0, RenderingConstants.TransparentGlassCardShadowAlpha),
        MaskFilter =
            SKMaskFilter.CreateBlur(SKBlurStyle.Normal, RenderingConstants.TransparentGlassCardShadowBlur)
    };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor)
    {
        var shadowIntensity = context.EffectiveOpacity * 0.8f + 0.2f; // Minimum 20% shadow
        _shadowPaint.Color =
            _shadowPaint.Color.WithAlpha((byte)(RenderingConstants.TransparentGlassCardShadowAlpha * shadowIntensity));

        canvas.DrawRoundRect(
            context.X + RenderingConstants.TransparentGlassCardShadowOffset,
            context.Y + RenderingConstants.TransparentGlassCardShadowOffset,
            context.Width,
            context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius,
            _shadowPaint);
    }

    public void Dispose()
    {
        _shadowPaint?.Dispose();
    }
}

internal class TransparentGlassSurfaceEffect : ITransparentGlassDirectionalEffect
{
    private readonly SKPaint _depthGradientPaint = new() { IsAntialias = true };
    private readonly SKPaint _glassSurfacePaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context,
        TransparentGlassBackgroundColorContext backgroundContext)
    {
        // Increase base opacity for a more substantial glass appearance
        var baseOpacity =
            (byte)(RenderingConstants.TransparentGlassCardSurfaceBaseAlpha * 1.5f * context.EffectiveOpacity);
        baseOpacity = (byte)Math.Min(255, (int)baseOpacity); // Ensure we don't exceed 255

        // Create a glass surface with its own material properties while incorporating background bleeding
        DrawGlassWithMaterialProperties(canvas, context, backgroundContext, baseOpacity);

        // Add glass depth gradient for realistic glass thickness appearance
        var gradientAlpha = (byte)(40 * context.EffectiveOpacity); // Increased for more glass-like depth
        _depthGradientPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(context.X, context.Y),
            new SKPoint(context.X, context.Y + context.Height),
            [
                new SKColor(255, 255, 255, gradientAlpha), // Top highlight
                new SKColor(255, 255, 255, (byte)(gradientAlpha * 0.3f)), // Mid transparency
                new SKColor(0, 0, 0, (byte)(gradientAlpha * 0.6f)) // Bottom shadow for depth
            ],
            [0f, 0.6f, 1f],
            SKShaderTileMode.Clamp);

        canvas.DrawRoundRect(
            context.X,
            context.Y,
            context.Width,
            context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius,
            _depthGradientPaint);
    }

    public void Dispose()
    {
        _glassSurfacePaint?.Dispose();
        _depthGradientPaint?.Dispose();
    }

    private void DrawGlassWithMaterialProperties(SKCanvas canvas, TransparentGlassRenderContext context,
        TransparentGlassBackgroundColorContext backgroundContext, byte baseOpacity)
    {
        // Create a base glass material with its own color identity
        var glassBaseColor = new SKColor(240, 248, 255, (byte)(baseOpacity * 0.8f)); // Light blue-tinted glass base

        // Apply base glass material first
        _glassSurfacePaint.Shader = null;
        _glassSurfacePaint.Color = glassBaseColor;

        canvas.DrawRoundRect(
            context.X,
            context.Y,
            context.Width,
            context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius,
            _glassSurfacePaint);

        // Add subtle background color bleeding with reduced intensity for glass-like effect
        var blurRadius = Math.Min(context.Width, context.Height) * 0.2f;

        using var bleedingPaint = new SKPaint
        {
            IsAntialias = true,
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, blurRadius),
            BlendMode = SKBlendMode.Overlay // Use overlay blend for glass-like color mixing
        };

        // Vertical gradient with background colors at reduced intensity
        bleedingPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(context.X + context.Width * 0.5f, context.Y),
            new SKPoint(context.X + context.Width * 0.5f, context.Y + context.Height),
            [
                backgroundContext.TopColor.WithAlpha((byte)(baseOpacity * 0.4f)),
                backgroundContext.CenterColor.WithAlpha((byte)(baseOpacity * 0.3f)),
                backgroundContext.BottomColor.WithAlpha((byte)(baseOpacity * 0.4f))
            ],
            [0f, 0.5f, 1f],
            SKShaderTileMode.Clamp);

        canvas.DrawRoundRect(
            context.X, context.Y, context.Width, context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius, bleedingPaint);

        // Horizontal gradient with background colors for cross-directional bleeding
        bleedingPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(context.X, context.Y + context.Height * 0.5f),
            new SKPoint(context.X + context.Width, context.Y + context.Height * 0.5f),
            [
                backgroundContext.LeftColor.WithAlpha((byte)(baseOpacity * 0.3f)),
                backgroundContext.CenterColor.WithAlpha((byte)(baseOpacity * 0.2f)),
                backgroundContext.RightColor.WithAlpha((byte)(baseOpacity * 0.3f))
            ],
            [0f, 0.5f, 1f],
            SKShaderTileMode.Clamp);

        canvas.DrawRoundRect(
            context.X, context.Y, context.Width, context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius, bleedingPaint);
    }
}

internal class TransparentGlassFrostingEffect : ITransparentGlassEffect
{
    private readonly SKPaint _frostPaint = new()
    {
        IsAntialias = true,
        Color = new SKColor(255, 255, 255, RenderingConstants.TransparentGlassCardFrostAlpha),
        MaskFilter =
            SKMaskFilter.CreateBlur(SKBlurStyle.Normal, RenderingConstants.TransparentGlassCardFrostBlur)
    };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor)
    {
        // Increase frosting for more substantial glass material appearance
        var frostIntensity = context.EffectiveOpacity * 0.5f + 0.3f; // Increased from 0.3f + 0.1f
        _frostPaint.Color =
            _frostPaint.Color.WithAlpha((byte)(RenderingConstants.TransparentGlassCardFrostAlpha *
                                               frostIntensity)); // Removed additional 50% reduction

        canvas.DrawRoundRect(
            context.X + RenderingConstants.TransparentGlassCardFrostOffset,
            context.Y + RenderingConstants.TransparentGlassCardFrostOffset,
            context.Width - RenderingConstants.TransparentGlassCardFrostOffset * 2,
            context.Height - RenderingConstants.TransparentGlassCardFrostOffset * 2,
            RenderingConstants.TransparentGlassCardCornerRadius - RenderingConstants.TransparentGlassCardFrostOffset,
            RenderingConstants.TransparentGlassCardCornerRadius - RenderingConstants.TransparentGlassCardFrostOffset,
            _frostPaint);
    }

    public void Dispose()
    {
        _frostPaint?.Dispose();
    }
}

internal class TransparentGlassRefractionEffect : ITransparentGlassEffect
{
    private readonly SKPaint _refractionPaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor)
    {
        var refractionIntensity = context.EffectiveOpacity;

        // Create more sophisticated refraction gradient that simulates light bending through glass
        var angle = (float)(context.AnimationTime * 0.5) % (float)(Math.PI * 2);
        var centerX = context.X + context.Width / 2;
        var centerY = context.Y + context.Height / 2;
        var gradientRadius = Math.Max(context.Width, context.Height) * 0.7f;

        var startX = centerX + (float)Math.Cos(angle) * gradientRadius * 0.3f;
        var startY = centerY + (float)Math.Sin(angle) * gradientRadius * 0.3f;
        var endX = centerX - (float)Math.Cos(angle) * gradientRadius * 0.3f;
        var endY = centerY - (float)Math.Sin(angle) * gradientRadius * 0.3f;

        _refractionPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(startX, startY),
            new SKPoint(endX, endY),
            [
                new SKColor(backgroundColor.Red, backgroundColor.Green, backgroundColor.Blue,
                    (byte)(RenderingConstants.TransparentGlassCardRefractionMaxAlpha * refractionIntensity)),
                new SKColor(255, 255, 255,
                    (byte)(RenderingConstants.TransparentGlassCardRefractionMinAlpha * refractionIntensity)),
                new SKColor(backgroundColor.Red, backgroundColor.Green, backgroundColor.Blue,
                    (byte)(RenderingConstants.TransparentGlassCardRefractionMidAlpha * refractionIntensity))
            ],
            [0f, 0.5f, 1f],
            SKShaderTileMode.Clamp);

        canvas.DrawRoundRect(
            context.X + 1,
            context.Y + 1,
            context.Width - 2,
            context.Height - 2,
            RenderingConstants.TransparentGlassCardCornerRadius - 1,
            RenderingConstants.TransparentGlassCardCornerRadius - 1,
            _refractionPaint);
    }

    public void Dispose()
    {
        _refractionPaint?.Dispose();
    }
}

internal class TransparentGlassEdgeHighlightEffect : ITransparentGlassEffect
{
    private readonly SKPaint _innerEdgePaint = new()
    {
        IsAntialias = true,
        Style = SKPaintStyle.Stroke,
        StrokeWidth = RenderingConstants.TransparentGlassCardInnerStrokeWidth,
        Color = new SKColor(255, 255, 255, RenderingConstants.TransparentGlassCardInnerHighlightAlpha)
    };
    private readonly SKPaint _outerEdgePaint = new()
    {
        IsAntialias = true,
        Style = SKPaintStyle.Stroke,
        StrokeWidth = RenderingConstants.TransparentGlassCardOuterStrokeWidth,
        Color = new SKColor(255, 255, 255, RenderingConstants.TransparentGlassCardOuterHighlightAlpha)
    };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor)
    {
        var highlightIntensity = context.EffectiveOpacity * 0.8f + 0.6f; // Increased for more prominent glass borders

        // Outer edge highlight - make it more visible for glass material appearance
        _outerEdgePaint.Color = _outerEdgePaint.Color.WithAlpha(
            (byte)Math.Min(255,
                RenderingConstants.TransparentGlassCardOuterHighlightAlpha * highlightIntensity * 1.5f));
        canvas.DrawRoundRect(
            context.X,
            context.Y,
            context.Width,
            context.Height,
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius,
            _outerEdgePaint);

        // Inner edge highlight - also increased for glass definition
        _innerEdgePaint.Color = _innerEdgePaint.Color.WithAlpha(
            (byte)Math.Min(255,
                RenderingConstants.TransparentGlassCardInnerHighlightAlpha * highlightIntensity * 1.3f));
        canvas.DrawRoundRect(
            context.X + RenderingConstants.TransparentGlassCardFrostOffset,
            context.Y + RenderingConstants.TransparentGlassCardFrostOffset,
            context.Width - RenderingConstants.TransparentGlassCardFrostOffset * 2,
            context.Height - RenderingConstants.TransparentGlassCardFrostOffset * 2,
            RenderingConstants.TransparentGlassCardCornerRadius - RenderingConstants.TransparentGlassCardFrostOffset,
            RenderingConstants.TransparentGlassCardCornerRadius - RenderingConstants.TransparentGlassCardFrostOffset,
            _innerEdgePaint);
    }

    public void Dispose()
    {
        _innerEdgePaint?.Dispose();
        _outerEdgePaint?.Dispose();
    }
}

internal class TransparentGlassAnimatedReflectionEffect : ITransparentGlassEffect
{
    private readonly SKPaint _reflectionPaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, TransparentGlassRenderContext context, SKColor backgroundColor)
    {
        var reflectionOffset = (float)(context.AnimationTime * RenderingConstants.TransparentGlassCardReflectionSpeed) %
                               (context.Width + RenderingConstants.TransparentGlassCardReflectionStartOffset * 2);
        var reflectionX = context.X - RenderingConstants.TransparentGlassCardReflectionStartOffset + reflectionOffset;
        var reflectionY = context.Y + context.Height * RenderingConstants.TransparentGlassCardReflectionTopRatio;
        var reflectionHeight = context.Height * RenderingConstants.TransparentGlassCardReflectionHeightRatio;

        var reflectionIntensity = context.EffectiveOpacity * 0.8f + 0.2f; // Minimum 20% reflection

        _reflectionPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(reflectionX, reflectionY),
            new SKPoint(reflectionX + RenderingConstants.TransparentGlassCardReflectionWidth,
                reflectionY + reflectionHeight),
            [
                SKColors.Transparent,
                new SKColor(255, 255, 255,
                    (byte)(RenderingConstants.TransparentGlassCardReflectionPeakAlpha * reflectionIntensity)),
                new SKColor(255, 255, 255,
                    (byte)(RenderingConstants.TransparentGlassCardReflectionMidAlpha * reflectionIntensity)),
                SKColors.Transparent
            ],
            [0f, 0.3f, 0.7f, 1f],
            SKShaderTileMode.Clamp);

        // Clip the reflection to the card bounds
        canvas.Save();
        var clipPath = new SKPath();
        clipPath.AddRoundRect(new SKRoundRect(
            new SKRect(context.X, context.Y, context.X + context.Width, context.Y + context.Height),
            RenderingConstants.TransparentGlassCardCornerRadius,
            RenderingConstants.TransparentGlassCardCornerRadius));
        canvas.ClipPath(clipPath);
        canvas.DrawRect(reflectionX, reflectionY, RenderingConstants.TransparentGlassCardReflectionWidth,
            reflectionHeight, _reflectionPaint);
        canvas.Restore();
    }

    public void Dispose()
    {
        _reflectionPaint?.Dispose();
    }
}
