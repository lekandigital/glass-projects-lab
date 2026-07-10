using System.ComponentModel;
using System.Runtime.CompilerServices;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Effects.Background;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;

namespace GlassMorphismInteractive.Services;

public sealed class EffectManager : INotifyPropertyChanged
{
    private readonly IRendererFactory _rendererFactory;
    private IBackgroundRenderer _currentBackgroundRenderer;
    private ICardRenderer _currentCardRenderer;
    private IGlassmorphismEffectProcessor _currentEffectProcessor;
    private string? _currentImagePath;

    public EffectManager(IRendererFactory rendererFactory)
    {
        _rendererFactory = rendererFactory;

        _currentBackgroundRenderer = _rendererFactory.CreateBackgroundRenderer(RendererNames.ClassicBackground);
        _currentCardRenderer = _rendererFactory.CreateCardRenderer(RendererNames.ClassicCard);
        _currentEffectProcessor = _rendererFactory.CreateEffectProcessor(RendererNames.ClassicProcessor);
    }

    public IBackgroundRenderer CurrentBackgroundRenderer
    {
        get => _currentBackgroundRenderer;
        private set => SetProperty(ref _currentBackgroundRenderer, value);
    }

    public ICardRenderer CurrentCardRenderer
    {
        get => _currentCardRenderer;
        private set => SetProperty(ref _currentCardRenderer, value);
    }

    public IGlassmorphismEffectProcessor CurrentEffectProcessor
    {
        get => _currentEffectProcessor;
        private set => SetProperty(ref _currentEffectProcessor, value);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    public void SetBackgroundRenderer(string rendererName)
    {
        if (_currentBackgroundRenderer is ImageBackgroundRenderer currentImageRenderer)
        {
            // Get the current image path from the renderer if possible
            _currentImagePath = GetImagePathFromRenderer(currentImageRenderer);
        }

        CurrentBackgroundRenderer = _rendererFactory.CreateBackgroundRenderer(rendererName);

        // If switching to image renderer and we have a stored image path, apply it
        if (CurrentBackgroundRenderer is ImageBackgroundRenderer newImageRenderer &&
            !string.IsNullOrEmpty(_currentImagePath))
        {
            newImageRenderer.SetBackgroundImage(_currentImagePath);
        }
    }

    public void SetImageBackground(string imagePath)
    {
        _currentImagePath = imagePath;
        if (CurrentBackgroundRenderer is ImageBackgroundRenderer imageRenderer)
        {
            imageRenderer.SetBackgroundImage(imagePath);
        }
    }

    private string? GetImagePathFromRenderer(ImageBackgroundRenderer renderer)
    {
        return _currentImagePath;
    }

    public void SetCardRenderer(string rendererName)
    {
        CurrentCardRenderer = _rendererFactory.CreateCardRenderer(rendererName);
    }

    public void SetEffectProcessor(string processorName)
    {
        CurrentEffectProcessor = _rendererFactory.CreateEffectProcessor(processorName);
    }

    public void UpdateEffects(IEnumerable<Card> cards, double animationTime, bool isBackgroundAnimationEnabled)
    {
        if (isBackgroundAnimationEnabled)
        {
            CurrentEffectProcessor.UpdateEffects(cards, animationTime);
        }
    }

    private void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }

    private bool SetProperty<T>(ref T field, T value, [CallerMemberName] string? propertyName = null)
    {
        if (Equals(field, value))
        {
            return false;
        }

        field = value;
        OnPropertyChanged(propertyName);
        return true;
    }
}
