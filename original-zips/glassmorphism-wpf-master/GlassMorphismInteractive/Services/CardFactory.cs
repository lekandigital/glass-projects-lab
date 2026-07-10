using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Interfaces;
using GlassMorphismInteractive.Models;
using SkiaSharp;

namespace GlassMorphismInteractive.Services;

public class CardFactory(CardConfig cardConfig) : ICardFactory
{
    public Card CreateCard(CardTemplate template)
    {
        return new Card
        {
            BaseColor = template.BaseColor,
            SecondaryColor = template.SecondaryColor,
            Width = cardConfig.DefaultWidth,
            Height = cardConfig.DefaultHeight,
            OrbitRadius = template.OrbitRadius,
            OrbitSpeed = template.OrbitSpeed,
            PhaseOffset = template.PhaseOffset,
            Opacity = template.CustomOpacity ??
                      (template.BaseColor == SKColors.White
                          ? cardConfig.WhiteCardOpacity
                          : cardConfig.DefaultOpacity),
            Saturation = template.CustomSaturation ??
                         (template.BaseColor == SKColors.White
                             ? cardConfig.WhiteCardSaturation
                             : cardConfig.DefaultSaturation)
        };
    }

    public IEnumerable<Card> CreateDefaultCards()
    {
        var templates = new[]
        {
            new CardTemplate
            {
                BaseColor = SKColors.CornflowerBlue,
                SecondaryColor = SKColors.Purple,
                OrbitRadius = 200,
                OrbitSpeed = 1.0f,
                PhaseOffset = 0
            },
            new CardTemplate
            {
                BaseColor = SKColors.Orange,
                SecondaryColor = SKColors.Red,
                OrbitRadius = 150,
                OrbitSpeed = -0.7f,
                PhaseOffset = Math.PI
            },
            new CardTemplate
            {
                BaseColor = SKColors.White,
                SecondaryColor = SKColors.LightGray,
                OrbitRadius = 120,
                OrbitSpeed = 0.5f,
                PhaseOffset = Math.PI / 2
            }
        };

        return templates.Select(CreateCard);
    }
}
