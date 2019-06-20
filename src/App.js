import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  const [prob, setProb] = useState(null);
  useEffect(() => {
    import("./wasm").then(({ Deck, Card, SpecificHandEV }) => {
      const remaining_deck = Deck.generate(1);
      remaining_deck.remove_card(Card.Ace);
      remaining_deck.remove_card(Card.Ace);
      remaining_deck.remove_card(Card.Five);
      const hand = Deck.new();
      hand.add_card(Card.Ace);
      hand.add_card(Card.Ace);
      setProb(SpecificHandEV.create(remaining_deck, hand, Card.Eight).split);
    });
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {prob}
      </header>
    </div>
  );
}

export default App;
