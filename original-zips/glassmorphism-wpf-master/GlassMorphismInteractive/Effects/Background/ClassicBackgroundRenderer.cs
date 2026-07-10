using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using SkiaSharp;

// ReSharper disable PossibleLossOfFraction

namespace GlassMorphismInteractive.Effects.Background;

public class ClassicBackgroundRenderer : IBackgroundRenderer
{
    public string Name => "Classic Gradient";

    public void Render(SKCanvas canvas, int width, int height, double animationTime)
    {
        using var backgroundPaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateRadialGradient(
                new SKPoint(width / 2, height / 2),
                Math.Max(width, height) / 2,
                [
                    SKColor.Parse(RenderingColors.ClassicGradientTop),
                    SKColor.Parse(RenderingColors.ClassicGradientMiddle),
                    SKColor.Parse(RenderingColors.ClassicGradientBottom)
                ],
                [0f, 0.7f, 1f],
                SKShaderTileMode.Clamp)
        };

        canvas.DrawRect(0, 0, width, height, backgroundPaint);

        // Animated floating particles
        using var particlePaint = new SKPaint();
        particlePaint.IsAntialias = true;
        particlePaint.Color = SKColors.White.WithAlpha(30);

        for (var i = 0; i < 50; i++)
        {
            var x = (float)((animationTime * 20 + i * 50) % width);
            var y = (float)(100 + Math.Sin(animationTime + i) * 50 + i % 5 * height / 5);
            float size = 1 + i % 3;
            canvas.DrawCircle(x, y, size, particlePaint);
        }
    }
}
