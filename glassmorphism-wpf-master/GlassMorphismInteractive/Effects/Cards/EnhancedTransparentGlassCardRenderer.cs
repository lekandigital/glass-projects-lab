using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

/// <summary>
///     Enhanced transparent glass card renderer with accurate color bleeding physics
/// </summary>
public class EnhancedTransparentGlassCardRenderer : IEnhancedCardRenderer, IDisposable
{
    private readonly EnhancedGlassEdgeEffect _edgeEffect = new();
    private readonly EnhancedGlassSurfaceEffect _glassSurfaceEffect = new();
    private readonly EnhancedGlassReflectionEffect _reflectionEffect = new();
    private readonly EnhancedGlassRefractionEffect _refractionEffect = new();
    private readonly EnhancedGlassShadowEffect _shadowEffect = new();

    public void Dispose()
    {
        _glassSurfaceEffect?.Dispose();
        _edgeEffect?.Dispose();
        _shadowEffect?.Dispose();
        _reflectionEffect?.Dispose();
        _refractionEffect?.Dispose();
    }

    public string Name => "Enhanced Transparent Glass";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        // Fallback to basic rendering when no bleeding context is available
        RenderWithColorBleeding(canvas, card, [], null!, animationTime);
    }

    public void RenderWithColorBleeding(
        SKCanvas canvas,
        Card card,
        IEnumerable<Card> nearbyCards,
        IBackgroundSampler backgroundSampler,
        double animationTime)
    {
        var renderContext = CreateEnhancedRenderContext(card, animationTime);
        var colorContext = CreateEnhancedColorContext(card, nearbyCards, backgroundSampler, animationTime);

        // Render layers from back to front with accurate color bleeding
        _shadowEffect.Apply(canvas, renderContext, colorContext);
        _glassSurfaceEffect.Apply(canvas, renderContext, colorContext);
        _refractionEffect.Apply(canvas, renderContext, colorContext);
        _edgeEffect.Apply(canvas, renderContext, colorContext);
        _reflectionEffect.Apply(canvas, renderContext, colorContext);
    }

    private EnhancedGlassRenderContext CreateEnhancedRenderContext(Card card, double animationTime)
    {
        return new EnhancedGlassRenderContext
        {
            CardBounds = new SKRect(
                card.X - card.Width / 2,
                card.Y - card.Height / 2,
                card.X + card.Width / 2,
                card.Y + card.Height / 2),
            AnimationTime = animationTime,
            EffectiveOpacity = card.EffectiveOpacity,
            EffectiveBlur = card.EffectiveBlur,
            Card = card
        };
    }

    private EnhancedColorContext CreateEnhancedColorContext(
        Card card,
        IEnumerable<Card> nearbyCards,
        IBackgroundSampler backgroundSampler,
        double animationTime)
    {
        var cardCenter = new SKPoint(card.X, card.Y);
        var sampleRadius = Math.Max(card.Width, card.Height) * 0.6f;

        // Sample background colors around the card
        var backgroundSamples = backgroundSampler?.SampleBackgroundRegion(
            cardCenter.X, cardCenter.Y, sampleRadius, sampleRadius, 16) ?? [];

        var baseColor = backgroundSamples.Length > 0
            ? ColorUtilities.AverageColors(backgroundSamples)
            : new SKColor(245, 250, 255, 45);

        // Calculate multi-card color bleeding
        var sourceCards = nearbyCards as Card[] ?? nearbyCards.ToArray();
        var bleedingResult = backgroundSampler != null
            ? ColorBleedingUtilities.CalculateMultiCardBleeding(card, sourceCards, backgroundSampler, animationTime)
            : new MultiCardBleedingResult(); // Create directional bleeding gradient
        var directionalGradient = backgroundSampler != null
            ? ColorBleedingUtilities.CreateDirectionalBleedingGradient(
                new SKRect(card.X - card.Width / 2, card.Y - card.Height / 2, card.X + card.Width / 2,
                    card.Y + card.Height / 2),
                bleedingResult, card, sourceCards)
            : new DirectionalBleedingGradient();

        return new EnhancedColorContext
        {
            BaseColor = baseColor,
            BleedingResult = bleedingResult,
            DirectionalGradient = directionalGradient,
            OverallBleedingIntensity = bleedingResult.TotalBleedingStrength,
            BackgroundSamples = backgroundSamples
        };
    }
}

/// <summary>
///     Enhanced render context with additional bleeding information
/// </summary>
public class EnhancedGlassRenderContext
{
    public SKRect CardBounds { get; set; }
    public double AnimationTime { get; set; }
    public float EffectiveOpacity { get; set; }
    public float EffectiveBlur { get; set; }
    public Card Card { get; set; } = null!;
}

/// <summary>
///     Enhanced glass surface effect with accurate color bleeding
/// </summary>
public class EnhancedGlassSurfaceEffect : IDisposable
{
    private SKPaint? _bleedingPaint;
    private SKPaint? _surfacePaint;

    public void Dispose()
    {
        _surfacePaint?.Dispose();
        _bleedingPaint?.Dispose();
    }

    public void Apply(SKCanvas canvas, EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        CreateSurfacePaints(context, colorContext);

        // Draw main glass surface with base color
        canvas.DrawRoundRect(context.CardBounds, 12, 12, _surfacePaint!);

        // Apply color bleeding overlay if present
        if (colorContext.OverallBleedingIntensity > 0.01f)
        {
            ApplyColorBleedingOverlay(canvas, context, colorContext);
        }
    }

    private void CreateSurfacePaints(EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        _surfacePaint?.Dispose();
        _bleedingPaint?.Dispose();

        // Base glass surface
        _surfacePaint = new SKPaint
        {
            IsAntialias = true,
            Color = colorContext.BaseColor.WithAlpha(
                (byte)(colorContext.BaseColor.Alpha * context.EffectiveOpacity)),
            BlendMode = SKBlendMode.SrcOver
        };

        // Bleeding overlay
        _bleedingPaint = new SKPaint { IsAntialias = true, BlendMode = SKBlendMode.Overlay };
    }

    private void ApplyColorBleedingOverlay(SKCanvas canvas, EnhancedGlassRenderContext context,
        EnhancedColorContext colorContext)
    {
        var gradient = colorContext.DirectionalGradient;
        var bounds = context.CardBounds;

        // Create radial bleeding effects for each significant directional influence
        if (gradient.TopStrength > 0.05f)
        {
            ApplyDirectionalBleeding(canvas, bounds, gradient.TopColor, gradient.TopStrength,
                new SKPoint(bounds.MidX, bounds.Top), context.EffectiveOpacity);
        }

        if (gradient.BottomStrength > 0.05f)
        {
            ApplyDirectionalBleeding(canvas, bounds, gradient.BottomColor, gradient.BottomStrength,
                new SKPoint(bounds.MidX, bounds.Bottom), context.EffectiveOpacity);
        }

        if (gradient.LeftStrength > 0.05f)
        {
            ApplyDirectionalBleeding(canvas, bounds, gradient.LeftColor, gradient.LeftStrength,
                new SKPoint(bounds.Left, bounds.MidY), context.EffectiveOpacity);
        }

        if (gradient.RightStrength > 0.05f)
        {
            ApplyDirectionalBleeding(canvas, bounds, gradient.RightColor, gradient.RightStrength,
                new SKPoint(bounds.Right, bounds.MidY), context.EffectiveOpacity);
        }

        // Apply central accumulated bleeding
        if (colorContext.BleedingResult.TotalBleedingStrength > 0.1f)
        {
            ApplyCentralBleeding(canvas, bounds, colorContext, context.EffectiveOpacity);
        }
    }

    private void ApplyDirectionalBleeding(SKCanvas canvas, SKRect bounds, SKColor color, float strength,
        SKPoint origin, float opacity)
    {
        var radius = Math.Max(bounds.Width, bounds.Height) * 0.8f;
        var alpha = (byte)(color.Alpha * strength * opacity * 0.6f);

        using var radialShader = SKShader.CreateRadialGradient(
            origin,
            radius,
            [color.WithAlpha(alpha), color.WithAlpha(0)],
            [0f, 1f],
            SKShaderTileMode.Clamp);

        _bleedingPaint!.Shader = radialShader;
        canvas.DrawRoundRect(bounds, 12, 12, _bleedingPaint);
    }

    private void ApplyCentralBleeding(SKCanvas canvas, SKRect bounds, EnhancedColorContext colorContext, float opacity)
    {
        var center = new SKPoint(bounds.MidX, bounds.MidY);
        var radius = Math.Min(bounds.Width, bounds.Height) * 0.7f;

        var primaryColor = colorContext.BleedingResult.AccumulatedPrimaryColor;
        var secondaryColor = colorContext.BleedingResult.AccumulatedSecondaryColor;
        var strength = colorContext.BleedingResult.TotalBleedingStrength;

        var alpha1 = (byte)(primaryColor.Alpha * strength * opacity * 0.4f);
        var alpha2 = (byte)(secondaryColor.Alpha * strength * opacity * 0.3f);

        using var centralShader = SKShader.CreateRadialGradient(
            center,
            radius,
            [primaryColor.WithAlpha(alpha1), secondaryColor.WithAlpha(alpha2), SKColors.Transparent],
            [0f, 0.6f, 1f],
            SKShaderTileMode.Clamp);

        _bleedingPaint!.Shader = centralShader;
        canvas.DrawRoundRect(bounds, 12, 12, _bleedingPaint);
    }
}

/// <summary>
///     Enhanced glass edge effect with color bleeding
/// </summary>
public class EnhancedGlassEdgeEffect : IDisposable
{
    private SKPaint? _edgePaint;
    private SKPath? _edgePath;

    public void Dispose()
    {
        _edgePaint?.Dispose();
        _edgePath?.Dispose();
    }

    public void Apply(SKCanvas canvas, EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        CreateEdgeEffects(context, colorContext);

        if (_edgePath != null && _edgePaint != null)
        {
            canvas.DrawPath(_edgePath, _edgePaint);
        }
    }

    private void CreateEdgeEffects(EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        _edgePaint?.Dispose();
        _edgePath?.Dispose();

        var bounds = context.CardBounds;
        var bleedingColor = colorContext.BleedingResult.AccumulatedEdgeColor;
        var baseColor = new SKColor(255, 255, 255, 80);

        var edgeColor = colorContext.OverallBleedingIntensity > 0.1f
            ? ColorUtilities.BlendColors(baseColor, bleedingColor, colorContext.OverallBleedingIntensity * 0.7f)
            : baseColor;

        _edgePaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 1.5f,
            Color = edgeColor.WithAlpha((byte)(edgeColor.Alpha * context.EffectiveOpacity)),
            BlendMode = SKBlendMode.Screen
        };

        _edgePath = new SKPath();
        _edgePath.AddRoundRect(bounds, 12, 12);
    }
}

/// <summary>
///     Enhanced glass shadow effect
/// </summary>
public class EnhancedGlassShadowEffect : IDisposable
{
    private SKPaint? _shadowPaint;

    public void Dispose()
    {
        _shadowPaint?.Dispose();
    }

    public void Apply(SKCanvas canvas, EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        CreateShadowPaint(context, colorContext);

        var shadowBounds = context.CardBounds;
        shadowBounds.Offset(3, 3);

        canvas.DrawRoundRect(shadowBounds, 12, 12, _shadowPaint!);
    }

    private void CreateShadowPaint(EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        _shadowPaint?.Dispose();

        var shadowColor = new SKColor(0, 0, 0, (byte)(60 * context.EffectiveOpacity));

        _shadowPaint = new SKPaint
        {
            IsAntialias = true,
            Color = shadowColor,
            BlendMode = SKBlendMode.Multiply,
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 4f)
        };
    }
}

/// <summary>
///     Enhanced glass reflection effect
/// </summary>
public class EnhancedGlassReflectionEffect : IDisposable
{
    private SKPaint? _reflectionPaint;
    private SKPath? _reflectionPath;

    public void Dispose()
    {
        _reflectionPaint?.Dispose();
        _reflectionPath?.Dispose();
    }

    public void Apply(SKCanvas canvas, EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        CreateReflectionEffect(context, colorContext);

        if (_reflectionPath != null && _reflectionPaint != null)
        {
            canvas.DrawPath(_reflectionPath, _reflectionPaint);
        }
    }

    private void CreateReflectionEffect(EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        _reflectionPaint?.Dispose();
        _reflectionPath?.Dispose();

        var bounds = context.CardBounds;
        var animationOffset = (float)(Math.Sin(context.AnimationTime * 0.8) * 0.1f);

        // Create subtle animated reflection
        var reflectionBounds = new SKRect(
            bounds.Left + bounds.Width * 0.2f,
            bounds.Top + bounds.Height * 0.1f,
            bounds.Right - bounds.Width * 0.3f,
            bounds.Top + bounds.Height * 0.4f);

        _reflectionPaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateLinearGradient(
                new SKPoint(reflectionBounds.Left, reflectionBounds.Top),
                new SKPoint(reflectionBounds.Right, reflectionBounds.Bottom),
                [SKColors.White.WithAlpha((byte)(40 * context.EffectiveOpacity)), SKColors.Transparent],
                [0f + animationOffset, 1f + animationOffset],
                SKShaderTileMode.Clamp),
            BlendMode = SKBlendMode.Screen
        };

        _reflectionPath = new SKPath();
        _reflectionPath.AddRoundRect(reflectionBounds, 8, 8);
    }
}

/// <summary>
///     Enhanced glass refraction effect
/// </summary>
public class EnhancedGlassRefractionEffect : IDisposable
{
    private SKPaint? _refractionPaint;

    public void Dispose()
    {
        _refractionPaint?.Dispose();
    }

    public void Apply(SKCanvas canvas, EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        if (colorContext.OverallBleedingIntensity < 0.05f)
        {
            return;
        }

        CreateRefractionEffect(context, colorContext);
        canvas.DrawRoundRect(context.CardBounds, 12, 12, _refractionPaint!);
    }

    private void CreateRefractionEffect(EnhancedGlassRenderContext context, EnhancedColorContext colorContext)
    {
        _refractionPaint?.Dispose();

        var refractionColor = colorContext.BleedingResult.AccumulatedPrimaryColor;
        var alpha = (byte)(refractionColor.Alpha * colorContext.OverallBleedingIntensity * context.EffectiveOpacity *
                           0.3f);

        _refractionPaint = new SKPaint
        {
            IsAntialias = true, Color = refractionColor.WithAlpha(alpha), BlendMode = SKBlendMode.ColorBurn
        };
    }
}
