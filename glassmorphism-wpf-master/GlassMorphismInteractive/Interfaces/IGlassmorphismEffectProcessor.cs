using GlassMorphismInteractive.Models;

namespace GlassMorphismInteractive.Interfaces;

public interface IGlassmorphismEffectProcessor
{
    string Name { get; }
    void UpdateEffects(IEnumerable<Card> cards, double animationTime);
}
