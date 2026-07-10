using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

public class ClassicGlassCardRenderer(IBackgroundSampler backgroundSampler) : ICardRenderer
{
    private readonly ClassicCardBackgroundEffect _backgroundEffect = new();
    private readonly ClassicCardBorderEffect _borderEffect = new();
    private readonly ClassicCardContentEffect _contentEffect = new();
    private readonly ClassicCardShadowEffect _shadowEffect = new();

    public string Name => "Classic Glass";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        var renderContext = new ClassicCardRenderContext
        {
            X = card.X - card.Width / 2,
            Y = card.Y - card.Height / 2,
            Width = card.Width,
            Height = card.Height,
            AnimationTime = animationTime,
            Card = card
        };

        var colorContext = CreateColorContext(card);

        // Direct rendering without builder overhead
        _shadowEffect.Apply(canvas, renderContext, colorContext);
        _backgroundEffect.Apply(canvas, renderContext, colorContext);
        _borderEffect.Apply(canvas, renderContext, colorContext);
        _contentEffect.Apply(canvas, renderContext, colorContext);
    }

    private ClassicCardRenderContext CreateRenderContext(Card card, double animationTime)
    {
        return new ClassicCardRenderContext
        {
            X = card.X - card.Width / 2,
            Y = card.Y - card.Height / 2,
            Width = card.Width,
            Height = card.Height,
            AnimationTime = animationTime,
            Card = card
        };
    }

    private ClassicCardColorContext CreateColorContext(Card card)
    {
        var backgroundColors = backgroundSampler.SampleBackgroundRegion(
            card.X, card.Y, card.Width, card.Height);
        var avgBackgroundColor = ColorUtilities.AverageColors(backgroundColors);

        var primaryColor = ColorUtilities.BlendColors(card.EffectiveBaseColor, avgBackgroundColor,
            RenderingConstants.ClassicCardBackgroundBlendStrength);
        var accentColor = ColorUtilities.BlendColors(card.EffectiveSecondaryColor, avgBackgroundColor,
            RenderingConstants.ClassicCardBackgroundBlendStrength * 0.7f);

        if (card.BlendFactor > 0 && card.InfluencingCard != null)
        {
            var bleedingIntensity = card.BaseColor == SKColors.White ? 0.8f : 0.4f;
            var accentBleedingIntensity = card.BaseColor == SKColors.White ? 0.6f : 0.3f;

            primaryColor = ColorUtilities.BlendColors(primaryColor, card.InfluencingCard.EffectiveBaseColor,
                card.BlendFactor * bleedingIntensity);
            accentColor = ColorUtilities.BlendColors(accentColor, card.InfluencingCard.EffectiveSecondaryColor,
                card.BlendFactor * accentBleedingIntensity);
        }

        return new ClassicCardColorContext
        {
            PrimaryColor = primaryColor,
            AccentColor = accentColor,
            BaseOpacity = RenderingConstants.ClassicCardBaseOpacity
        };
    }
}

internal class ClassicCardRenderContext
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public double AnimationTime { get; set; }
    public Card Card { get; set; } = null!;
}

internal class ClassicCardColorContext
{
    public SKColor PrimaryColor { get; set; }
    public SKColor AccentColor { get; set; }
    public float BaseOpacity { get; set; }
}

internal interface IClassicCardEffect
{
    void Apply(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext);
}

internal class ClassicCardShadowEffect : IClassicCardEffect
{
    public void Apply(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext)
    {
        using var shadowPaint = new SKPaint
        {
            IsAntialias = true,
            Color = SKColors.Black.WithAlpha((byte)(100 * context.Card.EffectiveOpacity)),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 15 + context.Card.EffectiveBlur)
        };
        canvas.DrawRoundRect(context.X + 5, context.Y + 5, context.Width, context.Height, 20, 20, shadowPaint);
    }
}

internal class ClassicCardBackgroundEffect : IClassicCardEffect
{
    public void Apply(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext)
    {
        using var cardPaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateLinearGradient(
                new SKPoint(context.X, context.Y),
                new SKPoint(context.X + context.Width, context.Y + context.Height), new[]
                {
                    colorContext.PrimaryColor.WithAlpha((byte)(80 * context.Card.EffectiveOpacity *
                                                               colorContext.BaseOpacity)),
                    colorContext.AccentColor.WithAlpha((byte)(120 * context.Card.EffectiveOpacity *
                                                              colorContext.BaseOpacity)),
                    colorContext.PrimaryColor.WithAlpha((byte)(70 * context.Card.EffectiveOpacity *
                                                               colorContext.BaseOpacity))
                },
                new[] { 0f, 0.5f, 1f },
                SKShaderTileMode.Clamp)
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 20, 20, cardPaint);
    }
}

internal class ClassicCardBorderEffect : IClassicCardEffect
{
    public void Apply(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext)
    {
        using var borderPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 2,
            Color = colorContext.PrimaryColor.WithAlpha((byte)(120 * context.Card.EffectiveOpacity))
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 20, 20, borderPaint);
    }
}

internal class ClassicCardContentEffect : IClassicCardEffect
{
    public void Apply(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext)
    {
        DrawTitle(canvas, context, colorContext);
        DrawAnimatedAccentLine(canvas, context, colorContext);
        DrawAnimatedOrb(canvas, context, colorContext);
    }

    private void DrawTitle(SKCanvas canvas, ClassicCardRenderContext context, ClassicCardColorContext colorContext)
    {
        using var titleFont = new SKFont(
            SKTypeface.FromFamilyName("Segoe UI", SKFontStyleWeight.Bold, SKFontStyleWidth.Normal,
                SKFontStyleSlant.Upright), 24);
        using var titlePaint = new SKPaint
        {
            IsAntialias = true, Color = SKColors.White.WithAlpha((byte)(255 * context.Card.EffectiveOpacity))
        };

        var title = CardTitleProvider.GetTitle(context.Card);
        canvas.DrawText(title, context.X + 20, context.Y + 40, titleFont, titlePaint);
    }

    private void DrawAnimatedAccentLine(SKCanvas canvas, ClassicCardRenderContext context,
        ClassicCardColorContext colorContext)
    {
        using var accentPaint = new SKPaint
        {
            IsAntialias = true,
            Color = colorContext.AccentColor.WithAlpha((byte)(255 * context.Card.EffectiveOpacity)),
            StrokeWidth = 3,
            StrokeCap = SKStrokeCap.Round
        };

        var lineWidth = 60 + (float)(Math.Sin(context.AnimationTime * 2) * 20);
        canvas.DrawLine(context.X + 20, context.Y + 80, context.X + 20 + lineWidth, context.Y + 80, accentPaint);
    }

    private void DrawAnimatedOrb(SKCanvas canvas, ClassicCardRenderContext context,
        ClassicCardColorContext colorContext)
    {
        var orbX = context.X + context.Width - 30;
        var orbY = context.Y + 30;
        var orbPulse = 8 + (float)(Math.Sin(context.AnimationTime * 3) * 3);

        using var orbPaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateRadialGradient(
                new SKPoint(orbX, orbY),
                orbPulse,
                new[]
                {
                    colorContext.AccentColor.WithAlpha((byte)(150 * context.Card.EffectiveOpacity)),
                    colorContext.AccentColor.WithAlpha(0)
                },
                new[] { 0f, 1f },
                SKShaderTileMode.Clamp)
        };
        canvas.DrawCircle(orbX, orbY, orbPulse, orbPaint);
    }
}

internal static class CardTitleProvider
{
    public static string GetTitle(Card card)
    {
        return card.BaseColor switch
        {
            var color when color == SKColors.CornflowerBlue => "Classic Blue",
            var color when color == SKColors.Orange => "Classic Orange",
            var color when color == SKColors.White => "Glass Reflection",
            _ => "Classic Card"
        };
    }
}

// Remove the local ColorHelper class since we're now using the shared ColorUtilities
