import React from "react";
import { makeStyles } from "@material-ui/core";
import { Card } from "./blackjack_rules";

const useStyles = makeStyles({
  root: {
    display: "flex"
  },
  labelContainer: {
    display: "flex",
    flexDirection: "column",
    marginRight: 8
  },
  cardContainer: {
    display: "flex",
    flexDirection: "column",
    "& > *": {
      minWidth: 0,
      wordBreak: "break-word"
    }
  },
  "@keyframes blink": {
    from: { backgroundColor: "transparent" },
    to: { backgroundColor: "transparent" },
    "50%": {
      backgroundColor: "#ffab00"
    }
  },
  cursor: {
    animation: ".8s $blink ease infinite"
  }
});

interface Props {
  hand: Card[];
  dealer: Card[];
  other: Card[];
  active?: "hand" | "dealer" | "other";
}

function card_arry_to_string(cards: Card[]) {
  return cards.map(c => (c === 1 ? "A" : c)).join(" ") + " ";
}

export default function({ hand, dealer, other, active }: Props) {
  const classes = useStyles();
  const cursor = <span className={classes.cursor}>&nbsp;</span>;
  return (
    <div className={classes.root}>
      <div className={classes.labelContainer}>
        <div>Hand</div>
        <div>Dealer</div>
        <div>Other</div>
      </div>
      <div className={classes.cardContainer}>
        <div>
          {card_arry_to_string(hand)}
          {active === "hand" && cursor}
        </div>
        <div>
          {card_arry_to_string(dealer)}
          {active === "dealer" && cursor}
        </div>
        <div>
          {card_arry_to_string(other)}
          {active === "other" && cursor}
        </div>
      </div>
    </div>
  );
}
