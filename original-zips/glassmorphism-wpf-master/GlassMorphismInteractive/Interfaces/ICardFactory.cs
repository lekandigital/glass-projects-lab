using GlassMorphismInteractive.Configuration;
using GlassMorphismInteractive.Models;

namespace GlassMorphismInteractive.Interfaces;

public interface ICardFactory
{
    Card CreateCard(CardTemplate template);
    IEnumerable<Card> CreateDefaultCards();
}
