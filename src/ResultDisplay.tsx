import React from "react";
import { ExpectedValues, get_ev_max } from "./blackjack_rules";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    margin: "0px 8px",
    flex: "1 0 auto"
  },
  results: {
    display: "flex",
    "& > :first-child": {
      alignItems: "flex-end",
      "& > *": {
        borderRight: "4px solid transparent",
        paddingLeft: 8
      },
      "& > $selected": {
        borderTopLeftRadius: 10,
        borderBottomLeftRadius: 10
      }
    },
    "& > :last-child": {
      textAlign: "left",
      whiteSpace: "pre",
      "& > *": {
        paddingRight: 8
      },
      "& > $selected": {
        borderTopRightRadius: 10,
        borderBottomRightRadius: 10
      }
    }
  },
  verticalContainer: {
    display: "flex",
    flexDirection: "column"
  },
  selected: {
    backgroundColor: "#ffab00",
    color: "black"
  },
  insuranceDiv: {
    paddingRight: 8
  }
});

interface Props {
  result: ExpectedValues | null;
  insurance: boolean | null;
}

function ev_to_string(value: number) {
  let num = (value * 100).toFixed(2);
  const padding =
    Math.abs(value * 100) < 10 ? "  " : Math.abs(value * 100) < 100 ? " " : "";
  return (padding + (value < 0 ? "" : "+") + num).padEnd(7, "0") + "%";
}

export default function ResultDisplay({ result, insurance }: Props) {
  const classes = useStyles();
  const max = result && get_ev_max(result);
  return (
    <div className={classes.root}>
      {result && (
        <div className={classes.results}>
          <div className={classes.verticalContainer}>
            <div
              className={max === result.stand ? classes.selected : undefined}
            >
              Stand:
            </div>
            {result.hit && (
              <div
                className={max === result.hit ? classes.selected : undefined}
              >
                Hit:
              </div>
            )}
            {result.double && (
              <div
                className={max === result.double ? classes.selected : undefined}
              >
                Double:
              </div>
            )}
            {result.split && (
              <div
                className={max === result.split ? classes.selected : undefined}
              >
                Split:
              </div>
            )}
          </div>
          <div className={classes.verticalContainer}>
            <div
              className={max === result.stand ? classes.selected : undefined}
            >
              {ev_to_string(result.stand)}
            </div>
            {result.hit && (
              <div
                className={max === result.hit ? classes.selected : undefined}
              >
                {ev_to_string(result.hit)}
              </div>
            )}
            {result.double && (
              <div
                className={max === result.double ? classes.selected : undefined}
              >
                {ev_to_string(result.double)}
              </div>
            )}
            {result.split && (
              <div
                className={max === result.split ? classes.selected : undefined}
              >
                {ev_to_string(result.split)}
              </div>
            )}
          </div>
        </div>
      )}
      {insurance !== null && (
        <div className={classes.insuranceDiv}>{`${
          insurance ? "Take" : "Skip"
        } insurance`}</div>
      )}
    </div>
  );
}
