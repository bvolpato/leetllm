import { holdoutOverlap } from '../arithmetic.mjs';

export function drawNegativeEvidence(ctx, scene, state, api) {
  const { C, focus } = api;
  const seen = (id) => focus.visible(id);
  const write = (s, x, y, size, color = C.ink, font = 'sans') =>
    api.text(ctx, s, x, y, size, color, 'left', font);
  if (state.beat === 2) {
    write('Incident rehearsal', 122, 276, 39, C.muted);
    focus.target('incident', () =>
      write('Support agents got blank search results.', 122, 382, 64, C.ink, 'serif'),
    );
    if (seen('index-rollback'))
      focus.target('rollback', () => write('Jo rolled back the release.', 122, 495, 41));
    if (seen('index-repair')) {
      focus.target('repair', () =>
        write('I restored the missing index entries.', 890, 495, 41, C.cyan),
      );
      api.line(ctx, 122, 562, 1798, 562, C.muted, 2);
      write('Repeat incidents recorded by the same alert', 122, 650, 44, C.ink, 'serif');
      for (const [i, period, count] of [
        [0, 'before', 4],
        [1, 'after', 1],
      ]) {
        const y = 770 + i * 129;
        write('Four weeks ' + period + ' the fix', 122, y + 15, 40);
        if (seen('count-' + period)) {
          focus.target(period, () => {
            for (let j = 0; j < count; j++) {
              api.circle(ctx, 890 + j * 92, y, 28, C.pink);
            }
            write(count === 1 ? '1 incident' : count + ' incidents', 1370, y + 16, 43);
          });
        }
      }
    }
    return;
  }
  const count = 100,
    required = ['D99', 'D100'],
    pass = count - required.length;
  const x0 = 122,
    y0 = 310,
    stride = 49,
    side = 36;
  write('Development suite • 100 cases', x0, 255, 38);
  focus.target('development-suite', () => {
    for (let i = 0; i < count; i++) {
      const x = x0 + (i % 10) * stride,
        y = y0 + Math.floor(i / 10) * stride;
      api.rect(ctx, x, y, side, side, i < pass ? C.green : C.pink, undefined, 5);
    }
  });
  focus.target('required-pair', () => {
    write('98 pass', 126, 868, 53, C.green, 'serif');
    write('2 fail', 395, 868, 53, C.pink, 'serif');
  });
  write('Required boundary cases', 726, 369, 40, C.ink, 'serif');
  write(required.join('  /  '), 726, 438, 39, C.pink, 'mono');
  focus.target('promotion', () => {
    write(
      seen('negative-evidence-stop') ? 'Hold promotion' : 'Promote this build?',
      726,
      564,
      51,
      C.yellow,
      'serif',
    );
  });
  if (state.beat >= 1) {
    const fresh = seen('negative-evidence-holdout');
    focus.target('holdout-ids', () => {
      write('Used to guide the repair', 726, 707, 34, C.muted);
      write(required.join('  /  '), 726, 782, 41, C.pink, 'mono');
      if (fresh) {
        const holdout = ['H01', 'H02'];
        write('Untouched holdout', 1300, 707, 34, C.muted);
        write(holdout.join('  /  '), 1300, 782, 41, C.cyan, 'mono');
        write('Cases shared: ' + holdoutOverlap(required, holdout).length, 1300, 866, 35);
      }
    });
  }
}
export default {
  id: 'negative-evidence',
  draw: drawNegativeEvidence,
  cues: [
    'negative-evidence-slice',
    'negative-evidence-stop',
    'negative-evidence-holdout',
    'negative-evidence-incident',
    'index-rollback',
    'index-repair',
    'count-before',
    'count-after',
  ],
};
