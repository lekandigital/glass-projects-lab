using System.ComponentModel;
using GlassMorphismInteractive.Models;

namespace GlassMorphismInteractive.Interfaces;

public interface IAnimationService
{
    bool IsAnimating { get; set; }
    bool IsCardMovementEnabled { get; set; }
    bool IsBackgroundAnimationEnabled { get; set; }
    double SpeedMultiplier { get; set; }
    double AnimationTime { get; }

    event EventHandler? AnimationTick;
    event PropertyChangedEventHandler? PropertyChanged;

    void Start();
    void Stop();
    void Reset();
    void UpdateCardPositions(IEnumerable<Card> cards, float canvasWidth, float canvasHeight);
}
