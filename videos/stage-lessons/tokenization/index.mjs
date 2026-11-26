// Full-bleed dark-cinema 22-scene Tokenization (BPE, WordPiece, SentencePiece & Unigram) film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyTokenizationInvariants } from './parts.mjs';
import boundaries from './scenes/boundaries.mjs';
import bytes from './scenes/bytes.mjs';
import close from './scenes/close.mjs';
import codeWhitespace from './scenes/code-whitespace.mjs';
import cut from './scenes/cut.mjs';
import economics from './scenes/economics.mjs';
import glitch from './scenes/glitch.mjs';
import hook from './scenes/hook.mjs';
import inflation from './scenes/inflation.mjs';
import lookup from './scenes/lookup.mjs';
import merges from './scenes/merges.mjs';
import normalization from './scenes/normalization.mjs';
import numbers from './scenes/numbers.mjs';
import regularization from './scenes/regularization.mjs';
import request from './scenes/request.mjs';
import sentencepiece from './scenes/sentencepiece.mjs';
import unigramPath from './scenes/unigram-path.mjs';
import unigramPrune from './scenes/unigram-prune.mjs';
import unseen from './scenes/unseen.mjs';
import wordpieceMatch from './scenes/wordpiece-match.mjs';
import wordpieceScore from './scenes/wordpiece-score.mjs';
import yourTurn from './scenes/your-turn.mjs';

export default cinematicLesson({
  id: 'tokenization',
  accent: COSMOS.cyan,
  invariants: verifyTokenizationInvariants,
  scenes: {
    hook,
    cut,
    merges,
    unseen,
    boundaries,
    bytes,
    'wordpiece-score': wordpieceScore,
    'wordpiece-match': wordpieceMatch,
    sentencepiece,
    'unigram-path': unigramPath,
    'unigram-prune': unigramPrune,
    regularization,
    normalization,
    lookup,
    economics,
    inflation,
    numbers,
    'code-whitespace': codeWhitespace,
    glitch,
    request,
    'your-turn': yourTurn,
    close,
  },
});
