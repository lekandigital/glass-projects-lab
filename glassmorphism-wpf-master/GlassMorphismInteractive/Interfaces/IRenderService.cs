using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Interfaces;

public interface IRenderService
{
    void RenderFrame(SKCanvas canvas, int width, int height, IEnumerable<Card> cards, double animationTime,
        bool isBackgroundAnimationEnabled);
}
