import React, {
  useEffect,
  useState,
  useRef,
  useReducer,
  useCallback
} from "react";
import {
  CircularProgress,
  Typography,
  Button,
  makeStyles
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
  get_unbusting_cards,
  take_insurance,
  ExpectedValues,
  get_ev_max
} from "./blackjack_rules";
import EntryPad from "./EntryPad";
import CardEntry from "./CardEntry";
import ResultDisplay from "./ResultDisplay";

const useStyles = makeStyles({
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
  progressDiv: {
    width: 136,
    height: 48,
    paddingLeft: 16,
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  }
});

const fullScreen = (window.navigator as any).standalone as boolean;

enum EntryStage {
  Start,
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
  hit_card: Card[];
}

const initialState: State = {
  entry_stage: EntryStage.Start,
  hand: [],
  dealer: [],
  removed_cards: [],
  hand_value: { soft: false, value: 0 },
  result: null,
  insurance: null,
  hit_card: []
};

function get_current_card_array(state: State) {
  return state.entry_stage === EntryStage.Hand ||
    state.entry_stage === EntryStage.Start
    ? state.hand
    : state.entry_stage === EntryStage.Dealer
    ? state.dealer
    : state.entry_stage === EntryStage.RemovedCards
    ? state.removed_cards
    : state.entry_stage === EntryStage.Hit
    ? state.hit_card
    : null;
}

function reducer(state: State, action: Action) {
  return produce(state, draft => {
    let card_array = get_current_card_array(draft);

    switch (action.type) {
      case ActionType.CardButton: {
        if (card_array) {
          if (
            (card_array !== draft.dealer && card_array !== draft.hit_card) ||
            card_array.length === 0
          ) {
            card_array.push(action.payload);
          }
        }
        if (draft.entry_stage === EntryStage.Start) {
          draft.entry_stage = EntryStage.Hand;
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
          case EntryStage.Hit:
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
        if (draft.result.hit && get_ev_max(draft.result) === draft.result.hit) {
          draft.entry_stage = EntryStage.Hit;
        } else if (draft.result.split !== undefined) {
          draft.entry_stage = EntryStage.ChooseSplit;
        } else {
          draft.entry_stage = EntryStage.Done;
        }
        if (draft.hit_card.length > 0) {
          draft.insurance = null;
          draft.hand.push(draft.hit_card[0]);
          draft.hit_card = [];
        }
      }
    }

    if (
      draft.dealer[0] === Card.Ace &&
      draft.entry_stage === EntryStage.RemovedCards
    ) {
      draft.insurance =
        take_insurance(draft.hand.concat(draft.dealer, draft.removed_cards)) >=
        1 / 3;
    }

    draft.hand_value = get_hand_value(draft.hand);
  });
}

type WorkerReturn = { data: { ev: ExpectedValues } | { progress: number } };

function App() {
  const classes = useStyles();
  const worker = useRef<any>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  useEffect(() => {
    if (state.entry_stage === EntryStage.Start) {
      if (worker.current) {
        worker.current.terminate();
      }
      worker.current = new Worker();
      worker.current.onmessage = ({ data }: WorkerReturn) =>
        "progress" in data
          ? setProgress(data.progress)
          : (dispatch({ type: ActionType.Result, payload: data.ev }),
            setProgress(null));
    } else if (state.entry_stage === EntryStage.Working) {
      if (state.hit_card.length > 0) {
        worker.current.postMessage({
          hit_card: state.hit_card[0]
        });
      } else {
        worker.current.postMessage({
          removed_cards: state.removed_cards,
          hand: state.hand,
          dealer_card: state.dealer[0]
        });
      }
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
      : state.entry_stage === EntryStage.Hit
      ? state.hit_card.length < 1
      : true;
  const cards_enabled = merge_valid_maps(
    ...[
      get_valid_cards(state.hand.concat(state.dealer, state.removed_cards)),
      ...(state.entry_stage === EntryStage.Hand && state.hand.length >= 2
        ? [{}]
        : []),
      ...(state.entry_stage === EntryStage.Dealer && state.dealer.length > 0
        ? [{}]
        : []),
      ...(state.entry_stage === EntryStage.Hit
        ? state.hit_card.length > 0
          ? [{}]
          : [get_unbusting_cards(state.hand_value)]
        : []),
      ...(state.entry_stage === EntryStage.Done ? [{}] : [])
    ]
  );
  const instructions =
    state.entry_stage === EntryStage.Hand ||
    state.entry_stage === EntryStage.Start ? (
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
  const max_result = state.result && get_ev_max(state.result);
  const reset_callback = useCallback(
    () => dispatch({ type: ActionType.Reset }),
    []
  );
  console.log(state.result);
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
          <CardEntry
            hand={state.hand.concat(state.hit_card)}
            dealer={state.dealer}
            other={state.removed_cards}
            active={
              state.entry_stage === EntryStage.Start ||
              state.entry_stage === EntryStage.Hand ||
              state.entry_stage === EntryStage.Hit
                ? "hand"
                : state.entry_stage === EntryStage.Dealer
                ? "dealer"
                : state.entry_stage === EntryStage.RemovedCards
                ? "other"
                : undefined
            }
          />
          {progress ? (
            <div className={classes.progressDiv}>
              <CircularProgress
                variant="static"
                color="inherit"
                value={Math.round(progress * 100)}
              />
            </div>
          ) : (
            <ResultDisplay result={state.result} insurance={state.insurance} />
          )}
        </div>
        {state.entry_stage !== EntryStage.Hand &&
          state.entry_stage !== EntryStage.Start && (
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
      {fullScreen && <div style={{ height: 32 }} />}
    </div>
  );
}

export default App;
