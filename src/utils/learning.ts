// Pure flashcard (cram) and Listen & Learn logic.
// Ported from the Obsidian plugin with the SRS scheduling removed.

export interface CramCard {
  number: number;
}

export interface CramSessionState {
  allNumbers: number[];
  unknownCards: CramCard[];
  totalCards: number;
  knownCount: number;
  sessionCorrect: number;
  sessionReviewed: number;
  isShuffled: boolean;
}

export interface ListenLearnDisplayState {
  answerVisible: boolean;
  answerMarkup: string;
}

type ShuffleFn = <T>(items: T[]) => T[];

export function buildCramSession(
  allNumbers: number[],
  isShuffled: boolean,
  shuffleArray: ShuffleFn
): CramSessionState {
  let unknownCards = allNumbers.map(number => ({ number }));

  if (isShuffled) {
    unknownCards = shuffleArray(unknownCards);
  }

  return {
    allNumbers,
    unknownCards,
    totalCards: unknownCards.length,
    knownCount: 0,
    sessionCorrect: 0,
    sessionReviewed: 0,
    isShuffled
  };
}

export function applyCramAgain(state: CramSessionState): CramSessionState {
  if (state.unknownCards.length === 0) return state;

  const [current, ...rest] = state.unknownCards;
  return {
    ...state,
    unknownCards: [...rest, { number: current.number }],
    sessionReviewed: state.sessionReviewed + 1
  };
}

export function applyCramGood(state: CramSessionState): CramSessionState {
  if (state.unknownCards.length === 0) return state;

  return {
    ...state,
    unknownCards: state.unknownCards.slice(1),
    knownCount: state.knownCount + 1,
    sessionCorrect: state.sessionCorrect + 1,
    sessionReviewed: state.sessionReviewed + 1
  };
}

export function restartCramSession(
  state: CramSessionState,
  shuffleArray: ShuffleFn
): CramSessionState {
  return buildCramSession(state.allNumbers, state.isShuffled, shuffleArray);
}

export function getListenLearnDisplayState(
  isEsOnly: boolean,
  showAnswer: boolean,
  secondText: string
): ListenLearnDisplayState {
  if (isEsOnly) {
    return {
      answerVisible: false,
      answerMarkup: ''
    };
  }

  return {
    answerVisible: true,
    answerMarkup: showAnswer
      ? `<div class="lsn-slideshow-second">${secondText}</div>`
      : `<div class="lsn-slideshow-waiting">...</div>`
  };
}
