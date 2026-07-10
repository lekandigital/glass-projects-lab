using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Background;

public class NeonGridBackgroundRenderer : IBackgroundRenderer, IDisposable
{
    private readonly SKPaint _energyGlowPaint;
    private readonly SKPaint _energyLinePaint;
    private readonly SKPaint _gridGlowPaint;
    private readonly SKPaint _gridLinePaint;
    private readonly SKPaint _nodeCorePaint;
    private readonly SKPaint _nodeGlowPaint;

    public string Name => "Neon Grid";

    public NeonGridBackgroundRenderer()
    {
        // Main grid lines
        _gridLinePaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = RenderingConstants.NeonGridLineWidth,
            Color = SKColor.Parse(RenderingColors.NeonCyan)
        };

        // Grid glow effect
        _gridGlowPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = RenderingConstants.NeonGridGlowWidth,
            Color = SKColor.Parse(RenderingColors.NeonCyan),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 4)
        };

        // Grid intersection nodes - core
        _nodeCorePaint = new SKPaint
        {
            IsAntialias = true, Style = SKPaintStyle.Fill, Color = SKColor.Parse(RenderingColors.NeonMagenta)
        };

        // Grid intersection nodes - glow
        _nodeGlowPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Color = SKColor.Parse(RenderingColors.NeonMagenta),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 6)
        };

        // Energy lines - core
        _energyLinePaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 3,
            Color = SKColor.Parse(RenderingColors.NeonYellow)
        };

        // Energy lines - glow
        _energyGlowPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 8,
            Color = SKColor.Parse(RenderingColors.NeonYellow),
            MaskFilter = SKMaskFilter.CreateBlur(SKBlurStyle.Normal, 5)
        };
    }

    public void Render(SKCanvas canvas, int width, int height, double animationTime)
    {
        // Dark cyberpunk background
        canvas.Clear(SKColor.Parse(RenderingColors.NeonGridClearColor));

        // Calculate animation values
        var pulseIntensity = (float)(0.4 + 0.6 * Math.Sin(animationTime * RenderingConstants.NeonGridPulseSpeed));
        var wavePhase = animationTime * RenderingConstants.NeonGridAnimationSpeed;

        // Draw background atmospheric glow
        DrawAtmosphericGlow(canvas, width, height, pulseIntensity);

        // Draw main grid with dynamic effects
        DrawNeonGrid(canvas, width, height, wavePhase, pulseIntensity);

        // Draw grid intersection nodes
        DrawGridNodes(canvas, width, height, wavePhase, pulseIntensity);

        // Draw animated energy lines
        DrawEnergyLines(canvas, width, height, animationTime, pulseIntensity);

        // Draw scan lines for extra cyberpunk effect
        DrawScanLines(canvas, width, height, animationTime);
    }

    public void Dispose()
    {
        _gridLinePaint?.Dispose();
        _gridGlowPaint?.Dispose();
        _nodeCorePaint?.Dispose();
        _nodeGlowPaint?.Dispose();
        _energyLinePaint?.Dispose();
        _energyGlowPaint?.Dispose();
    }

    private void DrawAtmosphericGlow(SKCanvas canvas, int width, int height, float intensity)
    {
        using var atmospherePaint = new SKPaint
        {
            IsAntialias = true,
            Shader = SKShader.CreateRadialGradient(
                new SKPoint(width / 2, height / 2),
                Math.Max(width, height) * 0.8f,
                new[]
                {
                    SKColor.Parse(RenderingColors.NeonCyan).WithAlpha((byte)(20 * intensity)),
                    SKColor.Parse(RenderingColors.NeonMagenta).WithAlpha((byte)(10 * intensity)),
                    SKColors.Transparent
                },
                new[] { 0f, 0.6f, 1f },
                SKShaderTileMode.Clamp)
        };

        canvas.DrawRect(0, 0, width, height, atmospherePaint);
    }

    private void DrawNeonGrid(SKCanvas canvas, int width, int height, double wavePhase, float pulseIntensity)
    {
        var gridSize = RenderingConstants.NeonGridSize;
        var baseAlpha = (byte)(RenderingConstants.NeonGridBaseAlpha * pulseIntensity);
        var glowAlpha = (byte)(RenderingConstants.NeonGridGlowAlpha * pulseIntensity);

        _gridLinePaint.Color = _gridLinePaint.Color.WithAlpha(baseAlpha);
        _gridGlowPaint.Color = _gridGlowPaint.Color.WithAlpha(glowAlpha);

        // Vertical lines with wave distortion
        for (float x = 0; x <= width; x += gridSize)
        {
            var path = new SKPath();
            path.MoveTo(x, 0);

            // Create wavy vertical lines
            for (float y = 0; y <= height; y += 10)
            {
                var waveOffset = (float)(Math.Sin(wavePhase + y * RenderingConstants.NeonGridWaveFrequency) *
                                         RenderingConstants.NeonGridWaveAmplitude);
                var lineIntensity = 1f + (float)(Math.Sin(wavePhase * 0.7 + x * 0.01) * 0.3);

                path.LineTo(x + waveOffset * lineIntensity, y);
            }

            // Draw glow first, then main line
            canvas.DrawPath(path, _gridGlowPaint);
            canvas.DrawPath(path, _gridLinePaint);
        }

        // Horizontal lines with wave distortion
        for (float y = 0; y <= height; y += gridSize)
        {
            var path = new SKPath();
            path.MoveTo(0, y);

            // Create wavy horizontal lines
            for (float x = 0; x <= width; x += 10)
            {
                var waveOffset = (float)(Math.Cos(wavePhase + x * RenderingConstants.NeonGridWaveFrequency) *
                                         RenderingConstants.NeonGridWaveAmplitude);
                var lineIntensity = 1f + (float)(Math.Cos(wavePhase * 0.8 + y * 0.01) * 0.3);

                path.LineTo(x, y + waveOffset * lineIntensity);
            }

            // Draw glow first, then main line
            canvas.DrawPath(path, _gridGlowPaint);
            canvas.DrawPath(path, _gridLinePaint);
        }
    }

    private void DrawGridNodes(SKCanvas canvas, int width, int height, double wavePhase, float pulseIntensity)
    {
        var gridSize = RenderingConstants.NeonGridSize;
        var nodeAlpha = (byte)(RenderingConstants.NeonGridNodeAlpha * pulseIntensity);

        _nodeCorePaint.Color = _nodeCorePaint.Color.WithAlpha(nodeAlpha);
        _nodeGlowPaint.Color = _nodeGlowPaint.Color.WithAlpha((byte)(nodeAlpha * 0.6f));

        for (float x = 0; x <= width; x += gridSize)
        {
            for (float y = 0; y <= height; y += gridSize)
            {
                // Calculate individual node animation
                var nodePhase = wavePhase + x * 0.01 + y * 0.01;
                var nodePulse = (float)(0.5 + 0.5 * Math.Sin(nodePhase * 3));
                var nodeSize = RenderingConstants.NeonGridNodeSize * (0.8f + 0.4f * nodePulse);
                var glowSize = RenderingConstants.NeonGridNodeGlow * (0.8f + 0.4f * nodePulse);

                // Add wave distortion to node positions
                var waveX = (float)(Math.Sin(wavePhase + y * RenderingConstants.NeonGridWaveFrequency) *
                                    RenderingConstants.NeonGridWaveAmplitude);
                var waveY = (float)(Math.Cos(wavePhase + x * RenderingConstants.NeonGridWaveFrequency) *
                                    RenderingConstants.NeonGridWaveAmplitude);

                var nodeX = x + waveX;
                var nodeY = y + waveY;

                // Draw node glow then core
                canvas.DrawCircle(nodeX, nodeY, glowSize, _nodeGlowPaint);
                canvas.DrawCircle(nodeX, nodeY, nodeSize, _nodeCorePaint);
            }
        }
    }

    private void DrawEnergyLines(SKCanvas canvas, int width, int height, double animationTime, float pulseIntensity)
    {
        var energyAlpha = (byte)(200 * pulseIntensity);
        var energyGlowAlpha = (byte)(100 * pulseIntensity);

        _energyLinePaint.Color = _energyLinePaint.Color.WithAlpha(energyAlpha);
        _energyGlowPaint.Color = _energyGlowPaint.Color.WithAlpha(energyGlowAlpha);

        // Create dashed line effect
        var dashPhase = (float)(animationTime * RenderingConstants.NeonGridEnergySpeed);
        var dashEffect = SKPathEffect.CreateDash(
            new[] { RenderingConstants.NeonGridEnergyDashLength, RenderingConstants.NeonGridEnergyGapLength },
            dashPhase);

        _energyLinePaint.PathEffect = dashEffect;
        _energyGlowPaint.PathEffect = dashEffect;

        // Diagonal energy lines
        for (var i = 0; i < RenderingConstants.NeonGridEnergyLineCount; i++)
        {
            var progress = (float)((animationTime * 0.3 + i * 0.15) % 1);
            var angle = (float)(Math.PI / 4 + i * Math.PI / 8); // Vary angles

            var startX = -200 + progress * (width + 400);
            var startY = i * height / (RenderingConstants.NeonGridEnergyLineCount - 1);

            var endX = startX + (float)(Math.Cos(angle) * 300);
            var endY = startY + (float)(Math.Sin(angle) * 200);

            // Draw energy line with glow
            canvas.DrawLine(startX, startY, endX, endY, _energyGlowPaint);
            canvas.DrawLine(startX, startY, endX, endY, _energyLinePaint);
        }

        // Clean up path effect
        _energyLinePaint.PathEffect?.Dispose();
        _energyGlowPaint.PathEffect?.Dispose();
        _energyLinePaint.PathEffect = null;
        _energyGlowPaint.PathEffect = null;
    }

    private void DrawScanLines(SKCanvas canvas, int width, int height, double animationTime)
    {
        using var scanPaint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Color = SKColor.Parse(RenderingColors.NeonCyan).WithAlpha(15)
        };

        // Moving scan lines
        for (var i = 0; i < 3; i++)
        {
            var scanProgress = (float)((animationTime * 0.2 + i * 0.33) % 1);
            var scanY = scanProgress * height;
            var scanHeight = 4f;

            // Create gradient for scan line
            scanPaint.Shader = SKShader.CreateLinearGradient(
                new SKPoint(0, scanY - 10),
                new SKPoint(0, scanY + 10),
                new[]
                {
                    SKColors.Transparent, SKColor.Parse(RenderingColors.NeonCyan).WithAlpha(30),
                    SKColors.Transparent
                },
                new[] { 0f, 0.5f, 1f },
                SKShaderTileMode.Clamp);

            canvas.DrawRect(0, scanY - scanHeight / 2, width, scanHeight, scanPaint);
        }
    }
}
