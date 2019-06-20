addEventListener("message", ({ data }) => {
  data.removed_cards &&
    wasm.then(({ Deck, Card, SpecificHandEV }) => {
      const remaining_deck = Deck.generate(1);
      for (card in data.removed_cards) {
        remaining_deck.remove_card(card);
      }
      remaining_deck.remove_card(data.dealer_card);
      const hand = Deck.new();
      for (card in data.hand) {
        hand.add_card(card);
        hand.add_card(card);
      }
      const ev = SpecificHandEV.create(
        remaining_deck,
        hand,
        Card.Five,
        progress => {
          console.log(progress);
          postMessage({ progress });
        }
      );
      postMessage({ ev });
    });
});

const wasm = import("./wasm");
