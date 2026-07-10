using SkiaSharp;

namespace GlassMorphismInteractive.Configuration;

public class CardConfig
{
    public float DefaultWidth { get; set; } = 280;
    public float DefaultHeight { get; set; } = 200;
    public float DefaultOpacity { get; set; } = 0.9f;
    public float WhiteCardOpacity { get; set; } = 0.8f;
    public float WhiteCardSaturation { get; set; } = 0.3f;
    public float DefaultSaturation { get; set; } = 1.0f;
}

public class CardTemplate
{
    public SKColor BaseColor { get; set; }
    public SKColor SecondaryColor { get; set; }
    public float OrbitRadius { get; set; }
    public float OrbitSpeed { get; set; }
    public double PhaseOffset { get; set; }
    public float? CustomOpacity { get; set; }
    public float? CustomSaturation { get; set; }
}
