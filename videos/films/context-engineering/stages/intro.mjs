import { sources } from '../fixtures.mjs';
import { findings } from '../model.mjs';
import { caseClock, casePage } from '../case-file.mjs';

function recordSlip(ctx, api, page, { x, y, name, record, lockCheck }) {
  const { text, rule, box, C } = page;
  const width = 750;
  box(x, y, width, 260, C.ink);
  text(name, x + 40, y + 51, 31, C.bg, 'left', 'mono');
  if (lockCheck) {
    text('Migration lock', x + 40, y + 151, 47, C.bg);
    text(record.locked ? 'Held' : 'Absent', x + width - 40, y + 151, 55, C.bg, 'right', 'serif');
  } else {
    text(record.status, x + 36, y + 160, 110, C.bg, 'left', 'serif');
    text(record.path, x + width - 40, y + 147, 51, C.bg, 'right', 'mono');
  }
  const seam = y + 187;
  for (let dx = 22; dx < width - 18; dx += 30) {
    rule(x + dx, seam, x + dx + 13, seam, C.muted, 2);
  }
  for (const edge of [x, x + width]) api.circle(ctx, edge, seam, 10, C.bg);
  text('Request  ' + record.trace, x + 40, y + 236, 30, C.bg, 'left', 'mono');
  text('Time  ' + record.at, x + width - 40, y + 236, 30, C.bg, 'right', 'mono');
}

export function drawIntro(ctx, scene, state, api) {
  const page = casePage(ctx, api);
  const { text, rule, box, focus, C } = page;
  const clock = caseClock(scene, state);
  const trace = sources['trace-17'];
  const lock = sources['lock-check'];
  const joined = findings().some((finding) => finding.source === 'lock-check');
  const revised = joined && clock.done('intro-keep');
  const assembled = clock.started('intro-request');
  const t = state.t ?? 1;
  if (t < 0.35) ctx.globalAlpha = 1;

  focus('incident-records', () => {
    const travel = 1 - Math.min(1, t / 1.15);
    recordSlip(ctx, api, page, {
      x: 205 - 155 * travel * travel,
      y: 257,
      name: 'trace-17',
      record: trace,
    });
    if (clock.started('intro-lock')) {
      const travel = 1 - clock.progress('intro-lock');
      recordSlip(ctx, api, page, {
        x: 205 - 110 * travel * travel,
        y: 566,
        name: 'lock-check',
        record: lock,
        lockCheck: true,
      });
    }
  });

  focus('incident-note', () => {
    box(1040, 257, 735, 569, C.panel);
    rule(1040, 257, 1040, 826, revised ? C.green : C.yellow, 5);
    text(
      assembled
        ? 'Next model input'
        : revised
          ? 'Checked incident note'
          : 'Draft incident note   /   RUN-842',
      1088,
      333,
      36,
      revised ? C.green : C.yellow,
    );
    rule(1088, 365, 1725, 365);
    if (revised) {
      text('No migration lock', 1088, 481, 57, C.ink, 'left', 'serif');
      text('observed for ' + lock.trace, 1088, 552, 54, C.ink, 'left', 'serif');
      text('at time ' + lock.at + '.', 1088, 623, 54, C.ink, 'left', 'serif');
      text('Source   lock-check', 1088, 753, 35, C.blue, 'left', 'mono');
    } else {
      const claim = 'A migration lock\ncaused the failure.';
      const remaining = Math.ceil(claim.length * (1 - clock.progress('intro-erase')));
      const [first, second] = claim.slice(0, remaining).split('\n');
      if (first) text(first, 1088, 485, 61, C.ink, 'left', 'serif');
      if (second) text(second, 1088, 562, 61, C.ink, 'left', 'serif');
      if (remaining) {
        text('Proposed action', 1088, 682, 29, C.muted);
        text('Roll back the database', 1088, 746, 44, C.yellow);
      } else {
        text('Source   lock-check', 1088, 753, 35, C.blue, 'left', 'mono');
      }
    }
  });

  focus('incident-question', () => {
    if (assembled)
      text(
        'Investigate /callback     ·     Trace lookup     ·     trace-17 + checked note',
        204,
        963,
        36,
        C.blue,
      );
    else if (revised)
      text('Open question     Why did /callback return ' + trace.status + '?', 204, 963, 39, C.ink);
    else if (clock.started('intro-question') && !clock.started('intro-erase'))
      text('Keep the lock explanation for this request?', 204, 963, 43, C.yellow);
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-trace',
    'intro-status',
    'intro-lock',
    'intro-question',
    'intro-erase',
    'intro-keep',
    'intro-request',
  ],
};
