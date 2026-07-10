namespace GlassMorphismInteractive.Interfaces;

public interface IRendererFactory
{
    IBackgroundRenderer CreateBackgroundRenderer(string rendererType);
    ICardRenderer CreateCardRenderer(string rendererType);
    IGlassmorphismEffectProcessor CreateEffectProcessor(string processorType);

    IEnumerable<string> GetAvailableBackgroundRenderers();
    IEnumerable<string> GetAvailableCardRenderers();
    IEnumerable<string> GetAvailableEffectProcessors();
}
