using SkiaSharp;

namespace GlassMorphismInteractive.Interfaces;

public interface IBackgroundRenderer
{
    string Name { get; }
    void Render(SKCanvas canvas, int width, int height, double animationTime);
}
