using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Utilities;
using SkiaSharp;

namespace GlassMorphismInteractive.Interfaces;

/// <summary>
///     Enhanced card renderer interface with advanced color bleeding support
/// </summary>
public interface IEnhancedCardRenderer : ICardRenderer
{
    /// <summary>
    ///     Renders a card with accurate color bleeding from nearby cards
    /// </summary>
    /// <param name="canvas">The canvas to render on</param>
    /// <param name="card">The card to render</param>
    /// <param name="nearbyCards">Collection of nearby cards that may influence color bleeding</param>
    /// <param name="backgroundSampler">Background sampler for realistic color interaction</param>
    /// <param name="animationTime">Current animation time</param>
    void RenderWithColorBleeding(
        SKCanvas canvas,
        Card card,
        IEnumerable<Card> nearbyCards,
        IBackgroundSampler backgroundSampler,
        double animationTime);
}

/// <summary>
///     Extended color context for enhanced rendering with bleeding effects
/// </summary>
public class EnhancedColorContext
{
    public SKColor BaseColor { get; set; }
    public MultiCardBleedingResult BleedingResult { get; set; }
    public DirectionalBleedingGradient DirectionalGradient { get; set; }
    public float OverallBleedingIntensity { get; set; }
    public SKColor[] BackgroundSamples { get; set; } = Array.Empty<SKColor>();
}
