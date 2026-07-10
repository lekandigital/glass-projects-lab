namespace GlassMorphismInteractive.Configuration;

public class AnimationConfig
{
    public double FrameInterval { get; set; } = 16.0; // ~60 FPS
    public float EllipseVerticalFactor { get; set; } = 0.6f;
    public double MinSpeedMultiplier { get; set; } = 0.1;
    public double MaxSpeedMultiplier { get; set; } = 3.0;
    public double DefaultSpeedMultiplier { get; set; } = 1.0;
}
