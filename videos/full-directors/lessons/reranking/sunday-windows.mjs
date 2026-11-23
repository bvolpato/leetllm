import assert from 'node:assert/strict';
import { arcSwap, smoothstep } from 'vizmatic';
import { passageIds, scores } from '../../../films/reranking/fixtures.mjs';
import { libraryText, sundayQuestion } from '../../../films/reranking/library-shelf.mjs';
import { rerank } from '../../../films/reranking/model.mjs';
import { mounts, paintWindows } from './notice-case.mjs';

const search = passageIds.map((_, index) => index);
const promptSize = 2;
function scoreFirst(depth) {
  const candidates = search.slice(0, depth);
  const ranked = rerank(candidates);
  return {
    candidates,
    displayed: [...ranked, ...search.slice(depth)],
    packed: ranked.slice(0, promptSize),
  };
}
const two = scoreFirst(2);
const three = scoreFirst(3);
const hours = passageIds.indexOf('hours-v7');
const lineBreaks = [3, 2, 1];
const stock = search.map((index) => {
  const words = libraryText[index].split(' ');
  const split = lineBreaks[index];
  return {
    id: passageIds[index],
    plate: index,
    lines: [words.slice(0, split).join(' '), words.slice(split).join(' ')],
    scoreText: scores[index].toFixed(2),
  };
});

function position(index, before, after, progress) {
  const from = before.indexOf(index),
    to = after.indexOf(index);
  if (from === to) return mounts[from];
  // The returning sheet takes the lower arc. The promoted sheet passes in front.
  const left = Math.min(from, to),
    right = Math.max(from, to);
  // Vacate the old window first so the three sheets never stack at the center.
  const outgoingFirst = from === left;
  const travel = outgoingFirst ? progress / 0.68 : (progress - 0.12) / 0.88;
  const [outgoing, incoming] = arcSwap(mounts[left], mounts[right], travel, { lift: 113 });
  return outgoingFirst ? outgoing : incoming;
}

export function windowState(clock) {
  let before = search,
    after = search,
    progress = 0,
    raised = 0,
    pocketMove;
  let scored = [],
    scoreAlpha = 1,
    hoursScoreAlpha = 1,
    checked = false;
  let hoursUnderline = 0;
  let legend = 'Retrieval order';
  const cue = (phrase, seconds) => clock.reveal(phrase, seconds);
  switch (clock.beat.id) {
    case 'c01-b01':
      break;
    case 'c01-b02':
      after = three.displayed;
      pocketMove = cue('Bring that notice', 2.4);
      scored = three.candidates;
      hoursUnderline = pocketMove === 1
        ? clock.reveal('the library is closed', 0.55, { captionStart: false })
        : 0;
      scoreAlpha = cue('Bring that notice', 0.55);
      legend =
        pocketMove === 1
          ? 'Ranked by score'
          : pocketMove > 0
            ? 'Sorting by score'
            : 'Retrieval order';
      break;
    case 'c01-b03':
      before = after = three.displayed;
      hoursUnderline = 1;
      scored = three.candidates;
      legend = 'Ranked by score';
      break;
    case 'c02-b01': {
      // Start on the previous chapter's last arrangement. Rewind it before narrowing the scorer.
      const reset = cue('How many notices', 1.8);
      const limited = cue('Stop after two notices', 0.55);
      if (reset < 1) {
        after = three.displayed;
        pocketMove = 1 - reset;
        legend = reset === 0 ? 'Ranked by score' : 'Restoring retrieval order';
        scored = three.candidates;
        scoreAlpha = 1 - smoothstep(reset);
      } else {
        after = two.displayed;
        progress = cue('Trade their places', 2.0);
        scored = two.candidates;
        scoreAlpha = limited;
      }
      if (limited > 0) legend = 'Scorer reads 2 notices';
      break;
    }
    case 'c02-b02': {
      before = two.displayed;
      after = three.displayed;
      const admit = cue('one more passage', 1.1);
      hoursScoreAlpha = cue('compared with the question', 0.45);
      progress = cue('The assistant still has room for two', 2.4);
      scored = admit > 0 ? three.candidates : two.candidates;
      raised = admit;
      legend = admit > 0 ? 'Scorer reads 3 notices' : 'Scorer reads 2 notices';
      break;
    }
    case 'c02-b03':
      before = after = three.displayed;
      scored = three.candidates;
      checked = cue('same permitted search result', 0) === 1;
      legend = checked ? 'Application verified access' : 'Scorer reads 3 notices';
      if (cue('a fresh check', 0))
        legend = 'If access or revision changes,\ncheck again before use.';
      break;
    default:
      throw new RangeError('Unknown Sunday window beat ' + clock.beat.id);
  }
  // Pull the sheet above the lip before carrying it across the other two.
  // The rewind follows these same positions in reverse.
  if (pocketMove !== undefined) {
    raised = Math.min(1, pocketMove / 0.24);
    progress = Math.max(0, (pocketMove - 0.24) / 0.76);
  }
  const lift = 187 * smoothstep(raised) * (1 - smoothstep(progress)) ** 2;
  const notices = stock
    .map((notice, index) => {
      const point = position(index, before, after, progress);
      return {
        ...notice,
        x: point.x,
        y: point.y - (index === hours ? lift : 0),
        checked,
        inHand: index === hours && raised === 1 && progress < 1,
        underline:
          clock.beat.id === 'c01-b01' && index < 2
            ? cue(index === 0 ? 'Saturday story time' : 'Holiday hours vary', 1.0)
            : index === hours ? hoursUnderline : 0,
        scoreAlpha: scored.includes(index)
          ? scoreAlpha * (index === hours ? hoursScoreAlpha : 1)
          : 0,
      };
    })
    .sort((a, b) => b.y - a.y);
  return { question: sundayQuestion, notices, legend };
}

export function drawSundayWindows(ctx, clock) {
  paintWindows(ctx, windowState(clock));
}

export function checkSundayWindows() {
  assert.deepEqual(
    stock.map((notice) => notice.lines.join(' ')),
    libraryText,
  );
  assert.deepEqual(
    stock.map((notice) => notice.scoreText),
    ['0.05', '0.40', '2.30'],
  );
  assert.deepEqual(
    two.packed.map((i) => passageIds[i]),
    ['holiday-v3', 'events-v2'],
  );
  assert.deepEqual(
    three.packed.map((i) => passageIds[i]),
    ['hours-v7', 'holiday-v3'],
  );
  for (const [start, end] of [
    [search, three.displayed],
    [three.displayed, search],
    [search, two.displayed],
    [two.displayed, three.displayed],
  ]) {
    for (const index of search) {
      assert.deepEqual(position(index, start, end, 0), mounts[start.indexOf(index)]);
      assert.deepEqual(position(index, start, end, 1), mounts[end.indexOf(index)]);
    }
  }
}
