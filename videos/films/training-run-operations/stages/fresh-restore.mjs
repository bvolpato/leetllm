import { boundary, drillRun, nextDrillGroup } from '../boundaries.mjs';
import { trainingCue, trainingFreshState, trainingStarted } from '../construction.mjs';
import { drawBox, drawCell, drawLine, drawText } from '../defaults.mjs';

const numbers = (n) => n.toLocaleString('en-US');

function drawWarning(ctx, state, api) {
  const { C } = api;
  const f = trainingFreshState(state);
  const { perUpdate, perRound, pending } = boundary(drillRun);
  const { beat, beatP } = state;
  const half = beat || trainingStarted(state, 'fresh-half', beatP > 0.22);
  const x = 220,
    pitch = 195;
  api.focus.target('drill-window', () => {
    drawText(ctx, api, 'Published update ' + f.checkpoint, x, 263, 45, C.cyan);
    drawText(ctx, api, '2 replicas × 3 sequences each per round', x, 335, 31, C.muted);
    for (let i = 0; i < drillRun.rounds; i++) {
      const color = half && i < drillRun.finished ? C.yellow : C.muted;
      drawCell(ctx, api, String.fromCharCode(65 + i), x + i * pitch, 397, 158, 101, color, 46);
    }
    drawText(
      ctx,
      api,
      half ? pending + ' examples in unfinished work' : perRound + ' examples per round',
      x,
      568,
      33,
      half ? C.yellow : C.muted,
    );
  });
  api.focus.target('drill-clock', () => {
    const left = 1140,
      barY = 403,
      px = 9;
    drawText(ctx, api, 'Warning ends at ' + f.warning + ' s', left, 263, 42, C.pink);
    const parts = [
      [12, 'Finish', C.blue],
      [40, 'Save', C.cyan],
      [8, 'Margin', C.yellow],
    ];
    let t = 0;
    for (const [s, name, color] of parts) {
      drawText(ctx, api, name, left + (t + s / 2) * px, 368, 27, color, 'center');
      drawBox(ctx, api, left + t * px, barY, s * px, 83, color);
      drawText(ctx, api, String(s), left + (t + s / 2) * px, barY + 55, 34, color, 'center');
      t += s;
    }
    const mark = left + f.warning * px;
    drawLine(ctx, api, mark, 495, mark, 541, C.pink, 4);
    drawText(
      ctx,
      api,
      f.cost ? '12 + 40 + 8 = ' + f.neededSeconds + ' s' : '12 + 40 + 8 = ? s',
      left,
      633,
      41,
      C.ink,
    );
  });
  api.focus.target('drill-decision', () => {
    drawLine(ctx, api, x, 691, 1708, 691, C.muted, 2);
    if (!f.retained)
      drawText(
        ctx,
        api,
        f.failed
          ? 'Only 7 of the required 8 seconds of margin remain.'
          : 'Which checkpoint and consumed count would you load?',
        960,
        823,
        45,
        C.ink,
        'center',
      );
    else {
      drawText(ctx, api, 'Load update ' + f.checkpoint, x, 811, 45, C.green);
      drawText(
        ctx,
        api,
        f.checkpoint +
          ' × ' +
          perUpdate +
          ' = ' +
          (f.count ? numbers(f.consumed) : '?') +
          ' examples',
        x,
        909,
        43,
        C.cyan,
      );
    }
  });
}

function drawRange(ctx, state, api) {
  const { C } = api;
  const { beat, beatP } = state;
  const size = 24,
    sources = 3,
    destinations = 6,
    probe = 19;
  const width = size / destinations;
  const rank = Math.floor(probe / width);
  const f = trainingFreshState(state);
  const x = 150,
    unit = 67.5;
  api.focus.target('drill-coordinate', () => {
    drawText(ctx, api, 'Same tensor  ·  24 coordinates', x, 260, 41, C.ink);
    for (let i = 0; i < sources; i++) {
      const start = (i * size) / sources;
      drawText(
        ctx,
        api,
        'Saved rank ' + i,
        x + (start + size / (2 * sources)) * unit,
        368,
        33,
        C.blue,
        'center',
      );
      drawBox(ctx, api, x + start * unit, 400, (size / sources) * unit - 4, 113, C.blue);
    }
    for (let i = 0; i < size; i++) {
      const cx = x + (i + 0.5) * unit;
      if (i === probe) drawBox(ctx, api, cx - 27, 417, 54, 73, C.yellow);
      drawText(ctx, api, String(i), cx, 474, 31, i === probe ? C.yellow : C.ink, 'center', 'mono');
    }
    drawText(ctx, api, '6 equal destination shards  ·  ranks start at 0', x, 626, 35, C.muted);
    const move = beat >= 3 ? trainingCue(state, 'fresh-range', beatP > 0.25 ? 1 : 0) : 0;
    drawLine(ctx, api, x, 772, x + size * unit, 772, C.muted, 3);
    for (let d = 0; d < destinations; d++) {
      const start = x + d * width * unit,
        color = f.owner && d === rank ? C.yellow : C.cyan;
      if (move > 0) {
        drawLine(ctx, api, start, 772 - 52 * move, start, 772, color, 5);
        if (d === destinations - 1)
          drawLine(
            ctx,
            api,
            start + width * unit,
            772 - 52 * move,
            start + width * unit,
            772,
            color,
            5,
          );
      }
      if (f.range)
        drawText(ctx, api, 'Rank ' + d, start + (width * unit) / 2, 832, 32, color, 'center');
    }
    if (f.owner) {
      const cx = x + (probe + 0.5) * unit;
      drawLine(ctx, api, cx, 532, cx, 590, C.yellow, 4);
      drawLine(ctx, api, cx, 664, cx, 751, C.yellow, 4);
    }
    drawText(
      ctx,
      api,
      f.owner
        ? 'Rank ' + rank + ' owns [' + rank * width + ', ' + (rank + 1) * width + ').'
        : 'Which destination owns coordinate 19?',
      960,
      971,
      46,
      f.owner ? C.yellow : C.ink,
      'center',
    );
  });
}

function drawReplay(ctx, state, api) {
  const { C } = api;
  const b = boundary(drillRun);
  const rewind =
    state.beat >= 5 ? trainingCue(state, 'fresh-rewind', Math.min(1, state.beatP * 5)) : 0;
  const replayedRounds = Math.floor(rewind * drillRun.finished);
  const cursor = b.live - replayedRounds * b.perRound;
  const repaired = cursor === b.saved;
  const reference = nextDrillGroup(b.saved);
  const actual = nextDrillGroup(cursor);
  api.focus.target('drill-ids', () => {
    drawText(ctx, api, 'First input after update 73', 155, 265, 44, C.ink);
    for (let r = 0; r < drillRun.replicas; r++)
      drawText(ctx, api, 'Replica ' + r, 830 + r * 555, 389, 34, C.blue, 'center');
    const rows = [
      ['Uninterrupted', b.saved, reference, C.cyan],
      ['Restored', cursor, actual, repaired ? C.cyan : C.yellow],
    ];
    rows.forEach(([name, offset, ids, color], i) => {
      const y = 448 + i * 192;
      drawText(ctx, api, name, 155, y + 43, 40, color);
      drawText(ctx, api, numbers(offset) + ' consumed', 155, y + 102, 30, C.muted);
      ids.forEach((id, j) => {
        const x = 600 + 150 * j + 105 * Math.floor(j / drillRun.sequences);
        drawCell(ctx, api, id, x, y, 137, 109, color, 44);
      });
    });
    const matched = actual.filter((v, j) => v === reference[j]).length;
    drawText(
      ctx,
      api,
      matched + ' of ' + reference.length + ' sample IDs match',
      960,
      881,
      46,
      repaired ? C.green : C.yellow,
      'center',
    );
    if (!repaired)
      drawText(
        ctx,
        api,
        'Same weights at update 73. Which cursor moves, and by how much?',
        960,
        982,
        34,
        C.ink,
        'center',
      );
  });
  if (repaired && trainingStarted(state, 'fresh-next-step', state.beatP > 0.4))
    api.focus.target('next-check', () =>
      drawText(
        ctx,
        api,
        'Compare one optimizer step: learning rate, Adam moments, updated weights',
        960,
        982,
        36,
        C.ink,
        'center',
      ),
    );
}

export function drawFreshRestore(ctx, scene, state, api) {
  if (state.beat < 2) drawWarning(ctx, state, api);
  else if (state.beat < 4) drawRange(ctx, state, api);
  else drawReplay(ctx, state, api);
}
export default {
  id: 'fresh-restore',
  draw: drawFreshRestore,
  cues: [
    'fresh-half',
    'fresh-restore-step-1',
    'fresh-cost',
    'fresh-fails',
    'fresh-retain',
    'fresh-restore-step-2',
    'fresh-probe',
    'fresh-range',
    'fresh-restore-step-3',
    'fresh-compare',
    'fresh-rewind',
    'fresh-next-step',
  ],
};
