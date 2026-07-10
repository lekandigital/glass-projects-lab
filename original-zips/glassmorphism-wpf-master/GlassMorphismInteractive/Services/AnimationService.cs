using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Threading;
using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;

namespace GlassMorphismInteractive.Services;

public sealed class AnimationService : IAnimationService, INotifyPropertyChanged
{
    private readonly DispatcherTimer _animationTimer;
    private readonly AnimationConfig _config;
    private bool _isAnimating = true;
    private bool _isBackgroundAnimationEnabled = true;
    private bool _isCardMovementEnabled = true;
    private double _speedMultiplier;

    public AnimationService(AnimationConfig config)
    {
        _config = config;
        _speedMultiplier = _config.DefaultSpeedMultiplier;

        _animationTimer = new DispatcherTimer();
        UpdateAnimationInterval();
        _animationTimer.Tick += OnAnimationTick;
    }

    public bool IsAnimating
    {
        get => _isAnimating;
        set => SetProperty(ref _isAnimating, value);
    }

    public bool IsCardMovementEnabled
    {
        get => _isCardMovementEnabled;
        set => SetProperty(ref _isCardMovementEnabled, value);
    }

    public bool IsBackgroundAnimationEnabled
    {
        get => _isBackgroundAnimationEnabled;
        set => SetProperty(ref _isBackgroundAnimationEnabled, value);
    }

    public double SpeedMultiplier
    {
        get => _speedMultiplier;
        set
        {
            var clampedValue = Math.Max(_config.MinSpeedMultiplier, Math.Min(_config.MaxSpeedMultiplier, value));
            if (SetProperty(ref _speedMultiplier, clampedValue))
            {
                UpdateAnimationInterval();
            }
        }
    }

    public double AnimationTime { get; private set; }

    public event EventHandler? AnimationTick;
    public event PropertyChangedEventHandler? PropertyChanged;

    public void Start()
    {
        _animationTimer.Start();
    }

    public void Stop()
    {
        _animationTimer.Stop();
    }

    public void Reset()
    {
        AnimationTime = 0;
        IsAnimating = true;
        IsCardMovementEnabled = true;
        IsBackgroundAnimationEnabled = true;
        SpeedMultiplier = _config.DefaultSpeedMultiplier;
    }

    public void UpdateCardPositions(IEnumerable<Card> cards, float canvasWidth, float canvasHeight)
    {
        if (!IsCardMovementEnabled)
        {
            return;
        }

        var centerX = canvasWidth / 2;
        var centerY = canvasHeight / 2;

        foreach (var card in cards)
        {
            var angle = AnimationTime * card.OrbitSpeed + card.PhaseOffset;
            card.X = centerX + (float)(Math.Cos(angle) * card.OrbitRadius);
            card.Y = centerY + (float)(Math.Sin(angle) * card.OrbitRadius * _config.EllipseVerticalFactor);
        }
    }

    private void UpdateAnimationInterval()
    {
        if (_animationTimer != null)
        {
            _animationTimer.Interval = TimeSpan.FromMilliseconds(_config.FrameInterval / SpeedMultiplier);
        }
    }

    private void OnAnimationTick(object? sender, EventArgs e)
    {
        if (IsAnimating)
        {
            AnimationTime += _config.FrameInterval / 1000.0; // Convert to seconds
            AnimationTick?.Invoke(this, EventArgs.Empty);
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
