import React, {
  useEffect,
  useState,
  useRef,
  useReducer,
  useCallback
} from "react";
import {
  CircularProgress,
  ButtonBase,
  withStyles,
  Typography,
  WithStyles,
  createStyles
} from "@material-ui/core";
import { BackspaceTwoTone, CheckCircleTwoTone } from "@material-ui/icons";
import { produce } from "immer";

import Worker from "./bj.worker.js";
import { Card } from "./Card";

const styles = createStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%"
  },
  row: {
    display: "flex",
    flex: "1 0 0"
  },
  button: {
    //flexGrow: 1
    flex: "1 0 0",
    borderTop: "4px solid",
    borderLeft: "4px solid",
    color: "#ffab00",
    backgroundColor: "black"
  },
  icon: {
    fontSize: "4rem"
  }
});
const array_chunks = (array: any[], chunk_size: number) =>
  Array(Math.ceil(array.length / chunk_size))
    .fill(0)
    .map((_, index) => index * chunk_size)
    .map(begin => array.slice(begin, begin + chunk_size));
const grouped_cards = array_chunks(
  Object.values(Card)
    .filter(x => typeof x === "number")
    .sort((a, b) => a - b)
    .slice(1),
  3
);

enum EntryStage {
  Hand,
  Dealer,
  RemovedCards,
  Working,
  Result
}
enum ActionType {
  CardButton,
  Backspace,
  Submit
}
interface BaseAction {
  type: ActionType.Backspace | ActionType.Submit;
}

interface CardAction {
  type: ActionType.CardButton;
  payload: Card;
}

type Action = BaseAction | CardAction;

interface State {
  entry_stage: EntryStage;
  hand: Card[];
  dealer: Card[];
  removed_cards: Card[];
}

const initialState: State = {
  entry_stage: EntryStage.Hand,
  hand: [],
  dealer: [],
  removed_cards: []
};

function get_current_card_array(state: State) {
  return state.entry_stage === EntryStage.Hand
    ? state.hand
    : state.entry_stage === EntryStage.Dealer
    ? state.dealer
    : state.entry_stage === EntryStage.RemovedCards
    ? state.removed_cards
    : null;
}

function reducer(state: State, action: Action) {
  return produce(state, draft => {
    let card_array = get_current_card_array(draft);

    switch (action.type) {
      case ActionType.CardButton: {
        if (card_array) {
          if (card_array != draft.dealer || card_array.length === 0) {
            card_array.push(action.payload);
          }
        }
        return;
      }
      case ActionType.Backspace: {
        if (card_array) {
          card_array.pop();
        }
        return;
      }
      case ActionType.Submit: {
        switch (draft.entry_stage) {
          case EntryStage.Hand:
            draft.entry_stage = EntryStage.Dealer;
            return;
          case EntryStage.Dealer:
            draft.entry_stage = EntryStage.RemovedCards;
            return;
          case EntryStage.RemovedCards:
            draft.entry_stage = EntryStage.Working;
            return;
        }
      }
    }
  });
}

function App({ classes }: WithStyles<typeof styles>) {
  const worker = useRef<any>(null);
  const [result, setResult] = useState(null);
  const [progress, setProgress] = useState(null);
  const [entryState, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    worker.current = new Worker();
    worker.current.onmessage = ({ data }: any) =>
      data.progress !== undefined
        ? setProgress(data.progress)
        : (console.log(data.ev), setProgress(null));
  }, []);
  useEffect(() => {
    if (entryState.entry_stage === EntryStage.Working) {
      console.log(entryState);
      worker.current.postMessage({
        removed_cards: entryState.removed_cards,
        hand: entryState.hand,
        dealer_card: entryState.dealer
      });
    }
  }, [entryState]);
  let display: string = "";
  const card_array = get_current_card_array(entryState);
  if (card_array) {
    display = card_array.map(c => (c === 1 ? "A" : c)).join(" ");
  }
  const submit_disabled =
    entryState.entry_stage === EntryStage.Hand
      ? entryState.hand.length < 2
      : entryState.entry_stage === EntryStage.Dealer
      ? entryState.dealer.length < 1
      : entryState.entry_stage === EntryStage.RemovedCards
      ? false
      : true;
  return (
    <div className={classes.root}>
      <div className={classes.row}>
        {progress !== null && (
          <CircularProgress
            variant="static"
            value={Math.round(progress! * 100)}
          />
        )}
        {display}
      </div>
      {grouped_cards.map((row, i) => (
        <div className={classes.row} key={i}>
          {row.map(v => (
            <ButtonBase
              className={classes.button}
              key={v}
              onClick={() =>
                dispatch({ type: ActionType.CardButton, payload: v })
              }
            >
              <Typography
                variant="h3"
                style={v === 10 ? { fontSize: "2rem" } : undefined}
              >
                {v !== 10 ? v : "10 / J / Q / K"}
              </Typography>
            </ButtonBase>
          ))}
        </div>
      ))}
      <div className={classes.row}>
        <ButtonBase
          className={classes.button}
          key="delete"
          onClick={() => dispatch({ type: ActionType.Backspace })}
          disabled={card_array === null || card_array.length == 0}
        >
          <BackspaceTwoTone className={classes.icon} />
        </ButtonBase>
        <ButtonBase
          className={classes.button}
          key={1}
          onClick={() => dispatch({ type: ActionType.CardButton, payload: 1 })}
        >
          <Typography variant="h3">A</Typography>
        </ButtonBase>
        <ButtonBase
          className={classes.button}
          key="submit"
          onClick={() => dispatch({ type: ActionType.Submit })}
          disabled={submit_disabled}
        >
          <CheckCircleTwoTone className={classes.icon} />
        </ButtonBase>
      </div>
    </div>
  );
}

export default withStyles(styles)(App);
