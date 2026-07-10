using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Windows.Input;
using GlassMorphismInteractive.Commands;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using GlassMorphismInteractive.Services;
using Microsoft.Win32;
using SkiaSharp;

namespace GlassMorphismInteractive.ViewModels;

public class MainViewModel : BaseViewModel
{
    private readonly ICardFactory _cardFactory;
    private float _canvasHeight = UiConstants.DefaultCanvasHeight;
    private float _canvasWidth = UiConstants.DefaultCanvasWidth;
    private string _pauseBackgroundButtonText = UiConstants.PauseBackgroundButtonText;
    private string _pauseCardsButtonText = UiConstants.PauseCardsButtonText;
    private string _playPauseButtonText = UiConstants.PauseButtonText;
    private int _selectedBackgroundIndex;
    private int _selectedCardIndex;
    private string? _selectedImagePath;
    private int _selectedProcessorIndex;

    public MainViewModel(IAnimationService animationService, EffectManager effectManager, ICardFactory cardFactory)
    {
        AnimationService = animationService;
        EffectManager = effectManager;
        _cardFactory = cardFactory;

        Cards = new ObservableCollection<Card>();
        PlayPauseCommand = new RelayCommand(ExecutePlayPause);
        PauseCardsCommand = new RelayCommand(ExecutePauseCards);
        PauseBackgroundCommand = new RelayCommand(ExecutePauseBackground);
        ResetCommand = new RelayCommand(ExecuteReset);
        SelectImageCommand = new RelayCommand(ExecuteSelectImage);

        AnimationService.AnimationTick += OnAnimationTick;
        AnimationService.PropertyChanged += OnAnimationServicePropertyChanged;

        InitializeCards();
        AnimationService.Start();
    }

    public ObservableCollection<Card> Cards { get; }
    public EffectManager EffectManager { get; }
    public IAnimationService AnimationService { get; }

    public bool IsAnimating
    {
        get => AnimationService.IsAnimating;
        set => AnimationService.IsAnimating = value;
    }

    public double SpeedMultiplier
    {
        get => AnimationService.SpeedMultiplier;
        set => AnimationService.SpeedMultiplier = value;
    }

    public string PlayPauseButtonText
    {
        get => _playPauseButtonText;
        set => SetProperty(ref _playPauseButtonText, value);
    }

    public string PauseCardsButtonText
    {
        get => _pauseCardsButtonText;
        set => SetProperty(ref _pauseCardsButtonText, value);
    }

    public string PauseBackgroundButtonText
    {
        get => _pauseBackgroundButtonText;
        set => SetProperty(ref _pauseBackgroundButtonText, value);
    }

    public bool IsCardMovementEnabled
    {
        get => AnimationService.IsCardMovementEnabled;
        set
        {
            AnimationService.IsCardMovementEnabled = value;
            OnPropertyChanged();
        }
    }

    public bool IsBackgroundAnimationEnabled
    {
        get => AnimationService.IsBackgroundAnimationEnabled;
        set
        {
            AnimationService.IsBackgroundAnimationEnabled = value;
            OnPropertyChanged();
        }
    }

    public float CanvasWidth
    {
        get => _canvasWidth;
        set => SetProperty(ref _canvasWidth, value);
    }

    public float CanvasHeight
    {
        get => _canvasHeight;
        set => SetProperty(ref _canvasHeight, value);
    }

    public double AnimationTime => AnimationService.AnimationTime;

    public int SelectedBackgroundIndex
    {
        get => _selectedBackgroundIndex;
        set
        {
            if (SetProperty(ref _selectedBackgroundIndex, value))
            {
                HandleBackgroundSelection(value);
            }
        }
    }

    public int SelectedCardIndex
    {
        get => _selectedCardIndex;
        set
        {
            if (SetProperty(ref _selectedCardIndex, value))
            {
                HandleCardSelection(value);
            }
        }
    }

    public int SelectedProcessorIndex
    {
        get => _selectedProcessorIndex;
        set
        {
            if (SetProperty(ref _selectedProcessorIndex, value))
            {
                HandleProcessorSelection(value);
            }
        }
    }

    public ICommand PlayPauseCommand { get; private set; }
    public ICommand PauseCardsCommand { get; private set; }
    public ICommand PauseBackgroundCommand { get; private set; }
    public ICommand ResetCommand { get; private set; }
    public ICommand SelectImageCommand { get; private set; }

    public string? SelectedImagePath
    {
        get => _selectedImagePath;
        set => SetProperty(ref _selectedImagePath, value);
    }

    public bool IsImageBackgroundSelected => SelectedBackgroundIndex == 3; // Image is the 4th option (index 3)

    private void OnAnimationServicePropertyChanged(object? sender, PropertyChangedEventArgs e)
    {
        if (e.PropertyName == nameof(IAnimationService.IsAnimating))
        {
            OnPropertyChanged(nameof(IsAnimating));
        }
        else if (e.PropertyName == nameof(IAnimationService.SpeedMultiplier))
        {
            OnPropertyChanged(nameof(SpeedMultiplier));
        }
        else if (e.PropertyName == nameof(IAnimationService.IsCardMovementEnabled))
        {
            OnPropertyChanged(nameof(IsCardMovementEnabled));
        }
        else if (e.PropertyName == nameof(IAnimationService.IsBackgroundAnimationEnabled))
        {
            OnPropertyChanged(nameof(IsBackgroundAnimationEnabled));
        }
    }

    private void OnAnimationTick(object? sender, EventArgs e)
    {
        AnimationService.UpdateCardPositions(Cards, CanvasWidth, CanvasHeight);
        EffectManager.UpdateEffects(Cards, AnimationTime, IsBackgroundAnimationEnabled);
    }

    private void InitializeCards()
    {
        Cards.Clear();
        foreach (var card in _cardFactory.CreateDefaultCards())
        {
            Cards.Add(card);
        }
    }

    private void ExecutePlayPause()
    {
        IsAnimating = !IsAnimating;
        PlayPauseButtonText = IsAnimating ? UiConstants.PauseButtonText : UiConstants.PlayButtonText;
    }

    private void ExecutePauseCards()
    {
        IsCardMovementEnabled = !IsCardMovementEnabled;
        PauseCardsButtonText =
            IsCardMovementEnabled ? UiConstants.PauseCardsButtonText : UiConstants.ResumeCardsButtonText;
    }

    private void ExecutePauseBackground()
    {
        IsBackgroundAnimationEnabled = !IsBackgroundAnimationEnabled;
        PauseBackgroundButtonText = IsBackgroundAnimationEnabled
            ? UiConstants.PauseBackgroundButtonText
            : UiConstants.ResumeBackgroundButtonText;
    }

    private void ExecuteReset()
    {
        AnimationService.Reset();
        PlayPauseButtonText = UiConstants.PauseButtonText;
        PauseCardsButtonText = UiConstants.PauseCardsButtonText;
        PauseBackgroundButtonText = UiConstants.PauseBackgroundButtonText;

        foreach (var card in Cards)
        {
            card.BlendFactor = UiConstants.DefaultBlendFactor;
            card.Opacity = card.BaseColor == SKColors.White
                ? UiConstants.DefaultWhiteCardOpacity
                : UiConstants.DefaultColoredCardOpacity;
            card.Blur = UiConstants.DefaultBlur;
            card.Saturation = card.BaseColor == SKColors.White
                ? UiConstants.DefaultWhiteCardSaturation
                : UiConstants.DefaultColoredCardSaturation;
            card.InfluencingCard = null;
        }
    }

    private void ExecuteSelectImage()
    {
        var openFileDialog = new OpenFileDialog
        {
            Title = UiConstants.SelectImageDialogTitle, Filter = UiConstants.ImageFileFilter, Multiselect = false
        };

        if (openFileDialog.ShowDialog() == true)
        {
            SelectedImagePath = openFileDialog.FileName;

            // If image background is currently selected, apply the new image
            if (IsImageBackgroundSelected)
            {
                SetImageBackground(SelectedImagePath);
            }
        }
    }

    private void SetImageBackground(string imagePath)
    {
        EffectManager.SetImageBackground(imagePath);
        // Force a refresh when image changes by notifying property changed
        OnPropertyChanged(nameof(SelectedImagePath));
    }

    public void SetCanvasDimensions(float width, float height)
    {
        CanvasWidth = width;
        CanvasHeight = height;
    }

    private void HandleBackgroundSelection(int index)
    {
        if (index >= 0 && index < RendererCollections.BackgroundTypes.Length)
        {
            EffectManager.SetBackgroundRenderer(RendererCollections.BackgroundTypes[index]);
            OnPropertyChanged(nameof(IsImageBackgroundSelected));

            // If image background is selected, apply current image path
            if (index == 3 && !string.IsNullOrEmpty(SelectedImagePath)) // Image background
            {
                SetImageBackground(SelectedImagePath);
            }
        }
    }

    private void HandleCardSelection(int index)
    {
        if (index >= 0 && index < RendererCollections.CardTypes.Length)
        {
            EffectManager.SetCardRenderer(RendererCollections.CardTypes[index]);
        }
    }

    private void HandleProcessorSelection(int index)
    {
        if (index >= 0 && index < RendererCollections.ProcessorTypes.Length)
        {
            EffectManager.SetEffectProcessor(RendererCollections.ProcessorTypes[index]);
        }
    }
}
