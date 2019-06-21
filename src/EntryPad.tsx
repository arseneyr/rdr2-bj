import React, { useCallback } from "react";
import { makeStyles, ButtonBase, Typography } from "@material-ui/core";
import { Card } from "./blackjack_rules";
import { BackspaceTwoTone, CheckCircleTwoTone } from "@material-ui/icons";

const array_chunks = (array: any[], chunk_size: number) =>
  Array(Math.ceil(array.length / chunk_size))
    .fill(0)
    .map((_, index) => index * chunk_size)
    .map(begin => array.slice(begin, begin + chunk_size));
const grouped_cards = array_chunks(
  Object.values(Card)
    .filter(x => typeof x === "number")
    .sort((a, b) => a - b)
    .slice(0, 9),
  3
);

const borderStyle = "4px solid rgba(255,171,0, 0.2)";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    borderRight: borderStyle,
    borderBottom: borderStyle
  },
  row: {
    display: "flex",
    flex: "1 0 0"
  },
  button: {
    flex: "1 0 0",
    borderTop: borderStyle,
    borderLeft: borderStyle,
    transition: "color .1s"
  },
  icon: {
    fontSize: "4rem"
  },
  disabledButton: {
    color: "rgba(255,171,0, 0.2)"
  }
});

interface Props {
  onCardClick: (card: Card) => void;
  cardsEnabled: { [index: number]: boolean };
  onBackspaceClick: () => void;
  backspaceEnabled: boolean;
  onSubmitClick: () => void;
  submitEnabled: boolean;
  classes: any;
}

export default function EntryPad({
  onCardClick,
  onBackspaceClick,
  onSubmitClick,
  ...props
}: Props) {
  const classes = useStyles(props);
  return (
    <div className={classes.root}>
      {grouped_cards.map((row, i) => (
        <div className={classes.row} key={i}>
          {row.map(v => (
            <ButtonBase
              className={classes.button}
              classes={{ disabled: classes.disabledButton }}
              key={v}
              disabled={!props.cardsEnabled[v]}
              // eslint-disable-next-line react-hooks/rules-of-hooks, react-hooks/exhaustive-deps
              onClick={useCallback(() => onCardClick(v), [onCardClick])}
            >
              <Typography variant="h3">{v === 1 ? "A" : v}</Typography>
            </ButtonBase>
          ))}
        </div>
      ))}
      <div className={classes.row}>
        <ButtonBase
          className={classes.button}
          classes={{ disabled: classes.disabledButton }}
          key="delete"
          onClick={onBackspaceClick}
          disabled={!props.backspaceEnabled}
        >
          <BackspaceTwoTone className={classes.icon} />
        </ButtonBase>
        <ButtonBase
          className={classes.button}
          classes={{ disabled: classes.disabledButton }}
          key={10}
          disabled={!props.cardsEnabled[10]}
          onClick={useCallback(() => onCardClick(10), [onCardClick])}
        >
          <Typography variant="h3" style={{ fontSize: "2rem" }}>
            <table style={{ borderSpacing: "4px" }}>
              <tbody>
                <tr>
                  <td>10</td>
                  <td>J</td>
                </tr>
                <tr>
                  <td>Q</td>
                  <td>K</td>
                </tr>
              </tbody>
            </table>
          </Typography>
        </ButtonBase>
        <ButtonBase
          className={classes.button}
          classes={{ disabled: classes.disabledButton }}
          key="submit"
          onClick={onSubmitClick}
          disabled={!props.submitEnabled}
        >
          <CheckCircleTwoTone className={classes.icon} />
        </ButtonBase>
      </div>
    </div>
  );
}
