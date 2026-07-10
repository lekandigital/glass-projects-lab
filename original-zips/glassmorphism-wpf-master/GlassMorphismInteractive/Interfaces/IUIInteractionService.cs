namespace GlassMorphismInteractive.Interfaces;

public interface IUIInteractionService
{
    event EventHandler<string>? BackgroundRendererChanged;
    event EventHandler<string>? CardRendererChanged;
    event EventHandler<string>? EffectProcessorChanged;

    void HandleBackgroundSelection(string selectionText);
    void HandleCardSelection(string selectionText);
    void HandleProcessorSelection(string selectionText);
}
