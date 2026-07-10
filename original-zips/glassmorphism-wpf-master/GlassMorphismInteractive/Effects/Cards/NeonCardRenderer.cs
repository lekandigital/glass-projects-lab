using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Cards;

public class NeonCardRenderer(IBackgroundSampler backgroundSampler) : ICardRenderer
{
    private readonly NeonCardBodyEffect _bodyEffect = new();
    private readonly NeonBorderEffect _borderEffect = new();
    private readonly NeonContentEffect _contentEffect = new();
    private readonly NeonGlowLayersEffect _glowEffect = new();

    public string Name => "Neon Glow";

    public void Render(SKCanvas canvas, Card card, double animationTime)
    {
        var renderContext = new NeonCardRenderContext
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
        _glowEffect.Apply(canvas, renderContext, colorContext);
        _bodyEffect.Apply(canvas, renderContext, colorContext);
        _borderEffect.Apply(canvas, renderContext, colorContext);
        _contentEffect.Apply(canvas, renderContext, colorContext);
    }

    private NeonCardColorContext CreateColorContext(Card card, double animationTime)
    {
        var backgroundColors = backgroundSampler.SampleBackgroundRegion(
            card.X, card.Y, card.Width, card.Height);
        var avgBackgroundColor = ColorUtilities.AverageColors(backgroundColors);

        var neonColor = ColorUtilities.BlendColors(card.EffectiveBaseColor, avgBackgroundColor,
            RenderingConstants.NeonCardBackgroundBlendStrength);

        if (card.BlendFactor > 0 && card.InfluencingCard != null)
        {
            neonColor = ColorUtilities.BlendColors(neonColor, card.InfluencingCard.EffectiveBaseColor,
                card.BlendFactor * 0.7f);
        }

        var glowIntensity = 1.0f + card.BlendFactor * 2.0f;
        var pulseEffect = (float)(0.8 + 0.4 * Math.Sin(animationTime * 3));
        return new NeonCardColorContext
        {
            NeonColor = neonColor,
            BackgroundColor = ColorUtilities.BlendColors(SKColor.Parse(RenderingColors.NeonCardBackgroundColor),
                avgBackgroundColor, 0.2f),
            GlowIntensity = glowIntensity,
            PulseEffect = pulseEffect,
            BaseOpacity = RenderingConstants.NeonCardBaseOpacity
        };
    }
}

internal class NeonCardRenderContext
{
    public float X { get; set; }
    public float Y { get; set; }
    public float Width { get; set; }
    public float Height { get; set; }
    public double AnimationTime { get; set; }
    public Card Card { get; set; } = null!;
}

internal class NeonCardColorContext
{
    public SKColor NeonColor { get; set; }
    public SKColor BackgroundColor { get; set; }
    public float GlowIntensity { get; set; }
    public float PulseEffect { get; set; }
    public float BaseOpacity { get; set; }
}

internal interface INeonCardEffect
{
    void Apply(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext);
}


internal class NeonGlowLayersEffect : INeonCardEffect
{
    public void Apply(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        // Multiple glow layers for neon effect
        for (var i = 3; i >= 0; i--)
        {
            var glowRadius = 5 + i * 8 * colorContext.GlowIntensity;
            var alpha = (byte)((30 + i * 20) * colorContext.PulseEffect * colorContext.BaseOpacity);

            using var glowPaint = new SKPaint
            {
                IsAntialias = true,
                Color = colorContext.NeonColor.WithAlpha(alpha),
                MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, glowRadius)
            };

            canvas.DrawRoundRect(context.X - i * 3, context.Y - i * 3,
                context.Width + i * 6, context.Height + i * 6,
                25 + i * 2, 25 + i * 2, glowPaint);
        }
    }
}

internal class NeonCardBodyEffect : INeonCardEffect
{
    public void Apply(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        using var bodyPaint = new SKPaint
        {
            IsAntialias = true,
            Color = colorContext.BackgroundColor.WithAlpha((byte)(200 * context.Card.EffectiveOpacity *
                                                                  colorContext.BaseOpacity)),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, context.Card.EffectiveBlur)
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 25, 25, bodyPaint);
    }
}

internal class NeonBorderEffect : INeonCardEffect
{
    public void Apply(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        // Outer neon border
        using var borderPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 3,
            Color = colorContext.NeonColor.WithAlpha((byte)(255 * colorContext.PulseEffect *
                                                            context.Card.EffectiveOpacity))
        };
        canvas.DrawRoundRect(context.X, context.Y, context.Width, context.Height, 25, 25, borderPaint);

        // Inner neon lines
        using var innerLinePaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 1,
            Color = colorContext.NeonColor.WithAlpha((byte)(180 * colorContext.PulseEffect *
                                                            context.Card.EffectiveOpacity))
        };
        canvas.DrawRoundRect(context.X + 5, context.Y + 5, context.Width - 10, context.Height - 10, 20, 20,
            innerLinePaint);
    }
}

internal class NeonContentEffect : INeonCardEffect
{
    public void Apply(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        DrawNeonTitle(canvas, context, colorContext);
        DrawCircuitPattern(canvas, context, colorContext);
        DrawDataStream(canvas, context, colorContext);
        DrawPulsingCore(canvas, context, colorContext);
    }

    private void DrawNeonTitle(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        using var titleFont = new SKFont(
            SKTypeface.FromFamilyName("Consolas", SKFontStyleWeight.Bold, SKFontStyleWidth.Normal,
                SKFontStyleSlant.Upright), 20);
        using var titlePaint = new SKPaint
        {
            IsAntialias = true,
            Color = colorContext.NeonColor.WithAlpha((byte)(255 * colorContext.PulseEffect *
                                                            context.Card.EffectiveOpacity)),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 2 + context.Card.EffectiveBlur / 3)
        };

        var title = NeonCardTitleProvider.GetTitle(context.Card);
        canvas.DrawText(title, context.X + 20, context.Y + 40, titleFont, titlePaint);
    }

    private void DrawCircuitPattern(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        using var circuitPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 2,
            Color = colorContext.NeonColor.WithAlpha((byte)(120 * colorContext.PulseEffect))
        };

        // Draw circuit lines
        var circuitY = context.Y + 60;
        canvas.DrawLine(context.X + 20, circuitY, context.X + 100, circuitY, circuitPaint);
        canvas.DrawLine(context.X + 100, circuitY, context.X + 100, circuitY + 20, circuitPaint);
        canvas.DrawLine(context.X + 100, circuitY + 20, context.X + 150, circuitY + 20, circuitPaint);

        // Circuit nodes
        using var nodePaint = new SKPaint
        {
            IsAntialias = true, Color = colorContext.NeonColor.WithAlpha((byte)(200 * colorContext.PulseEffect))
        };

        canvas.DrawCircle(context.X + 100, circuitY, 3, nodePaint);
        canvas.DrawCircle(context.X + 150, circuitY + 20, 3, nodePaint);
    }

    private void DrawDataStream(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        var streamProgress = (float)(context.AnimationTime * 100 % 200);
        using var streamPaint = new SKPaint
        {
            IsAntialias = true, Color = SKColors.White.WithAlpha((byte)(150 * colorContext.PulseEffect))
        };

        for (var i = 0; i < 5; i++)
        {
            var dotX = context.X + 20 + (streamProgress + i * 10) % 200;
            if (dotX < context.X + context.Width - 20)
            {
                canvas.DrawCircle(dotX, context.Y + 100, 1.5f, streamPaint);
            }
        }
    }

    private void DrawPulsingCore(SKCanvas canvas, NeonCardRenderContext context, NeonCardColorContext colorContext)
    {
        var coreX = context.X + context.Width - 40;
        var coreY = context.Y + 40;
        var coreSize = 8 + (float)(Math.Sin(context.AnimationTime * 6) * 4);

        using var corePaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateRadialGradient(
                new SKPoint(coreX, coreY),
                coreSize,
                [
                    colorContext.NeonColor.WithAlpha((byte)(255 * colorContext.PulseEffect)),
                    colorContext.NeonColor.WithAlpha(0)
                ],
                [0f, 1f],
                SKShaderTileMode.Clamp)
        };
        canvas.DrawCircle(coreX, coreY, coreSize, corePaint);
    }
}

internal static class NeonCardTitleProvider
{
    public static string GetTitle(Card card)
    {
        return card.BaseColor switch
        {
            var color when color == SKColors.CornflowerBlue => "NEON-BLUE",
            var color when color == SKColors.Orange => "NEON-ORANGE",
            var color when color == SKColors.White => "NEON-WHITE",
            _ => "NEON-CARD"
        };
    }
}
