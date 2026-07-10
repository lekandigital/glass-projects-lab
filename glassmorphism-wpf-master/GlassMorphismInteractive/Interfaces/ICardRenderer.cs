using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Interfaces;

public interface ICardRenderer
{
    string Name { get; }
    void Render(SKCanvas canvas, Card card, double animationTime);
}
