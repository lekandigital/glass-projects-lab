using System.ComponentModel;
using System.Windows;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.ViewModels;
using SkiaSharp.Views.Desktop;

namespace GlassMorphismInteractive;

public partial class MainWindow : Window
{
    private readonly IRenderService _renderService;
    private readonly MainViewModel _viewModel;

    public MainWindow(IRenderService renderService, MainViewModel viewModel)
    {
        _renderService = renderService;
        _viewModel = viewModel;

        InitializeComponent();

        DataContext = _viewModel;
        SubscribeToEvents();
    }

    private void SubscribeToEvents()
    {
        foreach (var card in _viewModel.Cards)
        {
            card.PropertyChanged += OnCardPropertyChanged;
        }

        _viewModel.AnimationService.AnimationTick += OnAnimationTick;
        _viewModel.EffectManager.PropertyChanged += OnEffectManagerPropertyChanged;
    }

    private void OnAnimationTick(object? sender, EventArgs e)
    {
        Dispatcher.Invoke(() => SkiaCanvas.InvalidateVisual());
    }

    private void OnEffectManagerPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        Dispatcher.Invoke(() => SkiaCanvas.InvalidateVisual());
    }

    private void OnCardPropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName is nameof(Card.X)
            or nameof(Card.Y)
            or nameof(Card.BlendFactor)
            or nameof(Card.Opacity)
            or nameof(Card.Blur)
            or nameof(Card.Saturation))
        {
            Dispatcher.Invoke(() => SkiaCanvas.InvalidateVisual());
        }
    }

    private void OnPaintSurface(object sender, SKPaintSurfaceEventArgs e)
    {
        _viewModel.SetCanvasDimensions(e.Info.Width, e.Info.Height);
        _renderService.RenderFrame(e.Surface.Canvas, e.Info.Width, e.Info.Height, _viewModel.Cards,
            _viewModel.AnimationTime, _viewModel.IsBackgroundAnimationEnabled);
    }
}
