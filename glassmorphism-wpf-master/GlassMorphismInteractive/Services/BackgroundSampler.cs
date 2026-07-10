using GlassMorphismInteractive.Interfaces;
using SkiaSharp;

namespace GlassMorphismInteractive.Services;

public class BackgroundSampler : IBackgroundSampler, IDisposable
{
    private readonly object _bitmapLock = new();
    private SKBitmap? _backgroundBitmap;
    private bool _disposed;
    private int _height;
    private int _width;

    public SKColor SampleBackgroundAt(float x, float y)
    {
        if (_disposed)
        {
            return new SKColor(245, 250, 255); // Light glass-like color instead of black
        }

        lock (_bitmapLock)
        {
            if (_backgroundBitmap == null)
            {
                return new SKColor(245, 250, 255); // Light glass-like color instead of black
            }

            var pixelX = Math.Max(0, Math.Min(_width - 1, (int)x));
            var pixelY = Math.Max(0, Math.Min(_height - 1, (int)y));

            return _backgroundBitmap.GetPixel(pixelX, pixelY);
        }
    }

    public SKColor[] SampleBackgroundRegion(float x, float y, float width, float height, int sampleCount = 9)
    {
        if (_disposed)
        {
            return new[] { new SKColor(245, 250, 255) }; // Light glass-like color instead of black
        }

        lock (_bitmapLock)
        {
            if (_backgroundBitmap == null)
            {
                return new[] { new SKColor(245, 250, 255) }; // Light glass-like color instead of black
            }

            var samplesPerDimension = Math.Max(1, (int)Math.Sqrt(sampleCount));
            var actualSampleCount = samplesPerDimension * samplesPerDimension;
            var colors = new SKColor[actualSampleCount];

            var colorIndex = 0;
            var stepX = samplesPerDimension > 1 ? width / (samplesPerDimension - 1) : 0;
            var stepY = samplesPerDimension > 1 ? height / (samplesPerDimension - 1) : 0;

            for (var i = 0; i < samplesPerDimension; i++)
            for (var j = 0; j < samplesPerDimension; j++)
            {
                var sampleX = x - width / 2 + stepX * i;
                var sampleY = y - height / 2 + stepY * j;
                colors[colorIndex++] = SampleBackgroundAt(sampleX, sampleY);
            }

            return colors;
        }
    }

    public void UpdateBackgroundData(SKCanvas canvas, int width, int height)
    {
        if (_disposed)
        {
            return;
        }

        // Avoid unnecessary updates if dimensions haven't changed
        if (_backgroundBitmap != null && _width == width && _height == height)
        {
            return;
        }

        // Capture the current canvas content as background data
        lock (_bitmapLock)
        {
            try
            {
                // Dispose the old bitmap
                _backgroundBitmap?.Dispose();

                // Create a new bitmap with the canvas dimensions
                _backgroundBitmap = new SKBitmap(width, height);
                _width = width;
                _height = height;

                // Read the pixels from the canvas surface
                var surface = canvas.Surface;
                if (surface != null)
                {
                    using var snapshot = surface.Snapshot();
                    if (snapshot != null)
                    {
                        // Convert the snapshot to a bitmap more efficiently
                        using var tempBitmap = SKBitmap.FromImage(snapshot);
                        if (tempBitmap != null && tempBitmap.Width == width && tempBitmap.Height == height)
                        {
                            // Copy the bitmap data directly
                            tempBitmap.CopyTo(_backgroundBitmap);
                        }
                        else
                        {
                            // Fallback: create bitmap from pixel data
                            var pixelData = snapshot.ToRasterImage().PeekPixels();
                            _backgroundBitmap.InstallPixels(pixelData);
                        }
                    }
                }
            }
            catch (Exception)
            {
                // If background capture fails, create a fallback light glass bitmap instead of black
                _backgroundBitmap?.Dispose();
                _backgroundBitmap = new SKBitmap(width, height);
                _backgroundBitmap.Erase(new SKColor(245, 250, 255)); // Light glass-like color
            }
        }
    }

    public void SetBackgroundData(SKBitmap backgroundBitmap)
    {
        if (_disposed)
        {
            return;
        }

        lock (_bitmapLock)
        {
            _backgroundBitmap?.Dispose();
            _backgroundBitmap = backgroundBitmap?.Copy();
            if (_backgroundBitmap != null)
            {
                _width = _backgroundBitmap.Width;
                _height = _backgroundBitmap.Height;
            }
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        lock (_bitmapLock)
        {
            _backgroundBitmap?.Dispose();
            _backgroundBitmap = null;
            _disposed = true;
        }

        GC.SuppressFinalize(this);
    }

    ~BackgroundSampler()
    {
        Dispose();
    }
}
