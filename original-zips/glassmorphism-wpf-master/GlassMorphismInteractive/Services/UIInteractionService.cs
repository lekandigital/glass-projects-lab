using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;

namespace GlassMorphismInteractive.Services;

public class UiInteractionService : IUIInteractionService
{
    private readonly Dictionary<string, string> _backgroundMappings = new()
    {
        { UiConstants.ClassicGradientDisplay, RendererNames.ClassicBackground },
        { UiConstants.AuroraWavesDisplay, RendererNames.AuroraBackground },
        { UiConstants.NeonGridDisplay, RendererNames.NeonGridBackground },
        { UiConstants.ImageBackgroundDisplay, RendererNames.ImageBackground }
    };
    private readonly Dictionary<string, string> _cardMappings = new()
    {
        { UiConstants.ClassicGlassDisplay, RendererNames.ClassicCard },
        { UiConstants.HolographicDisplay, RendererNames.HolographicCard },
        { UiConstants.NeonGlowDisplay, RendererNames.NeonCard },
        { UiConstants.TransparentGlassDisplay, RendererNames.TransparentGlassCard },
        { UiConstants.EnhancedGlassDisplay, RendererNames.EnhancedTransparentGlassCard },
        { UiConstants.WaterDropDisplay, RendererNames.WaterDropCard }
    };
    private readonly Dictionary<string, string> _processorMappings = new()
    {
        { UiConstants.ClassicGlassmorphismDisplay, RendererNames.ClassicProcessor },
        { UiConstants.EnhancedGlassmorphismDisplay, RendererNames.EnhancedProcessor }
    };

    public event EventHandler<string>? BackgroundRendererChanged;
    public event EventHandler<string>? CardRendererChanged;
    public event EventHandler<string>? EffectProcessorChanged;

    public void HandleBackgroundSelection(string selectionText)
    {
        if (_backgroundMappings.TryGetValue(selectionText, out var rendererType))
        {
            BackgroundRendererChanged?.Invoke(this, rendererType);
        }
    }

    public void HandleCardSelection(string selectionText)
    {
        if (_cardMappings.TryGetValue(selectionText, out var rendererType))
        {
            CardRendererChanged?.Invoke(this, rendererType);
        }
    }

    public void HandleProcessorSelection(string selectionText)
    {
        if (_processorMappings.TryGetValue(selectionText, out var processorType))
        {
            EffectProcessorChanged?.Invoke(this, processorType);
        }
    }
}
