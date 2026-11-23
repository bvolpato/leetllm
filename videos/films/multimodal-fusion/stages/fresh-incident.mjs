import { cue } from '../arithmetic.mjs';
import { freshIncidentState } from '../construction.mjs';
import { FRESH_CLOCK } from '../fixtures.mjs';

const { deploy, firstRise, revisedRise } = FRESH_CLOCK;
const fmt = (n) => n.toLocaleString('en-US');

function chartExcerpt(ctx, api, identified) {
  const { C } = api;
  api.text(ctx, 'C28   /   chart excerpt', 135, 286, 34, C.ink);
  api.text(ctx, 'Latency (ms)', 136, 386, 28, C.muted);
  api.line(ctx, 165, 436, 165, 675, C.muted, 2);
  api.line(ctx, 165, 675, 755, 675, C.muted, 2);
  const line = (heights, color) =>
    api.path(
      ctx,
      heights.map((fraction, i) => ({ x: 165 + i * 118, y: 648 - fraction * 208 })),
      { color, width: 7 },
    );
  line([0.17, 0.17, 0.17, 0.45, 0.73, 0.95], C.green);
  line([0.39, 0.38, 0.39, 0.38, 0.39, 0.38], C.blue);
  api.text(ctx, 'Time →', 745, 725, 27, C.muted, 'right');
  api.line(ctx, 165, 800, 255, 800, C.green, 8);
  api.text(
    ctx,
    identified ? 'API p95' : 'Series name missing',
    288,
    815,
    39,
    identified ? C.green : C.yellow,
  );
  if (identified) {
    api.line(ctx, 165, 869, 255, 869, C.blue, 8);
    api.text(ctx, 'Worker p95', 288, 884, 35, C.blue);
  }
}

function magnifiedClock(ctx, api, rise, { identified, verdict, correction }) {
  const { C } = api;
  const x = (s) => 1000 + (s - 217) * 110;
  api.text(ctx, 'Detail at the event boundaries', 967, 286, 37, C.ink);
  api.text(ctx, 'Seconds after 14:00 UTC on the same date', 967, 351, 28, C.muted);
  const band = (start, end, marked, y, color) => {
    api.line(ctx, x(start), y, x(end), y, color, 11);
    api.circle(ctx, x(marked), y, 11, color, C.panel, 2);
  };
  api.text(ctx, `Deploy   [${deploy.join(', ')}]`, 968, 465, 36, C.yellow);
  band(217, deploy[1], deploy[1], 520, C.yellow);
  const label = identified ? 'API p95 rise' : 'Rising trace';
  const moving = correction > 0 && correction < 1;
  const riseStart = firstRise[0] + (revisedRise[0] - firstRise[0]) * correction;
  api.text(
    ctx,
    moving ? `${label}   ·   clock correction` : `${label}   [${rise.join(', ')}]`,
    968,
    659,
    36,
    C.green,
  );
  band(riseStart, 224, riseStart, 715, C.green);
  api.line(ctx, x(217), 790, x(224), 790, C.muted, 2);
  for (let s = 217; s <= 224; s++) {
    api.line(ctx, x(s), 790, x(s), 803, C.muted, 2);
    api.text(ctx, String(s), x(s), 848, 27, C.ink, 'center');
  }
  // These guides mark inclusive endpoints on two different event rows.
  api.line(ctx, x(deploy[1]), 532, x(deploy[1]), 580, C.yellow, 3);
  api.line(ctx, x(riseStart), 680, x(riseStart), 703, C.green, 3);
  if (verdict === 'unresolved') {
    api.text(ctx, 'Both events can occur at 220', 968, 923, 36, C.pink);
  } else if (correction > 0) {
    api.text(ctx, 'Earliest rise    221 → 220 s', 968, 923, 36, C.green);
  }
}

export function drawFreshIncident(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const at = (id, index, from, to) => cue(state, id, index, from, to);
  const direct = at('mm-fresh-direct', 1, 0.03, 0.4);
  const reduced = at('mm-fresh-reduced', 1, 0.42, 0.7);
  const cache = at('mm-fresh-cache', 1, 0.74, 0.94);
  const firstOrder = at('mm-fresh-order', 2, 0.76, 0.94);
  const correction = at('mm-fresh-correct-clock', 3, 0.15, 0.62);
  const f = freshIncidentState(beat, {
    direct: direct === 1,
    reduced: reduced === 1,
    cache: cache === 1,
    order: firstOrder === 1,
    correction: correction === 1,
  });
  api.focus.target('mm-fresh-incident-construction', () => {
    if (beat === 0) {
      const left = 240,
        top = 380,
        side = 420;
      for (let i = 3; i >= 0; i--) {
        api.rect(ctx, left + 35 * i, top - 35 * i, side, side, C.panel, C.blue, 6);
      }
      api.text(ctx, '448 × 448 px per view', 500, top - 145, 32, C.blue, 'center');
      // The highlighted square uses the same scale as the admitted view.
      const pitch = ((side - 24) * 14) / 448;
      for (let i = 0; i <= 32; i++) {
        const p = 12 + i * pitch;
        api.line(ctx, left + p, top + 12, left + p, top + side - 12, '#34465a', 1);
        api.line(ctx, left + 12, top + p, left + side - 12, top + p, '#34465a', 1);
      }
      api.rect(
        ctx,
        left + 12 + 31 * pitch,
        top + 12 + 16 * pitch,
        pitch,
        pitch,
        C.yellow,
        undefined,
        0,
      );
      api.text(ctx, '4 square views  ·  14 px patches', 500, 864, 34, C.blue, 'center');
      api.text(ctx, 'Text and template', 1000, 362, 34, C.muted);
      api.text(ctx, '1,800 tokens', 1740, 362, 39, C.ink, 'right');
      api.text(ctx, 'Answer reserve', 1000, 459, 34, C.muted);
      api.text(ctx, '256 tokens', 1740, 459, 39, C.ink, 'right');
      api.text(ctx, 'Context limit', 1000, 556, 34, C.muted);
      api.text(ctx, '4,096 tokens', 1740, 556, 39, C.ink, 'right');
      api.text(ctx, 'Direct: one state per patch', 1000, 690, 36, C.blue);
      api.text(ctx, 'Reducer: 32 states per view', 1000, 765, 36, C.cyan);
      api.text(ctx, 'Which route fits the whole request?', 960, 987, 49, C.yellow, 'center');
      return;
    }
    if (beat === 1) {
      const x = (n) => 190 + n * 0.24;
      api.text(
        ctx,
        '4 views   ·   1,800 text and template   ·   256 reserved for output',
        190,
        285,
        34,
        C.ink,
      );
      api.text(ctx, '4,096 limit', x(4096), 359, 31, C.yellow, 'center');
      for (const [name, z, p, done, col, y] of [
        ['Direct', f.direct, direct, f.revealDirect, C.blue, 456],
        ['32 queries per view', f.reduced, reduced, f.revealReduced, C.cyan, 687],
      ]) {
        api.text(ctx, name, x(0), y - 38, 39, col);
        api.line(ctx, x(0), y + 65, x(6400), y + 65, C.muted, 2);
        api.rect(ctx, x(0), y, 1800 * 0.24, 59, C.green, C.panel, 0);
        api.rect(ctx, x(1800), y, 256 * 0.24, 59, C.yellow, C.panel, 0);
        for (let i = 0; i < 4; i++) {
          const w = z.visual / 4;
          const amount = api.clamp(4 * p - i);
          if (amount > 0) api.rect(ctx, x(2056 + i * w), y, amount * w * 0.24, 59, col, C.panel, 0);
        }
        api.line(ctx, x(4096), y - 20, x(4096), y + 80, C.ink, 4);
        if (done) {
          api.text(
            ctx,
            `${fmt(z.total)} · ${z.fits ? 'FIT' : 'REJECT'}`,
            x(6400),
            y - 35,
            38,
            z.fits ? C.green : C.pink,
            'right',
          );
          api.text(
            ctx,
            `4 × ${fmt(z.visual / 4)} = ${fmt(z.visual)} visual states`,
            x(0),
            y + 126,
            32,
            col,
          );
        }
      }
      if (f.revealCache)
        api.text(
          ctx,
          `Full reduced logical KV: ${f.reduced.kvMiB} MiB`,
          960,
          937,
          44,
          C.ink,
          'center',
        );
      return;
    }
    const identified = beat > 2 || firstOrder === 1 || at('mm-fresh-key', 2, 0.29, 0.59) === 1;
    const rise = correction === 1 ? revisedRise : firstRise;
    const final = at('mm-fresh-touch', 4, 0.16, 0.43) === 1;
    chartExcerpt(ctx, api, identified);
    magnifiedClock(ctx, api, rise, { identified, verdict: final ? f.order : null, correction });
    if (beat === 2) {
      api.text(
        ctx,
        identified ? 'Legend restored by verified extraction' : 'Required legend absent',
        135,
        947,
        30,
        identified ? C.green : C.pink,
      );
      const message =
        f.evidenceReady && f.order === 'after'
          ? '220 < 221 → chart rise follows deploy'
          : identified
            ? 'Compare the two inside endpoints.'
            : 'Budget success still leaves the answer unsupported';
      api.text(ctx, message, 960, 1018, 38, f.evidenceReady ? C.green : C.yellow, 'center');
    } else {
      api.text(
        ctx,
        final
          ? 'API latency rose. Its order relative to the deploy is unresolved.'
          : 'Can we still say the API rise came after the deploy?',
        960,
        1014,
        final ? 37 : 45,
        final ? C.ink : C.yellow,
        'center',
      );
    }
  });
}
export default {
  id: 'fresh-incident',
  draw: drawFreshIncident,
  cues: [
    'mm-fresh-incident-0',
    'mm-fresh-direct',
    'mm-fresh-reduced',
    'mm-fresh-cache',
    'mm-fresh-incident-2',
    'mm-fresh-key',
    'mm-fresh-order',
    'mm-fresh-correct-clock',
    'mm-fresh-touch',
  ],
};
