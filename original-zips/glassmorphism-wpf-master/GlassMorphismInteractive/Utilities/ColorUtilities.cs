using SkiaSharp;

namespace GlassMorphismInteractive.Utilities;

/// <summary>
///     Shared utility class for color operations across all renderers.
///     Provides common functionality for color blending and averaging.
/// </summary>
public static class ColorUtilities
{
    /// <summary>
    ///     Blends two colors with the specified factor.
    /// </summary>
    /// <param name="color1">The first color</param>
    /// <param name="color2">The second color</param>
    /// <param name="factor">Blend factor (0.0 = all color1, 1.0 = all color2)</param>
    /// <returns>The blended color</returns>
    public static SKColor BlendColors(SKColor color1, SKColor color2, float factor)
    {
        factor = Math.Max(0, Math.Min(1, factor));

        var r = (byte)(color1.Red + (color2.Red - color1.Red) * factor);
        var g = (byte)(color1.Green + (color2.Green - color1.Green) * factor);
        var b = (byte)(color1.Blue + (color2.Blue - color1.Blue) * factor);

        return new SKColor(r, g, b);
    }

    /// <summary>
    ///     Calculates the average color from an array of colors.
    /// </summary>
    /// <param name="colors">Array of colors to average</param>
    /// <returns>The average color, or black if array is null or empty</returns>
    public static SKColor AverageColors(SKColor[] colors)
    {
        if (colors == null || colors.Length == 0)
        {
            return SKColors.Black;
        }

        long totalR = 0, totalG = 0, totalB = 0;

        foreach (var color in colors)
        {
            totalR += color.Red;
            totalG += color.Green;
            totalB += color.Blue;
        }

        var avgR = (byte)(totalR / colors.Length);
        var avgG = (byte)(totalG / colors.Length);
        var avgB = (byte)(totalB / colors.Length);

        return new SKColor(avgR, avgG, avgB);
    }

    /// <summary>
    ///     Enhances a background color for better visibility in glass effects.
    ///     Prevents pure black backgrounds and adjusts saturation/brightness.
    /// </summary>
    /// <param name="backgroundColor">The background color to enhance</param>
    /// <returns>Enhanced color suitable for glass effects</returns>
    public static SKColor EnhanceBackgroundForVisibility(SKColor backgroundColor)
    {
        // Prevent pure black backgrounds and enhance visibility
        if (backgroundColor.Red < 20 && backgroundColor.Green < 20 && backgroundColor.Blue < 20)
            // If background is too dark, use a default glass-like color
        {
            return new SKColor(180, 200, 220); // Light blue-gray glass color
        }

        // Enhance the background color slightly for better glass effect
        backgroundColor.ToHsv(out var h, out var s, out var v);

        // Increase saturation and brightness slightly for better visibility
        s = Math.Min(100, s * 1.2f);
        v = Math.Min(100, Math.Max(30, v * 1.1f)); // Ensure minimum brightness

        return SKColor.FromHsv(h, s, v);
    }

    /// <summary>
    ///     Creates a color with the specified alpha value.
    /// </summary>
    /// <param name="color">The base color</param>
    /// <param name="alpha">The alpha value (0-255)</param>
    /// <returns>The color with new alpha value</returns>
    public static SKColor WithAlpha(SKColor color, byte alpha)
    {
        return new SKColor(color.Red, color.Green, color.Blue, alpha);
    }

    /// <summary>
    ///     Interpolates between colors along a gradient.
    /// </summary>
    /// <param name="colors">Array of colors for the gradient</param>
    /// <param name="position">Position in gradient (0.0 to 1.0)</param>
    /// <returns>Interpolated color at the specified position</returns>
    public static SKColor InterpolateGradient(SKColor[] colors, float position)
    {
        if (colors == null || colors.Length == 0)
        {
            return SKColors.Black;
        }

        if (colors.Length == 1)
        {
            return colors[0];
        }

        position = Math.Max(0, Math.Min(1, position));

        var scaledPosition = position * (colors.Length - 1);
        var lowerIndex = (int)Math.Floor(scaledPosition);
        var upperIndex = Math.Min(lowerIndex + 1, colors.Length - 1);
        var factor = scaledPosition - lowerIndex;

        return BlendColors(colors[lowerIndex], colors[upperIndex], factor);
    }
}
