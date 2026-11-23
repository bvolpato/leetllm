import { rawKVBytes } from '../arithmetic.mjs';
import { text } from '../defaults.mjs';
import { finalRequest } from '../fixtures.mjs';
import { retainedBranchLedger } from '../model.mjs';
import { sceneClock } from '../scene-clock.mjs';

const { prompt, continuation, geometry, answers, scores, poolBytes } = finalRequest;
const initial = retainedBranchLedger(answers.length);
const bytesPerPosition = rawKVBytes({ ...geometry, positions: 1 });
const mebi = 2 ** 20;
const nice = (n) => n.toLocaleString('en-US');

export function drawFreshBranchRepair(ctx, scene, state, api) {
  const { C } = api,
    cue = sceneClock(scene, state);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    text(ctx, api, s, x, y, size, color, align);
  const first = cue('tt-fresh-release-one'),
    second = cue('tt-fresh-release');
  const kept = retainedBranchLedger(second.done ? 4 : first.done ? 5 : 6);
  const chosen = cue('tt-fresh-candidate').done;
  const geometryKnown = cue('tt-fresh-geometry').done;
  const usageKnown = cue('tt-fresh-overflow').done;
  const fitsKnown = cue('tt-fresh-fits').done;
  const x = 145,
    edge = 1780,
    unit = (edge - x) / (prompt / continuation + answers.length);
  const tailStart = x + (prompt / continuation) * unit;
  const peakScore = Math.max(...scores);

  const closing = state.beat === 4;
  if (!closing && cue('fresh-answers').started) {
    api.focus.target('answers', () => {
      label('Draft estimate for the original six branches · cached positions', x, 239, 33, C.muted);
      answers.forEach((value, i) => {
        const left = x + i * 275;
        const passed = chosen && value === initial.verifiedAnswer;
        const draw = () => {
          api.rect(ctx, left, 264, 246, 120, C.panel, passed ? C.green : C.muted, 8);
          label(`C${i + 1}`, left + 18, 306, 31, passed ? C.green : C.muted);
          label(nice(value), left + 125, 355, 51, passed ? C.green : C.ink, 'center');
          if (cue('fresh-high-score').started) {
            const high = scores[i] === peakScore;
            label(
              `score ${scores[i].toFixed(2)}`,
              left + 124,
              431,
              31,
              high ? C.yellow : C.muted,
              'center',
            );
          }
        };
        if (i === 0) api.focus.target('first-answer', draw);
        else draw();
      });
    });
  } else if (!closing) {
    label('How much cache can this request keep?', x, 325, 63);
  }

  api.focus.target('choice', () => {
    if (closing) {
      label('How many positions did all six branches need?', x, 269, 42, C.muted);
      label(
        `${initial.selected} = ${initial.verifiedAnswer} originally    ·    ${kept.positions} positions live`,
        x,
        383,
        65,
        C.green,
      );
    } else if (chosen)
      label(
        `Original worksheet   ${initial.verifiedAnswer} → accept ${initial.selected}`,
        x,
        508,
        43,
        C.green,
      );
    else if (state.beat >= 1)
      label('Which draft counts the shared prompt and all six tails?', x, 507, 40, C.yellow);
  });

  // Each private tile occupies exactly one sixth of the shared prompt's width.
  api.focus.target('prefix', () => {
    api.rect(ctx, x, 556, tailStart - x - 5, 78, C.panel, C.blue, 6);
    label(`Shared prompt   ${nice(prompt)}`, (x + tailStart) / 2, 608, 42, C.blue, 'center');
  });
  api.focus.target('tails', () => {
    const visible =
      state.beat > 0 ? answers.length : Math.round(answers.length * cue('fresh-tails').p);
    for (let i = 0; i < visible; i++) {
      const left = tailStart + i * unit;
      const live = i < kept.retained;
      const release = i === 5 ? first : i === 4 ? second : null;
      const tail = () => {
        api.rect(ctx, left, 556, unit - 6, 78, C.bg, C.muted, 5);
        if (live)
          api.components.fade(1 - (release?.p ?? 0), () => {
            const color = chosen && initial.selected === `C${i + 1}` ? C.green : C.cyan;
            api.rect(ctx, left, 556, unit - 6, 78, C.panel, color, 5);
            label(`C${i + 1} · ${continuation}`, left + (unit - 6) / 2, 604, 26, color, 'center');
          });
      };
      if (i === 5) api.focus.target('last-tail', tail);
      else tail();
    }
  });
  api.focus.target('geometry', () => {
    if (closing) {
      label('Shared prompt and four retained tails', x, 705, 36, C.muted);
    } else if (cue('fresh-factors').started || geometryKnown) {
      const factors = `2 × ${geometry.layers} layers × ${geometry.kvHeads} KV heads × ${geometry.width} × ${geometry.scalarBytes} B`;
      const unitSize = geometryKnown
        ? `  =  ${nice(bytesPerPosition)} B  =  ${bytesPerPosition / 1024} KiB per position`
        : '  =  ?';
      label(factors + unitSize, x, 706, 35, C.ink);
    } else label('Each private cache holds 500 positions.', x, 705, 33, C.muted);
  });

  // The scale keeps the limit fixed, including while a cache is being released.
  const scale = (edge - x) / 300;
  const limitX = x + (poolBytes / mebi) * scale;
  const y = 805;
  api.line(ctx, x, y, edge, y, C.muted, 3);
  api.focus.target('pool-limit', () => {
    api.line(ctx, limitX, y - 26, limitX, y + 27, C.yellow, 4);
    label('256 MiB limit', limitX, y - 41, 34, C.yellow, 'center');
  });
  label('0', x, y + 45, 25, C.muted);
  label('300 MiB', edge, y + 45, 25, C.muted, 'right');
  api.focus.target('usage', () => {
    if (!usageKnown) {
      label('Raw KV in use   ?', x, 948, 44, C.muted);
      return;
    }
    const at = x + (kept.bytes / mebi) * scale;
    const settledColor = kept.fits && fitsKnown ? C.green : kept.fits ? C.cyan : C.pink;
    api.rect(ctx, x, y - 11, at - x, 22, settledColor, undefined, 2);
    api.line(ctx, limitX, y - 23, limitX, y + 24, C.yellow, 4);
    api.circle(ctx, at, y, 12, settledColor);
    const finalRead = kept.retained === 6 || (kept.retained === 4 && fitsKnown);
    const capReadout = `${nice(kept.bytes / mebi)} MiB`;
    if (finalRead && !closing) {
      api.rect(ctx, x, 880, 761, 81, C.panel, settledColor, 8);
      label(
        `${kept.positions} positions → ${kept.gib.toFixed(6)} GiB`,
        x + 27,
        935,
        38,
        settledColor,
      );
    }
    if (kept.retained === 5)
      label(
        `${nice(kept.positions)} positions   ·   ${(kept.bytes / mebi).toFixed(4)} MiB`,
        x,
        938,
        42,
      );
    const over = (kept.bytes - poolBytes) / mebi;
    const detail =
      kept.retained === 5 && cue('first-over').started
        ? `${over.toFixed(4)} MiB over the limit`
        : `${capReadout} / 256 MiB${fitsKnown ? '    Fits' : ''}`;
    label(detail, closing ? x : 1000, 938, 43, settledColor);
  });
  api.focus.target('spent', () => {
    if (cue('tt-fresh-spent').done) {
      label(
        `Spent: ${initial.spentTokens} tokens · ${initial.spentScoreCalls} scorer calls`,
        x,
        488,
        46,
        C.yellow,
      );
    } else if (closing && cue('tt-fresh-spent').started) {
      label('Work spent on all six drafts', x, 488, 46, C.yellow);
    } else if (state.beat === 2 && cue('one-enough').started) {
      label('Would releasing C6 alone fit?', x, 1035, 40, C.yellow);
    } else if (state.beat === 3) {
      label('Six finished generations and six scores on record', x, 1035, 33, C.muted);
    }
  });
}

export default { id: 'fresh-branch-repair', draw: drawFreshBranchRepair };
