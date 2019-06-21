addEventListener("message", ({ data }) => {
  if ("removed_cards" in data) {
    wasm.then(({ Deck, Card, SpecificHandEV }) => {
      const remaining_deck = Deck.generate(1);
      for (card of data.removed_cards) {
        remaining_deck.remove_card(card);
      }
      remaining_deck.remove_card(data.dealer_card);
      const hand = Deck.new();
      for (card of data.hand) {
        hand.add_card(card);
        remaining_deck.remove_card(card);
      }
      ev = SpecificHandEV.create_js(
        remaining_deck,
        hand,
        data.dealer_card,
        progress => {
          postMessage({ progress });
        }
      );
      postMessage({
        ev: {
          hit: ev.hit,
          stand: ev.stand,
          split: ev.split,
          double: ev.double
        }
      });
    });
  } else if ("hit_card" in data) {
    ev.add_hit_card(data.hit_card);
    postMessage({
      ev: {
        hit: ev.hit,
        stand: ev.stand,
        split: ev.split,
        double: ev.double
      }
    });
  }
});

let ev = null;

const wasm = import("./wasm");
