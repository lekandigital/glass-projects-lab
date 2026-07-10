using Autofac;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;

namespace GlassMorphismInteractive.Services;

public class RendererFactory(IComponentContext componentContext) : IRendererFactory
{
    public IBackgroundRenderer CreateBackgroundRenderer(string rendererType)
    {
        if (RendererCollections.BackgroundTypes.Contains(rendererType) &&
            componentContext.IsRegisteredWithName<IBackgroundRenderer>(rendererType))
        {
            return componentContext.ResolveNamed<IBackgroundRenderer>(rendererType);
        }

        throw new ArgumentException($"Unknown background renderer type: {rendererType}", nameof(rendererType));
    }

    public ICardRenderer CreateCardRenderer(string rendererType)
    {
        if (RendererCollections.CardTypes.Contains(rendererType) &&
            componentContext.IsRegisteredWithName<ICardRenderer>(rendererType))
        {
            return componentContext.ResolveNamed<ICardRenderer>(rendererType);
        }

        throw new ArgumentException($"Unknown card renderer type: {rendererType}", nameof(rendererType));
    }

    public IGlassmorphismEffectProcessor CreateEffectProcessor(string processorType)
    {
        if (RendererCollections.ProcessorTypes.Contains(processorType) &&
            componentContext.IsRegisteredWithName<IGlassmorphismEffectProcessor>(processorType))
        {
            return componentContext.ResolveNamed<IGlassmorphismEffectProcessor>(processorType);
        }

        throw new ArgumentException($"Unknown effect processor type: {processorType}", nameof(processorType));
    }

    public IEnumerable<string> GetAvailableBackgroundRenderers()
    {
        return RendererCollections.BackgroundTypes;
    }

    public IEnumerable<string> GetAvailableCardRenderers()
    {
        return RendererCollections.CardTypes;
    }

    public IEnumerable<string> GetAvailableEffectProcessors()
    {
        return RendererCollections.ProcessorTypes;
    }
}
