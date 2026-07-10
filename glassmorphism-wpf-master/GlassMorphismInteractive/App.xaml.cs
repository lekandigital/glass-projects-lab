using System.Windows;
using Autofac;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Effects.Background;
using GlassMorphismInteractive.Effects.Cards;
using GlassMorphismInteractive.Effects.Processors;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Services;
using GlassMorphismInteractive.ViewModels;

namespace GlassMorphismInteractive;

public partial class App : Application
{
    private IContainer? _container;

    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);

        _container = ConfigureContainer();

        var mainWindow = _container.Resolve<MainWindow>();
        mainWindow.Show();
    }

    protected override void OnExit(ExitEventArgs e)
    {
        _container?.Dispose();
        base.OnExit(e);
    }

    private static IContainer ConfigureContainer()
    {
        var builder = new ContainerBuilder();

        // Register configuration classes as singletons
        builder.RegisterInstance(new AnimationConfig()).AsSelf().SingleInstance();
        builder.RegisterInstance(new CardConfig()).AsSelf().SingleInstance();

        // Register core services
        builder.RegisterType<RendererFactory>().As<IRendererFactory>().SingleInstance();
        builder.RegisterType<CardFactory>().As<ICardFactory>().SingleInstance();
        builder.RegisterType<AnimationService>().As<IAnimationService>().SingleInstance();
        builder.RegisterType<RenderService>().As<IRenderService>().SingleInstance();
        builder.RegisterType<UiInteractionService>().As<IUIInteractionService>().SingleInstance();
        builder.RegisterType<BackgroundSampler>().As<IBackgroundSampler>().SingleInstance();
        builder.RegisterType<EffectManager>().AsSelf().SingleInstance();

        // Register ViewModels as singletons for this application pattern
        builder.RegisterType<MainViewModel>().AsSelf().SingleInstance();

        // Register Views (Windows) - created per resolve call
        builder.RegisterType<MainWindow>().AsSelf().InstancePerDependency();

        // Register background renderers
        RegisterNamedRenderers(builder);

        return builder.Build();
    }

    private static void RegisterNamedRenderers(ContainerBuilder builder)
    {
        // Register background renderers with proper lifetimes
        builder.RegisterType<ClassicBackgroundRenderer>().As<IBackgroundRenderer>()
            .Named<IBackgroundRenderer>(RendererNames.ClassicBackground).InstancePerDependency();
        builder.RegisterType<AuroraBackgroundRenderer>().As<IBackgroundRenderer>()
            .Named<IBackgroundRenderer>(RendererNames.AuroraBackground).InstancePerDependency();
        builder.RegisterType<NeonGridBackgroundRenderer>().As<IBackgroundRenderer>()
            .Named<IBackgroundRenderer>(RendererNames.NeonGridBackground).InstancePerDependency();
        builder.RegisterType<ImageBackgroundRenderer>().As<IBackgroundRenderer>()
            .Named<IBackgroundRenderer>(RendererNames.ImageBackground)
            .InstancePerDependency();

        // Register card renderers with proper lifetimes
        builder.RegisterType<ClassicGlassCardRenderer>().As<ICardRenderer>()
            .Named<ICardRenderer>(RendererNames.ClassicCard).InstancePerDependency();
        builder.RegisterType<HolographicCardRenderer>().As<ICardRenderer>()
            .Named<ICardRenderer>(RendererNames.HolographicCard).InstancePerDependency();
        builder.RegisterType<NeonCardRenderer>().As<ICardRenderer>()
            .Named<ICardRenderer>(RendererNames.NeonCard).InstancePerDependency();
        builder.RegisterType<TransparentGlassCardRenderer>().As<ICardRenderer>()
            .Named<ICardRenderer>(RendererNames.TransparentGlassCard).InstancePerDependency();
        builder.RegisterType<EnhancedTransparentGlassCardRenderer>().As<ICardRenderer>()
            .As<IEnhancedCardRenderer>()
            .Named<ICardRenderer>(RendererNames.EnhancedTransparentGlassCard).InstancePerDependency();
        builder.RegisterType<WaterDropCardRenderer>().As<ICardRenderer>()
            .Named<ICardRenderer>(RendererNames.WaterDropCard)
            .InstancePerDependency();

        // Register glassmorphism effect processors with proper lifetimes
        builder.RegisterType<ClassicGlassmorphismProcessor>().As<IGlassmorphismEffectProcessor>()
            .Named<IGlassmorphismEffectProcessor>(RendererNames.ClassicProcessor).InstancePerDependency();
        builder.RegisterType<EnhancedGlassmorphismProcessor>().As<IGlassmorphismEffectProcessor>()
            .Named<IGlassmorphismEffectProcessor>(RendererNames.EnhancedProcessor)
            .InstancePerDependency();

        // Register default implementations (for non-named resolution) as singletons for performance
        builder.RegisterType<ClassicBackgroundRenderer>().As<IBackgroundRenderer>().SingleInstance();
        builder.RegisterType<ClassicGlassCardRenderer>().As<ICardRenderer>().SingleInstance();
        builder.RegisterType<ClassicGlassmorphismProcessor>().As<IGlassmorphismEffectProcessor>().SingleInstance();
    }
}
