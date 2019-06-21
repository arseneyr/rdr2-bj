import React, {
  useEffect,
  useState,
  useRef,
  useReducer,
  useCallback
} from "react";
import {
  CircularProgress,
  withStyles,
  WithStyles,
  createStyles,
  Typography,
  IconButton,
  Button
} from "@material-ui/core";
import { Replay } from "@material-ui/icons";
import { produce } from "immer";

import Worker from "./bj.worker.js";
import {
  Card,
  HandValue,
  get_hand_value,
  merge_valid_maps,
  get_valid_cards,
  get_unbusting_cards
} from "./blackjack_rules";
import EntryPad from "./EntryPad";

const styles = createStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    color: "#ffab00",
    backgroundColor: "black"
  },
  entryPad: {
    flex: "7 0 0"
  },
  display: {
    flex: "3 0 0",
    position: "relative"
  },
  entryTable: {
    "& td:first-child": {
      borderRight: "1px solid",
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
  displayInner: {
    display: "flex",
    justifyContent: "space-between",
    font: `0.8em "Roboto Mono"`,
    paddingLeft: 8
  },
  reset: {
    position: "absolute",
    bottom: 8,
    right: 8
  },
  instructions: {
    margin: "8px 0px"
  },
  resultTable: {
    "& td:first-child": {
      textAlign: "end"
    },
    "& td": {
      padding: 0
    },
    "& span": {
      padding: "0px 5px"
    },
    "& td:last-child > span": {
      whiteSpace: "pre"
    },
    borderSpacing: 0,
    paddingLeft: 16
  },
  selectedResult: {
    "& td:first-child > span": {
      borderTopLeftRadius: 10,
      borderBottomLeftRadius: 10
    },
    "& td:last-child > span": {
      borderTopRightRadius: 10,
      borderBottomRightRadius: 10
    },
    "& span": {
      backgroundColor: "#ffab00",
      color: "black"
    }
  },
  progressDiv: {
    width: 136,
    height: 48,
    paddingLeft: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
});

enum EntryStage {
  Hand,
  Dealer,
  RemovedCards,
  Working,
  Done,
  Hit,
  ChooseSplit
}
enum ActionType {
  CardButton,
  Backspace,
  Submit,
  Reset,
  Result
}
interface BaseAction {
  type: ActionType.Backspace | ActionType.Submit | ActionType.Reset;
}

interface CardAction {
  type: ActionType.CardButton;
  payload: Card;
}
interface ResultAction {
  type: ActionType.Result;
  payload: ExpectedValues;
}

type Action = BaseAction | CardAction | ResultAction;

interface State {
  entry_stage: EntryStage;
  hand: Card[];
  dealer: Card[];
  removed_cards: Card[];
  hand_value: HandValue;
  insurance: boolean | null;
  result: ExpectedValues | null;
}

const initialState: State = {
  entry_stage: EntryStage.Hand,
  hand: [],
  dealer: [],
  removed_cards: [],
  hand_value: { soft: false, value: 0 },
  result: null,
  insurance: null
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
          if (card_array !== draft.dealer || card_array.length === 0) {
            card_array.push(action.payload);
          }
        }
        break;
      }
      case ActionType.Backspace: {
        if (card_array) {
          card_array.pop();
        }
        break;
      }
      case ActionType.Submit: {
        switch (draft.entry_stage) {
          case EntryStage.Hand:
            draft.entry_stage = EntryStage.Dealer;
            break;
          case EntryStage.Dealer:
            draft.entry_stage = EntryStage.RemovedCards;
            break;
          case EntryStage.RemovedCards:
            draft.entry_stage = EntryStage.Working;
            break;
        }
        break;
      }
      case ActionType.Reset: {
        return initialState;
      }
      case ActionType.Result: {
        draft.result = action.payload;
        if (draft.result.hit && get_max(draft.result) === draft.result.hit) {
          draft.entry_stage = EntryStage.Hit;
        } else if (draft.result.split !== undefined) {
          draft.entry_stage = EntryStage.ChooseSplit;
        } else {
          draft.entry_stage = EntryStage.Done;
        }
        if (
          draft.dealer[0] === Card.Ace &&
          draft.result.dealer_bj !== undefined
        ) {
          if (draft.result.dealer_bj >= 1 / 3) {
            draft.insurance = true;
          } else {
            draft.insurance = false;
          }
        }
      }
    }

    draft.hand_value = get_hand_value(draft.hand);
  });
}

interface ExpectedValues {
  stand: number;
  hit?: number;
  split?: number;
  double?: number;
  dealer_bj?: number;
}

function get_max(ev: ExpectedValues) {
  return Math.max(...Object.values(ev).filter(n => !isNaN(n)));
}

function ev_to_string(value: number) {
  let num = Number(
    Math.round(((value * 100 + "e2") as unknown) as number) + "e-2"
  );
  const padding = Math.abs(num) < 10 ? "  " : Math.abs(num) < 100 ? " " : "";
  return (padding + (num < 0 ? "" : "+") + num).padEnd(7, "0") + "%";
}

type WorkerReturn = { data: { ev: ExpectedValues } | { progress: number } };

function card_arry_to_string(cards: Card[]) {
  return cards.map(c => (c === 1 ? "A" : c)).join(" ");
}

function App({ classes }: WithStyles<typeof styles>) {
  const worker = useRef<any>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    if (state.entry_stage === EntryStage.Working) {
      if (worker.current) {
        worker.current.terminate();
      }
      worker.current = new Worker();
      worker.current.onmessage = ({ data }: WorkerReturn) =>
        "progress" in data
          ? setProgress(data.progress)
          : (dispatch({ type: ActionType.Result, payload: data.ev }),
            setProgress(null));
      worker.current.postMessage({
        removed_cards: state.removed_cards,
        hand: state.hand,
        dealer_card: state.dealer[0]
      });
    }
  }, [state]);
  const card_array = get_current_card_array(state);
  const submit_disabled =
    state.entry_stage === EntryStage.Hand
      ? state.hand.length < 2
      : state.entry_stage === EntryStage.Dealer
      ? state.dealer.length < 1
      : state.entry_stage === EntryStage.RemovedCards
      ? false
      : true;
  const cards_enabled = merge_valid_maps(
    ...[
      get_valid_cards(state.hand.concat(state.dealer, state.removed_cards)),
      ...(state.entry_stage === EntryStage.Hand && state.hand.length >= 2
        ? [{}]
        : []),
      ...(state.entry_stage === EntryStage.Dealer && state.dealer.length > 0
        ? [{}]
        : [])
    ]
  );
  const instructions =
    state.entry_stage === EntryStage.Hand ? (
      "Enter your initial hand"
    ) : state.entry_stage === EntryStage.Dealer ? (
      "Enter dealer's card"
    ) : state.entry_stage === EntryStage.RemovedCards ? (
      "Enter any other visible cards"
    ) : state.entry_stage === EntryStage.Working ? (
      "Computing..."
    ) : state.entry_stage === EntryStage.Hit ? (
      "Enter hit card"
    ) : (
      <>&nbsp;</>
    );
  const max_result = state.result && get_max(state.result);
  const reset_callback = useCallback(
    () => dispatch({ type: ActionType.Reset }),
    []
  );
  return (
    <div className={classes.root}>
      <div className={classes.display}>
        <Typography
          variant="subtitle2"
          align="center"
          className={classes.instructions}
        >
          {instructions}
        </Typography>
        <div className={classes.displayInner}>
          <table className={classes.entryTable}>
            <tbody>
              <tr>
                <td>Hand</td>
                <td>{card_arry_to_string(state.hand)}</td>
              </tr>
              <tr>
                <td>Dealer</td>
                <td>{card_arry_to_string(state.dealer)}</td>
              </tr>
              <tr>
                <td>Other</td>
                <td>{card_arry_to_string(state.removed_cards)}</td>
              </tr>
            </tbody>
          </table>
          {state.result ? (
            <table className={classes.resultTable}>
              <tbody>
                <tr
                  className={
                    max_result === state.result.stand
                      ? classes.selectedResult
                      : undefined
                  }
                >
                  <td>
                    <span>Stand:</span>
                  </td>
                  <td>
                    <span>{ev_to_string(state.result.stand)}</span>
                  </td>
                </tr>
                {state.result.hit && (
                  <tr
                    className={
                      max_result === state.result.hit
                        ? classes.selectedResult
                        : undefined
                    }
                  >
                    <td>
                      <span>Hit:</span>
                    </td>
                    <td>
                      <span>{ev_to_string(state.result.hit)}</span>
                    </td>
                  </tr>
                )}
                {state.result.double && (
                  <tr
                    className={
                      max_result === state.result.double
                        ? classes.selectedResult
                        : undefined
                    }
                  >
                    <td>
                      <span>Double:</span>
                    </td>
                    <td>
                      <span>{ev_to_string(state.result.double)}</span>
                    </td>
                  </tr>
                )}
                {state.result.split && (
                  <tr
                    className={
                      max_result === state.result.split
                        ? classes.selectedResult
                        : undefined
                    }
                  >
                    <td>
                      <span>Split:</span>
                    </td>
                    <td>
                      <span>{ev_to_string(state.result.split)}</span>
                    </td>
                  </tr>
                )}
                {state.insurance !== null && (
                  <tr>
                    <td colSpan={2} style={{ paddingRight: 5 }}>
                      {`${state.insurance ? "Take" : "Skip"} insurance`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : progress ? (
            <div className={classes.progressDiv}>
              <CircularProgress
                variant="static"
                color="inherit"
                value={Math.round(progress * 100)}
              />
            </div>
          ) : (
            undefined
          )}
        </div>
        {state.entry_stage !== EntryStage.Hand && (
          <Button
            className={classes.reset}
            color="inherit"
            onClick={reset_callback}
          >
            Reset <Replay style={{ paddingLeft: 8 }} />
          </Button>
        )}
      </div>
      <EntryPad
        onCardClick={useCallback(
          card => dispatch({ type: ActionType.CardButton, payload: card }),
          []
        )}
        cardsEnabled={cards_enabled}
        onBackspaceClick={useCallback(
          () => dispatch({ type: ActionType.Backspace }),
          []
        )}
        backspaceEnabled={card_array !== null && card_array.length > 0}
        onSubmitClick={useCallback(
          () => dispatch({ type: ActionType.Submit }),
          []
        )}
        submitEnabled={!submit_disabled}
        classes={{ root: classes.entryPad }}
      />
    </div>
  );
}

export default withStyles(styles)(App);
