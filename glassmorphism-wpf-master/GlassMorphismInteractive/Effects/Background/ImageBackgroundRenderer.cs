using System.IO;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using SkiaSharp;

namespace GlassMorphismInteractive.Effects.Background;

public class ImageBackgroundRenderer : IBackgroundRenderer, IDisposable
{
    private readonly ImageRenderingConfig _config = new();
    private SKBitmap? _backgroundImage;
    private string? _currentImagePath;
    private bool _disposed;

    public string Name => "Image Background";

    public void Render(SKCanvas canvas, int width, int height, double animationTime)
    {
        var renderer = new ImageRenderer(canvas, width, height)
            .ClearBackground(_config.BackgroundColor);

        // Only draw image if one is loaded
        if (_backgroundImage != null)
        {
            renderer.DrawImage(_backgroundImage, _config);
        }

        renderer.AddOverlay(_config.OverlayColor);
        renderer.Execute();
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        DisposeCurrentImage();
        _disposed = true;
    }

    public void SetBackgroundImage(string imagePath)
    {
        if (ShouldSkipImageLoad(imagePath))
        {
            return;
        }

        DisposeCurrentImage();
        LoadNewImage(imagePath);
    }

    private bool ShouldSkipImageLoad(string imagePath)
    {
        return string.IsNullOrEmpty(imagePath) || _currentImagePath == imagePath;
    }

    private void DisposeCurrentImage()
    {
        _backgroundImage?.Dispose();
        _backgroundImage = null;
        _currentImagePath = null;
    }

    private void LoadNewImage(string imagePath)
    {
        if (string.IsNullOrEmpty(imagePath) || !File.Exists(imagePath))
        {
            return;
        }

        var imageLoader = new ImageLoader();
        var result = imageLoader.LoadImage(imagePath);

        if (result.Success)
        {
            _backgroundImage = result.Bitmap;
            _currentImagePath = imagePath;
        }
    }
}

internal class ImageRenderingConfig
{
    public SKColor BackgroundColor { get; set; } = SKColor.Parse(RenderingColors.ImageBackgroundColor);
    public byte ImageAlpha { get; set; } = 255; // Full opacity for better visibility
    public SKColor OverlayColor { get; set; } = SKColors.Transparent; // Remove overlay for better image visibility
    public ScalingMode ScalingMode { get; set; } = ScalingMode.Fill;
}

internal enum ScalingMode
{
    Fill,
    Fit
}

internal class ImageRenderer
{
    private readonly SKCanvas _canvas;
    private readonly int _height;
    private readonly List<Action> _renderActions;
    private readonly int _width;

    public ImageRenderer(SKCanvas canvas, int width, int height)
    {
        _canvas = canvas;
        _width = width;
        _height = height;
        _renderActions = new List<Action>();
    }

    public ImageRenderer ClearBackground(SKColor color)
    {
        _renderActions.Add(() => _canvas.Clear(color));
        return this;
    }

    public ImageRenderer DrawImage(SKBitmap? bitmap, ImageRenderingConfig config)
    {
        if (bitmap == null)
        {
            return this;
        }

        _renderActions.Add(() =>
        {
            var scaleCalculator = new ImageScaleCalculator(bitmap, _width, _height, config.ScalingMode);
            var transform = scaleCalculator.Calculate();

            using var paint = new SKPaint { IsAntialias = true, Color = SKColors.White.WithAlpha(config.ImageAlpha) };

            _canvas.DrawBitmap(bitmap, transform.DestinationRect, paint);
        });

        return this;
    }

    public ImageRenderer AddOverlay(SKColor overlayColor)
    {
        _renderActions.Add(() =>
        {
            using var overlayPaint = new SKPaint { Color = overlayColor };
            _canvas.DrawRect(0, 0, _width, _height, overlayPaint);
        });

        return this;
    }

    public void Execute()
    {
        foreach (var action in _renderActions)
        {
            action();
        }
    }
}

internal class ImageScaleCalculator
{
    private readonly SKBitmap _bitmap;
    private readonly int _canvasHeight;
    private readonly int _canvasWidth;
    private readonly ScalingMode _scalingMode;

    public ImageScaleCalculator(SKBitmap bitmap, int canvasWidth, int canvasHeight, ScalingMode scalingMode)
    {
        _bitmap = bitmap;
        _canvasWidth = canvasWidth;
        _canvasHeight = canvasHeight;
        _scalingMode = scalingMode;
    }

    public ImageTransform Calculate()
    {
        var scaleX = (float)_canvasWidth / _bitmap.Width;
        var scaleY = (float)_canvasHeight / _bitmap.Height;

        var scale = _scalingMode == ScalingMode.Fill
            ? Math.Max(scaleX, scaleY)
            : Math.Min(scaleX, scaleY);

        var scaledWidth = _bitmap.Width * scale;
        var scaledHeight = _bitmap.Height * scale;
        var offsetX = (_canvasWidth - scaledWidth) / 2;
        var offsetY = (_canvasHeight - scaledHeight) / 2;

        return new ImageTransform
        {
            Scale = scale,
            DestinationRect = new SKRect(offsetX, offsetY, offsetX + scaledWidth, offsetY + scaledHeight)
        };
    }
}

internal class ImageTransform
{
    public float Scale { get; set; }
    public SKRect DestinationRect { get; set; }
}

internal class ImageLoader
{
    public ImageLoadResult LoadImage(string imagePath)
    {
        try
        {
            using var stream = File.OpenRead(imagePath);
            var bitmap = SKBitmap.Decode(stream);

            return new ImageLoadResult { Success = bitmap != null, Bitmap = bitmap };
        }
        catch
        {
            return new ImageLoadResult { Success = false, Bitmap = null };
        }
    }
}

internal class ImageLoadResult
{
    public bool Success { get; set; }
    public SKBitmap? Bitmap { get; set; }
}
