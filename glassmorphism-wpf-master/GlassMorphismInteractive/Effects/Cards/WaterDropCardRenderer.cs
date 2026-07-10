using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

public class WaterDropCardRenderer(IBackgroundSampler backgroundSampler) : ICardRenderer, IDisposable
{
    private readonly WaterDropCausticsEffect _causticsEffect = new();
    private readonly WaterDropHighlightEffect _highlightEffect = new();
    private readonly WaterDropMeniscusEffect _meniscusEffect = new();
    private readonly WaterDropRefractionEffect _refractionEffect = new();
    private readonly WaterDropRippleEffect _rippleEffect = new();
    private readonly WaterDropShadowEffect _shadowEffect = new();
    private readonly WaterDropSurfaceEffect _surfaceEffect = new();

    public string Name => "Water Drop";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        var renderContext = CreateRenderContext(card, animationTime);
        var backgroundColorContext = CreateBackgroundColorContext(card);

        // Render water drop effects in proper layering order
        _shadowEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _meniscusEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _refractionEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _surfaceEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _causticsEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _rippleEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
        _highlightEffect.Apply(canvas, renderContext, backgroundColorContext.BaseColor);
    }

    public void Dispose()
    {
        _shadowEffect.Dispose();
        _meniscusEffect.Dispose();
        _refractionEffect.Dispose();
        _causticsEffect.Dispose();
        _rippleEffect.Dispose();
        _highlightEffect.Dispose();
        _surfaceEffect.Dispose();
    }

    private WaterDropRenderContext CreateRenderContext(Card card, double animationTime)
    {
        return new WaterDropRenderContext
        {
            X = card.X - card.Width / 2,
            Y = card.Y - card.Height / 2,
            Width = card.Width,
            Height = card.Height,
            CenterX = card.X,
            CenterY = card.Y,
            AnimationTime = animationTime,
            EffectiveOpacity = card.EffectiveOpacity
        };
    }

    private WaterDropBackgroundColorContext CreateBackgroundColorContext(Card card)
    {
        var backgroundColors = backgroundSampler.SampleBackgroundRegion(
            card.X, card.Y, card.Width, card.Height);
        var avgBackgroundColor = ColorUtilities.AverageColors(backgroundColors);
        var baseBackgroundColor = ColorUtilities.EnhanceBackgroundForVisibility(avgBackgroundColor);

        if (HasInfluencingCard(card))
        {
            baseBackgroundColor = BlendWithInfluencingCard(card, baseBackgroundColor);
        }

        return new WaterDropBackgroundColorContext { BaseColor = baseBackgroundColor };
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
        var blendStrength = card.BlendFactor * 0.7f; // Water drop specific blend strength

        return ColorUtilities.BlendColors(baseBackgroundColor, enhancedInfluenceColor, blendStrength);
    }
}

internal class WaterDropRenderContext
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public float CenterX { get; set; }
    public float CenterY { get; set; }
    public double AnimationTime { get; set; }
    public float EffectiveOpacity { get; set; }
}

internal class WaterDropBackgroundColorContext
{
    public SKColor BaseColor { get; set; }
}

internal interface IWaterDropEffect : IDisposable
{
    void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor);
}

internal class WaterDropShadowEffect : IWaterDropEffect
{
    private readonly SKPaint _shadowPaint = new()
    {
        IsAntialias = true,
        Color = new SKColor(0, 0, 0, RenderingConstants.WaterDropCardShadowAlpha),
        MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, RenderingConstants.WaterDropCardShadowBlur)
    };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        var shadowIntensity = context.EffectiveOpacity * 0.8f + 0.2f;
        _shadowPaint.Color =
            _shadowPaint.Color.WithAlpha((byte)(RenderingConstants.WaterDropCardShadowAlpha * shadowIntensity));

        // Create slightly flattened ellipse shadow for water drop effect
        var shadowPath = new SKPath();
        shadowPath.AddOval(new SKRect(
            context.X - 2,
            context.Y + RenderingConstants.WaterDropCardMeniscusHeight,
            context.X + context.Width + 4,
            context.Y + context.Height + 2));

        canvas.DrawPath(shadowPath, _shadowPaint);
    }

    public void Dispose()
    {
        _shadowPaint?.Dispose();
    }
}

internal class WaterDropMeniscusEffect : IWaterDropEffect
{
    private readonly SKPaint _meniscusPaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Create the characteristic curved edge of a water droplet (meniscus)
        var meniscusHeight = RenderingConstants.WaterDropCardMeniscusHeight * context.EffectiveOpacity;

        _meniscusPaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(context.X, context.Y),
            new SKPoint(context.X, context.Y + meniscusHeight),
            new[]
            {
                backgroundColor.WithAlpha((byte)(RenderingConstants.WaterDropCardBaseAlpha *
                                                 context.EffectiveOpacity)),
                backgroundColor.WithAlpha((byte)(RenderingConstants.WaterDropCardBaseAlpha * 0.6f *
                                                 context.EffectiveOpacity))
            },
            new[] { 0f, 1f },
            SKShaderTileMode.Clamp);

        // Draw meniscus curve at the top edge
        var meniscusPath = new SKPath();
        meniscusPath.MoveTo(context.X, context.Y + meniscusHeight);

        // Create curved top edge using cubic bezier
        var controlPoint1X = context.X + context.Width * 0.3f;
        var controlPoint1Y = context.Y - meniscusHeight * 0.5f;
        var controlPoint2X = context.X + context.Width * 0.7f;
        var controlPoint2Y = context.Y - meniscusHeight * 0.5f;

        meniscusPath.CubicTo(
            controlPoint1X, controlPoint1Y,
            controlPoint2X, controlPoint2Y,
            context.X + context.Width, context.Y + meniscusHeight);

        meniscusPath.LineTo(context.X + context.Width, context.Y + context.Height);
        meniscusPath.LineTo(context.X, context.Y + context.Height);
        meniscusPath.Close();

        canvas.DrawPath(meniscusPath, _meniscusPaint);
    }

    public void Dispose()
    {
        _meniscusPaint?.Dispose();
    }
}

internal class WaterDropRefractionEffect : IWaterDropEffect
{
    private readonly SKPaint _refractionPaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Simulate light refraction through water using radial gradients
        var refractionIntensity = context.EffectiveOpacity;

        // Create multiple refraction zones
        for (var i = 0; i < 3; i++)
        {
            var zoneRadius = Math.Min(context.Width, context.Height) * (0.8f - i * 0.2f) / 2;
            var zoneAlpha = (byte)(RenderingConstants.WaterDropCardRefractionAlpha * refractionIntensity *
                                   (1f - i * 0.3f));

            var offsetX = (float)(Math.Sin(context.AnimationTime + i) * 5);
            var offsetY = (float)(Math.Cos(context.AnimationTime + i) * 3);

            _refractionPaint.Shader = SKShader.CreateRadialGradient(
                new SKPoint(context.CenterX + offsetX, context.CenterY + offsetY),
                zoneRadius,
                [
                    backgroundColor.WithAlpha(zoneAlpha), SKColors.White.WithAlpha((byte)(zoneAlpha * 0.6f)),
                    backgroundColor.WithAlpha((byte)(zoneAlpha * 0.3f)), SKColors.Transparent
                ],
                [0f, 0.4f, 0.8f, 1f],
                SKShaderTileMode.Clamp);

            var clipPath = new SKPath();
            clipPath.AddRoundRect(new SKRoundRect(
                new SKRect(context.X, context.Y, context.X + context.Width, context.Y + context.Height),
                RenderingConstants.WaterDropCardCornerRadius, RenderingConstants.WaterDropCardCornerRadius));

            canvas.Save();
            canvas.ClipPath(clipPath);
            canvas.DrawCircle(context.CenterX + offsetX, context.CenterY + offsetY, zoneRadius, _refractionPaint);
            canvas.Restore();
        }
    }

    public void Dispose()
    {
        _refractionPaint?.Dispose();
    }
}

internal class WaterDropCausticsEffect : IWaterDropEffect
{
    private readonly SKPaint _causticsPaint = new()
    {
        IsAntialias = true, BlendMode = SKBlendMode.Screen // Additive blending for light effects
    };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Simulate caustics - the light patterns created by water refraction
        var causticsTime = context.AnimationTime * RenderingConstants.WaterDropCardCausticsSpeed;
        var causticsAlpha = (byte)(RenderingConstants.WaterDropCardCausticsAlpha * context.EffectiveOpacity);

        // Create multiple caustic patterns
        for (var i = 0; i < 5; i++)
        {
            var phaseOffset = i * Math.PI / 3;
            var x = context.CenterX + (float)(Math.Sin(causticsTime + phaseOffset) * context.Width * 0.3);
            var y = context.CenterY + (float)(Math.Cos(causticsTime * 1.3 + phaseOffset) * context.Height * 0.3);
            var size = 15 + (float)(Math.Sin(causticsTime * 2 + phaseOffset) * 8);

            var causticIntensity = (float)(0.5 + 0.5 * Math.Sin(causticsTime * 1.5 + phaseOffset));
            var currentAlpha = (byte)(causticsAlpha * causticIntensity);

            _causticsPaint.Color = SKColors.White.WithAlpha(currentAlpha);

            // Create caustic shape using ellipse
            var ellipseWidth = size * (1.5f + (float)Math.Sin(causticsTime + phaseOffset) * 0.5f);
            var ellipseHeight = size * (0.8f + (float)Math.Cos(causticsTime + phaseOffset) * 0.3f);

            var clipPath = new SKPath();
            clipPath.AddRoundRect(new SKRoundRect(
                new SKRect(context.X, context.Y, context.X + context.Width, context.Y + context.Height),
                RenderingConstants.WaterDropCardCornerRadius, RenderingConstants.WaterDropCardCornerRadius));

            canvas.Save();
            canvas.ClipPath(clipPath);
            canvas.DrawOval(
                new SKRect(x - ellipseWidth / 2, y - ellipseHeight / 2, x + ellipseWidth / 2, y + ellipseHeight / 2),
                _causticsPaint);
            canvas.Restore();
        }
    }

    public void Dispose()
    {
        _causticsPaint?.Dispose();
    }
}

internal class WaterDropRippleEffect : IWaterDropEffect
{
    private readonly SKPaint _ripplePaint = new() { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 1.5f };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Create animated ripple effects on the water surface
        var rippleTime = context.AnimationTime * RenderingConstants.WaterDropCardRippleSpeed;

        for (var i = 0; i < 3; i++)
        {
            var ripplePhase = (rippleTime + i * 1.5) % 4; // Ripple every 4 time units
            if (ripplePhase < 2) // Only show ripple for first half of cycle
            {
                var rippleRadius = ripplePhase * Math.Min(context.Width, context.Height) * 0.4f;
                var rippleAlpha = (byte)((1 - ripplePhase / 2) * 100 * context.EffectiveOpacity);

                _ripplePaint.Color = SKColors.White.WithAlpha(rippleAlpha);

                var clipPath = new SKPath();
                clipPath.AddRoundRect(new SKRoundRect(
                    new SKRect(context.X, context.Y, context.X + context.Width, context.Y + context.Height),
                    RenderingConstants.WaterDropCardCornerRadius, RenderingConstants.WaterDropCardCornerRadius));

                canvas.Save();
                canvas.ClipPath(clipPath);
                canvas.DrawCircle(context.CenterX, context.CenterY, (float)rippleRadius, _ripplePaint);
                canvas.Restore();
            }
        }
    }

    public void Dispose()
    {
        _ripplePaint?.Dispose();
    }
}

internal class WaterDropHighlightEffect : IWaterDropEffect
{
    private readonly SKPaint _highlightPaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Create the characteristic bright highlight of a water droplet
        var highlightIntensity = context.EffectiveOpacity;
        var highlightAlpha = (byte)(RenderingConstants.WaterDropCardHighlightAlpha * highlightIntensity);

        // Primary highlight - top left area
        var highlightX = context.X + context.Width * 0.25f;
        var highlightY = context.Y + context.Height * 0.2f;
        var highlightRadius = Math.Min(context.Width, context.Height) * 0.15f;

        _highlightPaint.Shader = SKShader.CreateRadialGradient(
            new SKPoint(highlightX, highlightY),
            highlightRadius,
            [
                SKColors.White.WithAlpha(highlightAlpha), SKColors.White.WithAlpha((byte)(highlightAlpha * 0.4f)),
                SKColors.Transparent
            ],
            [0f, 0.6f, 1f],
            SKShaderTileMode.Clamp);

        var clipPath = new SKPath();
        clipPath.AddRoundRect(new SKRoundRect(
            new SKRect(context.X, context.Y, context.X + context.Width, context.Y + context.Height),
            RenderingConstants.WaterDropCardCornerRadius, RenderingConstants.WaterDropCardCornerRadius));

        canvas.Save();
        canvas.ClipPath(clipPath);
        canvas.DrawCircle(highlightX, highlightY, highlightRadius, _highlightPaint);

        // Secondary highlight - smaller, animated
        var secondaryX = context.X + context.Width * 0.7f;
        var secondaryY = context.Y + context.Height * 0.3f;
        var secondaryRadius = highlightRadius * 0.6f;
        var secondaryAlpha = (byte)(highlightAlpha * 0.7f * (0.8f + 0.2f * (float)Math.Sin(context.AnimationTime * 3)));

        _highlightPaint.Shader = SKShader.CreateRadialGradient(
            new SKPoint(secondaryX, secondaryY),
            secondaryRadius,
            [SKColors.White.WithAlpha(secondaryAlpha), SKColors.Transparent],
            [0f, 1f],
            SKShaderTileMode.Clamp);

        canvas.DrawCircle(secondaryX, secondaryY, secondaryRadius, _highlightPaint);
        canvas.Restore();
    }

    public void Dispose()
    {
        _highlightPaint?.Dispose();
    }
}

internal class WaterDropSurfaceEffect : IWaterDropEffect
{
    private readonly SKPaint _surfacePaint = new() { IsAntialias = true };

    public void Apply(SKCanvas canvas, WaterDropRenderContext context, SKColor backgroundColor)
    {
        // Main water surface with subtle color and transparency
        var surfaceAlpha = (byte)(RenderingConstants.WaterDropCardBaseAlpha * context.EffectiveOpacity);

        // Create subtle color shift to simulate water's optical properties
        var waterTint = new SKColor(
            (byte)Math.Min(255, backgroundColor.Red + 10),
            (byte)Math.Min(255, backgroundColor.Green + 15),
            (byte)Math.Min(255, backgroundColor.Blue + 20),
            surfaceAlpha);

        _surfacePaint.Color = waterTint;

        canvas.DrawRoundRect(
            context.X, context.Y, context.Width, context.Height,
            RenderingConstants.WaterDropCardCornerRadius, RenderingConstants.WaterDropCardCornerRadius,
            _surfacePaint);
    }

    public void Dispose()
    {
        _surfacePaint?.Dispose();
    }
}
