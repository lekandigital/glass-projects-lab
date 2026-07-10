namespace GlassMorphismInteractive.Configuration;

public static class RenderingConstants
{
    public const string BackgroundClearColor = "#0a0a0a";
    public const float InfluenceThreshold = 0.1f;

    // Background sampling and blending constants
    public const float ClassicCardBackgroundBlendStrength = 0.4f;
    public const float HolographicCardBackgroundBlendStrength = 0.3f;
    public const float NeonCardBackgroundBlendStrength = 0.35f;
    public const float ClassicCardBaseOpacity = 0.8f;
    public const float HolographicCardBaseOpacity = 0.9f;
    public const float NeonCardBaseOpacity = 0.85f;
    public const float TransparentGlassCardBackgroundBlendStrength = 0.9f;
    public const float TransparentGlassCardCornerRadius = 15f;
    public const float TransparentGlassCardShadowOffset = 3f;
    public const float TransparentGlassCardShadowBlur = 6f;
    public const byte TransparentGlassCardShadowAlpha = 80;
    public const byte TransparentGlassCardSurfaceBaseAlpha = 160;
    public const byte TransparentGlassCardFrostAlpha = 30;
    public const float TransparentGlassCardFrostOffset = 2f;
    public const float TransparentGlassCardFrostBlur = 2f;
    public const byte TransparentGlassCardRefractionMaxAlpha = 60;
    public const byte TransparentGlassCardRefractionMinAlpha = 20;
    public const byte TransparentGlassCardRefractionMidAlpha = 40;
    public const float TransparentGlassCardOuterStrokeWidth = 1.5f;
    public const float TransparentGlassCardInnerStrokeWidth = 0.8f;
    public const byte TransparentGlassCardOuterHighlightAlpha = 100;
    public const byte TransparentGlassCardInnerHighlightAlpha = 60;
    public const float TransparentGlassCardReflectionSpeed = 15f;
    public const float TransparentGlassCardReflectionWidth = 40f;
    public const float TransparentGlassCardReflectionStartOffset = 25f;
    public const float TransparentGlassCardReflectionHeightRatio = 0.6f;
    public const float TransparentGlassCardReflectionTopRatio = 0.2f;
    public const byte TransparentGlassCardReflectionPeakAlpha = 80;
    public const byte TransparentGlassCardReflectionMidAlpha = 40;

    // Neon Grid background constants
    public const float NeonGridSize = 80f;
    public const float NeonGridLineWidth = 2f;
    public const float NeonGridGlowWidth = 8f;
    public const float NeonGridAnimationSpeed = 1.5f;
    public const float NeonGridPulseSpeed = 2f;
    public const float NeonGridWaveAmplitude = 12f;
    public const float NeonGridWaveFrequency = 0.008f;
    public const byte NeonGridBaseAlpha = 60;
    public const byte NeonGridGlowAlpha = 40;
    public const byte NeonGridNodeAlpha = 120;
    public const float NeonGridNodeSize = 4f;
    public const float NeonGridNodeGlow = 8f;
    public const int NeonGridEnergyLineCount = 8;
    public const float NeonGridEnergySpeed = 30f;
    public const float NeonGridEnergyDashLength = 15f;
    public const float NeonGridEnergyGapLength = 8f;

    // Water Drop Glass Card rendering constants
    public const float WaterDropCardCornerRadius = 20f;
    public const float WaterDropCardSurfaceTension = 0.8f;
    public const float WaterDropCardRefractionIndex = 1.33f;
    public const float WaterDropCardCurvatureIntensity = 0.6f;
    public const float WaterDropCardRippleSpeed = 2.5f;
    public const float WaterDropCardRippleFrequency = 4f;
    public const float WaterDropCardRippleAmplitude = 8f;
    public const byte WaterDropCardBaseAlpha = 180;
    public const byte WaterDropCardRefractionAlpha = 120;
    public const byte WaterDropCardCausticsAlpha = 80;
    public const byte WaterDropCardHighlightAlpha = 200;
    public const float WaterDropCardCausticsSpeed = 1.8f;
    public const float WaterDropCardCausticsScale = 0.015f;
    public const float WaterDropCardMeniscusHeight = 4f;
    public const float WaterDropCardShadowBlur = 8f;
    public const byte WaterDropCardShadowAlpha = 60;
}

public static class RenderingColors
{
    // Background Colors
    public const string NeonGridClearColor = "#050505";
    public const string NeonCyan = "#00ccff";
    public const string NeonMagenta = "#ff00cc";
    public const string NeonYellow = "#ffff00";

    // Classic Background Gradient Colors
    public const string ClassicGradientTop = "#1a1a2e";
    public const string ClassicGradientMiddle = "#16213e";
    public const string ClassicGradientBottom = "#0f0f23";

    // Aurora Background Colors
    public const string AuroraBaseColor = "#0a0a0a";
    public const string AuroraPurple = "#1a0a2e";
    public const string AuroraGreen = "#00ff88";
    public const string AuroraBlue = "#0088ff";
    public const string AuroraPink = "#ff0088";

    // Card Colors
    public const string NeonCardBackgroundColor = "#0a0a0a";

    // Holographic Colors
    public const string HolographicPink = "#ff0080";
    public const string HolographicBlue = "#0080ff";
    public const string HolographicGreen = "#80ff00";
    public const string HolographicOrange = "#ff8000";
    public const string HolographicPurple = "#8000ff";
    public const string HolographicMagenta = "#ff00ff";
    public const string HolographicCyan = "#00ffff";
    public const string HolographicYellow = "#ffff00";

    // Image Background Colors
    public const string ImageBackgroundColor = "#0a0a0a";
    public const string ImageOverlayColor = "#20000000";
}

public static class UiConstants
{
    // Default canvas dimensions
    public const float DefaultCanvasWidth = 1200f;
    public const float DefaultCanvasHeight = 800f;

    // Button text
    public const string PlayButtonText = "Play";
    public const string PauseButtonText = "Pause";

    public const string PauseCardsButtonText = "Pause Cards";
    public const string ResumeCardsButtonText = "Resume Cards";

    public const string PauseBackgroundButtonText = "Pause Background";
    public const string ResumeBackgroundButtonText = "Resume Background";

    // Default card property values
    public const float DefaultBlendFactor = 0f;
    public const float DefaultBlur = 0f;
    public const float DefaultWhiteCardOpacity = 0.8f;
    public const float DefaultColoredCardOpacity = 0.9f;
    public const float DefaultWhiteCardSaturation = 0.3f;
    public const float DefaultColoredCardSaturation = 1.0f;

    // Image file filter for open dialog
    public const string ImageFileFilter = "Image Files|*.jpg;*.jpeg;*.png;*.bmp;*.gif;*.tiff|All Files|*.*";
    public const string SelectImageDialogTitle = "Select Background Image"; // UI Display Text for ComboBox Options
    public const string BackgroundStyleLabel = "Background Style:";
    public const string CardStyleLabel = "Card Style:";
    public const string EffectProcessorLabel = "Effect Processor:";
    public const string SelectImageButtonText = "Select Image...";

    // Background Options Display Text
    public const string ClassicGradientDisplay = "Classic Gradient";
    public const string AuroraWavesDisplay = "Aurora Waves";
    public const string NeonGridDisplay = "Neon Grid";
    public const string ImageBackgroundDisplay = "Image Background"; // Card Style Options Display Text
    public const string ClassicGlassDisplay = "Classic Glass";
    public const string HolographicDisplay = "Holographic";
    public const string NeonGlowDisplay = "Neon Glow";
    public const string TransparentGlassDisplay = "Transparent Glass";
    public const string EnhancedGlassDisplay = "Enhanced Glass";
    public const string WaterDropDisplay = "Water Drop";

    // Effect Processor Options Display Text
    public const string ClassicGlassmorphismDisplay = "Classic Glassmorphism";
    public const string EnhancedGlassmorphismDisplay = "Enhanced Glassmorphism";
}

public static class ColorConstants
{
    // UI Panel Colors
    public const string WindowBackground = "Black";
    public const string PanelBackground = "#33000000";
    public const string TextForeground = "White";

    // Button Colors
    public const string PlayPauseButtonBackground = "#4400FF88";
    public const string ResetButtonBackground = "#44FF8800";
    public const string ButtonForeground = "White";
}

public static class RendererNames
{
    // Background Renderers
    public const string ClassicBackground = "Classic";
    public const string AuroraBackground = "Aurora";
    public const string NeonGridBackground = "NeonGrid";
    public const string ImageBackground = "Image"; // Card Renderers
    public const string ClassicCard = "Classic";
    public const string HolographicCard = "Holographic";
    public const string NeonCard = "Neon";
    public const string TransparentGlassCard = "Transparent Glass";
    public const string EnhancedTransparentGlassCard = "Enhanced Glass";
    public const string WaterDropCard = "Water Drop"; // Effect Processors
    public const string ClassicProcessor = "Classic";
    public const string EnhancedProcessor = "Enhanced";
}

public static class RendererCollections
{
    public static readonly string[] BackgroundTypes =
    {
        RendererNames.ClassicBackground, RendererNames.AuroraBackground, RendererNames.NeonGridBackground,
        RendererNames.ImageBackground
    };

    public static readonly string[] CardTypes =
    {
        RendererNames.ClassicCard, RendererNames.HolographicCard, RendererNames.NeonCard,
        RendererNames.TransparentGlassCard, RendererNames.EnhancedTransparentGlassCard, RendererNames.WaterDropCard
    };

    public static readonly string[] ProcessorTypes =
    {
        RendererNames.ClassicProcessor, RendererNames.EnhancedProcessor
    };
}
