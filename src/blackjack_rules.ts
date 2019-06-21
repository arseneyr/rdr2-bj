export enum Card {
  Ace = 1,
  Two = 2,
  Three = 3,
  Four = 4,
  Five = 5,
  Six = 6,
  Seven = 7,
  Eight = 8,
  Nine = 9,
  Ten = 10
}

export interface HandValue {
  soft: boolean;
  value: number;
}

export function add_card(hand_value: HandValue, card: Card) {
  const ret = { ...hand_value };
  ret.value += card;
  if (ret.soft && ret.value > 21) {
    ret.soft = false;
    ret.value -= 10;
  } else if (!ret.soft && card === Card.Ace && ret.value <= 10) {
    ret.soft = true;
    ret.value += 10;
  }
  return ret;
}

export function get_hand_value(cards: Card[]) {
  let ret = { soft: false, value: 0 };
  for (const card of cards) {
    ret = add_card(ret, card);
  }
  return ret;
}

interface ValidMap {
  [index: number]: boolean;
}

const all_valid = Object.fromEntries(
  Object.values(Card)
    .filter(c => typeof c === "number")
    .map(c => [c, true])
);

export function get_unbusting_cards(hand_value: HandValue) {
  const ret: ValidMap = {};
  for (const card of Object.values(Card).filter(
    c => typeof c === "number"
  ) as Card[]) {
    if (add_card(hand_value, card).value <= 21) {
      ret[card] = true;
    }
  }
  return ret;
}

export function get_valid_cards(cards: Card[]) {
  const deck: Map<number, number> = new Map(
    Object.values(Card)
      .filter(c => typeof c === "number")
      .map(c => [c, 0])
  );
  for (const card of cards) {
    deck.set(card, deck.get(card)! + 1);
  }
  return Object.fromEntries(
    Array.from(deck.entries()).map(([c, v]) => [
      c,
      c === Card.Ten ? v < 16 : v < 4
    ])
  );
}

export function merge_valid_maps(...valid_maps: ValidMap[]) {
  return valid_maps.reduce(
    (acc, m) => {
      for (const card of Object.values(Card).filter(
        c => typeof c === "number"
      )) {
        if (!m[card]) {
          acc[card] = false;
        }
      }
      return acc;
    },
    { ...all_valid }
  );
}
