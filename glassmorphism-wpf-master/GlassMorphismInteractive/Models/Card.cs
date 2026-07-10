using System.ComponentModel;
using System.Runtime.CompilerServices;
using SkiaSharp;

namespace GlassMorphismInteractive.Models;

public sealed class Card : INotifyPropertyChanged
{
    private float _blendFactor;
    private float _blur;
    private Card? _influencingCard;
    private float _opacity = 1.0f;
    private float _saturation = 1.0f;
    private float _x;
    private float _y;

    public float X
    {
        get => _x;
        set => SetProperty(ref _x, value);
    }

    public float Y
    {
        get => _y;
        set => SetProperty(ref _y, value);
    }

    public float BlendFactor
    {
        get => _blendFactor;
        set => SetProperty(ref _blendFactor, value);
    }

    public float Opacity
    {
        get => _opacity;
        set => SetProperty(ref _opacity, Math.Max(0, Math.Min(1, value)));
    }

    public float Blur
    {
        get => _blur;
        set => SetProperty(ref _blur, Math.Max(0, value));
    }

    public float Saturation
    {
        get => _saturation;
        set => SetProperty(ref _saturation, Math.Max(0, value));
    }

    public Card? InfluencingCard
    {
        get => _influencingCard;
        set => SetProperty(ref _influencingCard, value);
    }

    public float Width { get; set; }
    public float Height { get; set; }
    public SKColor BaseColor { get; set; }
    public SKColor SecondaryColor { get; set; }
    public float OrbitRadius { get; set; }
    public float OrbitSpeed { get; set; }
    public double PhaseOffset { get; set; }

    public float EffectiveOpacity => Opacity * (0.3f + BlendFactor * 0.4f);
    public float EffectiveBlur => Blur + BlendFactor * 15f;
    public SKColor EffectiveBaseColor => ApplySaturation(BaseColor, Saturation);
    public SKColor EffectiveSecondaryColor => ApplySaturation(SecondaryColor, Saturation);

    public event PropertyChangedEventHandler? PropertyChanged;

    private static SKColor ApplySaturation(SKColor color, float saturation)
    {
        // Convert to HSV, adjust saturation, convert back
        color.ToHsv(out var h, out var s, out var v);
        s *= saturation;
        return SKColor.FromHsv(h, Math.Min(100, s), v);
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
