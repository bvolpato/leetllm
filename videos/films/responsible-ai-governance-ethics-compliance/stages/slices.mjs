import { cueProgress, governancePermission } from '../construction.mjs';
import { sampleModel } from '../model.mjs';

const ticketX = (index) => 155 + index * 59;
const fraction = (blocked, total) =>
  `${blocked} / ${total}    ${Number(((100 * blocked) / total).toFixed(1))}%`;

function ticket(ctx, api, x, y, blocked, tested) {
  const { C } = api;
  api.rect(ctx, x - 23, y - 24, 46, 48, blocked ? C.pink : C.panel, blocked ? C.pink : C.muted, 4);
  if (!tested) return;
  if (blocked) {
    api.line(ctx, x - 8, y - 8, x + 8, y + 8, C.bg, 3);
    api.line(ctx, x - 8, y + 8, x + 8, y - 8, C.bg, 3);
  } else {
    api.line(ctx, x - 9, y + 1, x - 3, y + 7, C.ink, 3);
    api.line(ctx, x - 3, y + 7, x + 10, y - 8, C.ink, 3);
  }
}

function rateRuler(ctx, api, name, y, blocked, total, visible, color, pending = '') {
  const { C } = api;
  const start = 485,
    span = 805;
  api.text(ctx, name, 110, y + 13, 38, C.ink);
  api.line(ctx, start, y, start + span, y, C.muted, 2);
  // The chosen ceiling applies to each supported path.
  if (name !== 'Combined')
    api.line(ctx, start + span / 4, y - 21, start + span / 4, y + 21, C.yellow, 4);
  if (visible) {
    const point = start + (span * blocked) / total;
    if (point > start) api.rect(ctx, start, y - 8, point - start, 16, color, undefined, 3);
    api.circle(ctx, point, y, 12, color);
    api.text(ctx, fraction(blocked, total), 1370, y + 14, 39, color);
  } else if (pending) {
    api.text(ctx, pending, 1370, y + 11, 30, C.muted);
  }
}

export function drawSlices(ctx, scene, state, api) {
  const { C, focus, text, line } = api;
  const b = state.beat;
  const sample = sampleModel('slices', state);
  const { extra } = sample;
  const seenMisses = b > 0 || governancePermission(state, 'slice-misses');
  const retesting = b === 3 && cueProgress(state, 'path-repair') > 0 && sample.repaired < 4;
  const select = b > 0 ? 1 : cueProgress(state, 'slice-bracket');
  const showCombined = b > 0 || governancePermission(state, 'slice-pooled');
  const showPath = b > 1 || governancePermission(state, 'path-threshold');

  focus.target('ticket-and-rates', () => {
    focus.target('ticket-roll', () => {
      text(ctx, 'Web console   ·   20 original requests', 130, 250, 36, C.ink);
      text(ctx, 'Screen reader   ·   8 eligible requests', ticketX(20) - 23, 250, 28, C.ink);
      for (let i = 0; i < 28; i++) {
        const screenIndex = i - 20;
        const waiting = retesting && screenIndex >= sample.repaired && screenIndex < 4;
        const blocked = seenMisses && !waiting && screenIndex >= 0 && sample.screen[screenIndex];
        ticket(ctx, api, ticketX(i), 310, blocked, seenMisses && !waiting);
        if (screenIndex >= 0)
          text(ctx, 'S' + (screenIndex + 1), ticketX(i), 383, 25, C.muted, 'center');
      }
      const first = api.lerp(ticketX(0) - 23, ticketX(20) - 23, select);
      const last = ticketX(27) + 23;
      line(ctx, first, 406, first, 427, C.cyan, 4);
      line(ctx, first, 427, last, 427, C.cyan, 4);
      line(ctx, last, 406, last, 427, C.cyan, 4);
      if (b >= 2) {
        for (let i = 0; i < extra; i++) ticket(ctx, api, ticketX(i), 505, false, true);
        if (extra || b === 2)
          text(ctx, `+${extra} passing web requests`, ticketX(20) - 23, 515, 32, C.muted);
        else
          text(
            ctx,
            sample.repaired === 4
              ? 'Retest complete   ·   original 28 requests'
              : retesting
                ? `Retest   ·   ${4 - sample.repaired} results pending`
                : 'Original run   ·   28 requests',
            130,
            515,
            34,
            C.ink,
          );
      } else {
        text(
          ctx,
          select === 1 ? 'Screen-reader cases' : 'Eligible requests in the bracket',
          (first + last) / 2,
          495,
          30,
          C.cyan,
          'center',
        );
      }
    });
    focus.target('rate-rulers', () => {
      text(ctx, 'Wrongly blocked / eligible requests', 110, 613, 30, C.muted);
      text(ctx, '25% ceiling per supported path', 688, 613, 29, C.yellow);
      text(ctx, '100%', 1290, 640, 24, C.muted, 'center');
      const pending = retesting ? 'Retest in progress' : '';
      rateRuler(
        ctx,
        api,
        'Combined',
        700,
        sample.blocked,
        sample.total,
        showCombined && !retesting,
        C.ink,
        pending,
      );
      rateRuler(
        ctx,
        api,
        'Screen reader',
        818,
        sample.screen.filter(Boolean).length,
        sample.screen.length,
        showPath && !retesting,
        sample.investigation ? C.pink : C.cyan,
        pending,
      );
      rateRuler(
        ctx,
        api,
        'Web console',
        936,
        sample.web.filter(Boolean).length,
        sample.web.length,
        showPath,
        C.cyan,
      );
    });
  });
}

export default {
  id: 'slices',
  draw: drawSlices,
  cues: [
    'gov-slice-misses',
    'gov-slice-pooled',
    'gov-slice-bracket',
    'gov-path-threshold',
    'gov-slice-trace',
    'gov-slice-extra',
    'gov-slice-reset',
    'gov-path-repair',
  ],
};
