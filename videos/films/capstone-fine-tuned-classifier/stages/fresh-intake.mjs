import { sceneClock } from '../desk.mjs';
import { freshIntake } from '../construction.mjs';

export function drawFreshIntake(ctx, scene, state, api) {
  const { C } = api;
  const clock = sceneClock(scene, state);
  const sample = freshIntake({
    route: clock.after('fresh-route'),
    miss: clock.after('fresh-hold'),
    hold: clock.after('fresh-hold'),
    effects: clock.after('fresh-effects'),
  });
  const replay = clock.progress('fresh-replay');
  const sliding = replay > 0 && replay < 1;
  const cutoff =
    replay === 1 ? sample.score : api.lerp(sample.threshold, sample.score, api.ease(replay));
  const x = (score) => 162 + (1580 * (score - 0.3)) / 0.1;
  const scoreVisible = clock.progress('fresh-premise') > 0;
  const y = 445;
  api.focus.target('fresh-ruler', () => {
    api.text(
      ctx,
      sample.ticket + '    /    “Someone changed my recovery email.”',
      122,
      252,
      44,
      C.ink,
      'left',
      'serif',
    );
    api.text(ctx, sample.tokens + ' tokens in full ticket', 1782, 252, 31, C.muted, 'right');
    api.text(
      ctx,
      replay > 0 ? 'Replay on the same ticket' : 'Frozen routing policy',
      122,
      335,
      30,
      C.muted,
    );
    api.line(ctx, x(0.3), y, x(cutoff), y, C.blue, 6);
    api.line(ctx, x(cutoff), y, x(0.4), y, C.cyan, 6);
    for (let n = 30; n <= 40; n++) {
      const xi = x(n / 100);
      api.line(ctx, xi, y + 3, xi, y + 18, C.muted, 2);
    }
    api.text(ctx, '0.30', x(0.3), y + 59, 28, C.muted, 'center');
    api.text(ctx, '0.40', x(0.4), y + 59, 28, C.muted, 'center');
    api.line(ctx, x(cutoff), y + 5, x(cutoff), y + 51, C.yellow, 5);
    api.text(
      ctx,
      sliding ? 'Lowering cutoff' : 'Cutoff ' + cutoff.toFixed(2),
      x(cutoff),
      y + 96,
      37,
      C.yellow,
      'center',
    );
    if (scoreVisible) {
      api.text(
        ctx,
        'Score ' + sample.score.toFixed(2),
        x(sample.score),
        y - 50,
        42,
        C.ink,
        'center',
      );
      api.circle(ctx, x(sample.score), y, 17, C.ink, C.bg);
    }
    if (replay === 1) {
      const replayLane = sample.score >= cutoff ? 'Human review' : 'Guarded agent';
      const result = clock.after('fresh-equal') ? '   →   ' + replayLane : ' ?';
      api.text(
        ctx,
        sample.score.toFixed(2) + ' ≥ ' + cutoff.toFixed(2) + result,
        960,
        612,
        38,
        C.cyan,
        'center',
      );
    } else if (!sliding) {
      api.text(ctx, 'Below cutoff   /   guarded agent', 170, 605, 30, C.blue);
      api.text(ctx, 'At or above cutoff   /   human review', 1740, 605, 30, C.cyan, 'right');
    }
  });

  api.focus.target('fresh-comparison', () => {
    const base = 692;
    api.line(ctx, 122, base - 31, 1782, base - 31, C.muted, 2);
    api.text(
      ctx,
      'Original gate record    /    ' + sample.ticket + ' at ' + sample.threshold.toFixed(2),
      122,
      base + 21,
      31,
      C.muted,
    );
    api.text(ctx, 'Proposed lane', 122, base + 116, 32, C.muted);
    const lane = sample.route === 'guarded_agent' ? 'Guarded agent' : 'Human review';
    api.text(
      ctx,
      sample.route ? lane : 'Which lane?',
      423,
      base + 116,
      41,
      sample.route ? C.blue : C.ink,
    );
    api.text(ctx, 'Required lane', 992, base + 116, 32, C.muted);
    const required = sample.gold ? 'Human review' : 'Guarded agent';
    api.text(
      ctx,
      clock.after('fresh-label') ? required : 'Label sealed',
      1332,
      base + 116,
      41,
      clock.after('fresh-label') ? C.cyan : C.muted,
    );
    if (sample.falseNegative) {
      api.text(ctx, sample.decision.toUpperCase() + '   /   1 required miss', 122, 922, 48, C.pink);
    } else if (clock.after('fresh-label')) {
      api.text(ctx, 'Zero required misses allowed. Release this candidate?', 122, 923, 40, C.ink);
    }
    if (sample.approvedEffects !== null)
      api.text(
        ctx,
        'Access changes approved    ' + sample.approvedEffects,
        1782,
        922,
        35,
        C.ink,
        'right',
      );
    if (clock.after('fresh-new-evaluation'))
      api.text(
        ctx,
        'Revised policy at 0.34    /    Needs a new independent gate',
        122,
        1015,
        37,
        C.yellow,
      );
    else if (state.beat === 3 && clock.after('fresh-equal'))
      api.text(ctx, 'Can this replay count as independent evidence?', 122, 1015, 37, C.ink);
  });
}

export default {
  id: 'fresh-intake',
  draw: drawFreshIntake,
  cues: [
    'fresh-premise',
    'fresh-route',
    'fresh-label',
    'fresh-hold',
    'fresh-effects',
    'fresh-replay',
    'fresh-equal',
    'fresh-new-evaluation',
  ],
};
