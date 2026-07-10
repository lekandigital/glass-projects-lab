using SkiaSharp;

namespace GlassMorphismInteractive.Interfaces;

public interface IBackgroundSampler
{
    /// <summary>
    ///     Samples the background color at a specific position
    /// </summary>
    /// <param name="x">X coordinate</param>
    /// <param name="y">Y coordinate</param>
    /// <returns>The sampled background color</returns>
    SKColor SampleBackgroundAt(float x, float y);

    /// <summary>
    ///     Samples multiple background colors in a region for averaging
    /// </summary>
    /// <param name="x">Center X coordinate</param>
    /// <param name="y">Center Y coordinate</param>
    /// <param name="width">Region width</param>
    /// <param name="height">Region height</param>
    /// <param name="sampleCount">Number of sample points</param>
    /// <returns>Array of sampled colors</returns>
    SKColor[] SampleBackgroundRegion(float x, float y, float width, float height, int sampleCount = 9);

    /// <summary>
    ///     Updates the background sampler with current background data
    /// </summary>
    /// <param name="canvas">The canvas with the background rendered</param>
    /// <param name="width">Canvas width</param>
    /// <param name="height">Canvas height</param>
    void UpdateBackgroundData(SKCanvas canvas, int width, int height);

    /// <summary>
    ///     Sets the background bitmap data for sampling
    /// </summary>
    /// <param name="backgroundBitmap">The background bitmap to sample from</param>
    void SetBackgroundData(SKBitmap backgroundBitmap);
}
