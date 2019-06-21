addEventListener("message", ({ data }) => {
  data.removed_cards &&
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
      const ev = SpecificHandEV.create_js(
        remaining_deck,
        hand,
        data.dealer_card,
        progress => {
          postMessage({ progress });
        }
      );
      console.log(ev);
      postMessage({
        ev: {
          hit: ev.hit,
          stand: ev.stand,
          split: ev.split,
          double: ev.double,
          dealer_bj: ev.dealer_bj
        }
      });
    });
});

const wasm = import("./wasm");
