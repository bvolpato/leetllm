import { lexicalTokens } from '../../lib/captions.mjs';
import { validateVisualCues } from '../../lib/narration-cues.mjs';
import { clamp } from './arithmetic.mjs';
import { text } from './defaults.mjs';

// Storyboards use the same phrases as the measured cut.
const estimates = new WeakMap();
export function cueProgress(scene, state, id) {
  if (state.cues?.[id]) return state.cues[id].progress;
  if (!estimates.has(scene)) {
    const phrases = validateVisualCues(scene).map((cue) => {
      const beat = scene.beats[cue.beat];
      const units = lexicalTokens(beat.say).length + (beat.hold ?? 0.45) * 2.5;
      return [cue.id, { beat: cue.beat, start: cue.first / units, end: (cue.last + 1) / units }];
    });
    estimates.set(scene, new Map(phrases));
  }
  const cue = estimates.get(scene).get(id);
  if (state.beat !== cue.beat) return Number(state.beat > cue.beat);
  return clamp((state.beatP - cue.start) / (cue.end - cue.start));
}

export function page(
  ctx,
  api,
  {
    status,
    detail,
    submitted,
    receipt,
    trace,
    color,
    account = 'acct_10234',
    report = 'Service-account key is stale.',
  },
) {
  const { C } = api;
  api.focus.target('page', () => {
    api.rect(ctx, 110, 280, 685, 530, C.panel, C.blue, 16);
    text(ctx, api, 'Luna’s browser', 145, 348, 38, C.blue);
    api.line(ctx, 145, 377, 760, 377, C.muted, 2);
    text(ctx, api, account, 145, 449, 36);
    text(ctx, api, report, 145, 505, 31, C.muted);
    api.rect(ctx, 145, 550, 285, 66, C.bg, submitted ? C.muted : C.blue, 9);
    text(ctx, api, 'Check policy', 288, 594, 31, submitted ? C.muted : C.ink, 'center');
    text(ctx, api, status, 145, 696, 41, color ?? C.ink);
    if (detail) text(ctx, api, detail, 145, 753, 29, C.muted);
    if (receipt) text(ctx, api, 'Trace ' + trace, 738, 593, 27, C.green, 'right');
  });
}

export function savedRow(ctx, api, row, { hidden = false } = {}) {
  const { C } = api;
  api.focus.target('server', () => {
    text(ctx, api, hidden ? 'Server' : 'Server record', 1190, 348, 38, hidden ? C.muted : C.cyan);
    if (hidden) {
      api.rect(ctx, 1186, 398, 574, 310, C.panel, C.muted, 7);
      text(ctx, api, 'Attempt status', 1220, 488, 38, C.muted);
      api.line(ctx, 1220, 528, 1724, 528, C.muted, 2);
      text(ctx, api, 'Outside the page’s view', 1220, 621, 32, C.muted);
      return;
    }
    api.rect(ctx, 1210, 422, 574, 310, C.bg, C.muted, 7);
    api.rect(ctx, 1198, 410, 574, 310, C.panel, C.muted, 7);
    api.rect(ctx, 1186, 398, 574, 310, C.panel, C.green, 7);
    text(ctx, api, 'Trace ' + row.id, 1220, 478, 33, C.ink);
    text(ctx, api, 'v' + row.version, 1720, 478, 33, C.muted, 'right');
    api.line(ctx, 1220, 511, 1724, 511, C.muted, 2);
    text(ctx, api, row.status, 1220, 597, 50, C.green);
    text(ctx, api, row.result.decision.replaceAll('_', ' ') + '   ·   P-7', 1220, 660, 33, C.ink);
  });
}

function envelope(ctx, api, x, y, color, width = 72) {
  const h = width * 0.64;
  api.rect(ctx, x - width / 2, y - h / 2, width, h, api.C.panel, color, 4);
  api.line(ctx, x - width / 2 + 3, y - h / 2 + 3, x, y + 3, color, 3);
  api.line(ctx, x, y + 3, x + width / 2 - 3, y - h / 2 + 3, color, 3);
}

// The gap between the line ends stays clear of the moving envelope.
export function transit(ctx, api, { from, to, y, progress, color, showPacket = true, stop }) {
  const direction = Math.sign(to - from);
  const x = from + ((stop ?? to) - from) * progress;
  if (!showPacket) {
    api.line(ctx, from, y, to, y, api.C.muted, 2);
    return;
  }
  const gap = 46;
  if ((x - from) * direction > gap) api.line(ctx, from, y, x - direction * gap, y, color, 4);
  if ((to - x) * direction > gap) api.line(ctx, x + direction * gap, y, to, y, api.C.muted, 2);
  envelope(ctx, api, x, y, color);
}
