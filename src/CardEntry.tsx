import React from "react";
import { makeStyles } from "@material-ui/core";
import { Card } from "./blackjack_rules";

const useStyles = makeStyles({
  entryTable: {
    "& td:first-child": {
      paddingRight: 8,
      verticalAlign: "top"
    },
    "& td:last-child": {
      paddingLeft: 8
    },
    "& td": {
      padding: 0
    },
    borderSpacing: 0
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
    <table className={classes.entryTable}>
      <tbody>
        <tr>
          <td>Hand</td>
          <td>
            {card_arry_to_string(hand)}
            {active === "hand" && cursor}
          </td>
        </tr>
        <tr>
          <td>Dealer</td>
          <td>
            {card_arry_to_string(dealer)}
            {active === "dealer" && cursor}
          </td>
        </tr>
        <tr>
          <td>Other</td>
          <td>
            {card_arry_to_string(other)}
            {active === "other" && cursor}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
