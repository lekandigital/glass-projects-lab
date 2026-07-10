using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Background;

public class AuroraBackgroundRenderer : IBackgroundRenderer
{
    private readonly Random _random = new();
    private float[]? _noiseOffset;

    public string Name => "Aurora Waves";

    public void Render(SKCanvas canvas, int width, int height, double animationTime)
    {
        // Initialize noise for aurora variations
        _noiseOffset ??= Enumerable.Range(0, 3).Select(_ => (float)_random.NextDouble() * 1000).ToArray();

        // Base gradient with subtle animation
        using var basePaint = new SKPaint();
        basePaint.IsAntialias = true;

        // Add subtle gradient movement
        var gradientOffset = (float)(Math.Sin(animationTime * 0.1) * 0.1);
        basePaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(width, height),
            [
                SKColor.Parse(RenderingColors.AuroraBaseColor),
                SKColor.Parse(RenderingColors.AuroraPurple),
                SKColor.Parse(RenderingColors.AuroraBaseColor)
            ],
            [gradientOffset, 0.5f, 1f - gradientOffset],
            SKShaderTileMode.Clamp);

        canvas.DrawRect(0, 0, width, height, basePaint);

        // Enhanced aurora waves with realistic variations
        for (var i = 0; i < 3; i++)
        {
            RenderAuroraWave(canvas, width, height, animationTime, i);
        }

        // Enhanced floating stars with depth
        RenderStarField(canvas, width, height, animationTime);

        // Add aurora particles for extra magic
        RenderAuroraParticles(canvas, width, height, animationTime);
    }

    private void RenderAuroraWave(SKCanvas canvas, int width, int height, double animationTime, int waveIndex)
    {
        using var path = new SKPath();
        var waveColor = waveIndex switch
        {
            0 => SKColor.Parse(RenderingColors.AuroraGreen)
                .WithAlpha((byte)(30 + 20 * Math.Sin(animationTime + waveIndex))),
            1 => SKColor.Parse(RenderingColors.AuroraBlue)
                .WithAlpha((byte)(25 + 15 * Math.Sin(animationTime * 1.2 + waveIndex))),
            _ => SKColor.Parse(RenderingColors.AuroraPink)
                .WithAlpha((byte)(20 + 10 * Math.Sin(animationTime * 0.8 + waveIndex)))
        };

        var waveHeight = height * (0.2f + 0.1f * (float)Math.Sin(animationTime * 0.3 + waveIndex));
        var waveSpeed = (float)(animationTime * (0.5 + waveIndex * 0.3));
        var noiseScale = 0.005f + waveIndex * 0.002f;

        // First point with noise variation
        var startY = height / 2 + waveHeight * (float)Math.Sin(waveSpeed + _noiseOffset![waveIndex]);
        path.MoveTo(0, startY);

        // Generate wave path with Perlin-like noise
        for (float x = 0; x <= width; x += 8)
        {
            var baseWave = (float)Math.Sin(waveSpeed + x * 0.01 + waveIndex * Math.PI / 3);
            var noise = (float)(Math.Sin(x * noiseScale + animationTime + _noiseOffset[waveIndex]) * 0.3);
            var y = height / 2 + waveHeight * (baseWave + noise);
            path.LineTo(x, y);
        }

        path.LineTo(width, height);
        path.LineTo(0, height);
        path.Close();

        // Create gradient shader for more realistic aurora
        using var wavePaint = new SKPaint();
        wavePaint.IsAntialias = true;
        wavePaint.Shader = SKShader.CreateLinearGradient(
            new SKPoint(0, height / 4),
            new SKPoint(0, height * 3 / 4),
            [
                waveColor.WithAlpha((byte)(waveColor.Alpha * 0.3)), waveColor,
                waveColor.WithAlpha((byte)(waveColor.Alpha * 0.1))
            ],
            [0f, 0.5f, 1f],
            SKShaderTileMode.Clamp);
        wavePaint.BlendMode = SKBlendMode.Screen;

        canvas.DrawPath(path, wavePaint);
    }

    private void RenderStarField(SKCanvas canvas, int width, int height, double animationTime)
    {
        using var starPaint = new SKPaint();
        starPaint.IsAntialias = true;

        for (var i = 0; i < 40; i++)
        {
            var x = (float)((animationTime * (2 + i % 3) + i * 127) % width);
            var baseY = 30 + i * 17 % (height - 60);
            var y = baseY + (float)(Math.Sin(animationTime * 0.3 + i * 0.1) * 15);

            var twinkle = (float)(0.3 + 0.7 * Math.Sin(animationTime * (2 + i % 4) + i * 0.5));
            var size = (0.8f + i % 3 * 0.4f) * twinkle;
            // Different star colors for depth
            var starColor = (i % 4) switch
            {
                0 => SKColors.White.WithAlpha((byte)(100 * twinkle)),
                1 => SKColor.Parse(RenderingColors.AuroraBlue).WithAlpha((byte)(80 * twinkle)),
                2 => SKColor.Parse(RenderingColors.AuroraGreen).WithAlpha((byte)(60 * twinkle)),
                _ => SKColor.Parse(RenderingColors.AuroraPink).WithAlpha((byte)(70 * twinkle))
            };

            starPaint.Color = starColor;
            canvas.DrawCircle(x, y, size, starPaint);
        }
    }

    private void RenderAuroraParticles(SKCanvas canvas, int width, int height, double animationTime)
    {
        using var particlePaint = new SKPaint();
        particlePaint.IsAntialias = true;
        particlePaint.BlendMode = SKBlendMode.Screen;

        // Floating aurora particles
        for (var i = 0; i < 15; i++)
        {
            var particleLife = (animationTime * 0.8 + i * 2.3) % 10;
            var alpha = particleLife < 5 ? particleLife / 5 : (10 - particleLife) / 5;

            var x = (float)(width * 0.1 + width * 0.8 * ((animationTime * 0.2 + i * 1.7) % 1));
            var y = (float)(height * 0.2 + height * 0.6 * Math.Sin(animationTime * 0.5 + i * 0.8));
            var particleColor = (i % 3) switch
            {
                0 => SKColor.Parse(RenderingColors.AuroraGreen).WithAlpha((byte)(40 * alpha)),
                1 => SKColor.Parse(RenderingColors.AuroraBlue).WithAlpha((byte)(35 * alpha)),
                _ => SKColor.Parse(RenderingColors.AuroraPink).WithAlpha((byte)(30 * alpha))
            };

            particlePaint.Color = particleColor;
            canvas.DrawCircle(x, y, 2.5f * (float)alpha, particlePaint);
        }
    }
}
