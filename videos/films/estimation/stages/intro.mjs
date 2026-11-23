import { afterCue, event, introFrame } from '../construction.mjs';
import { focusTarget, text } from '../defaults.mjs';
import { weeklyQueue, weeklySample } from '../fixtures.mjs';
import { count } from '../model.mjs';

const firstTray = weeklySample.slice(0, 100);
const fiveRate = count(firstTray.slice(0, 5)) / 5;
const trayRate = count(firstTray) / firstTray.length;
const limit = weeklyQueue.capacity / weeklyQueue.size;
const rateX = (share) => 175 + (1625 * share) / 0.4;

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const f = introFrame(state);
  const { spread } = f;
  const inspect = event(state, 0, 'five-count', 0, 0.2);
  const tallied =
    state.beat > 1 || (state.beat === 1 && afterCue(state, 'sample-tally', 0.45, 0.56));
  const lower = event(state, 1, 'move-point', 0.8, 0.97);
  const railY = 850;

  text(
    ctx,
    api,
    'Set before review · one decision after 400 random reviews · two-sided 95% Wilson interval',
    960,
    236,
    29,
    C.muted,
    'center',
  );
  focusTarget(ctx, api, state.beat === 0 ? 'first-five' : 'selected-messages', () => {
    text(
      ctx,
      api,
      state.beat === 0 ? 'First five messages' : 'First hundred messages',
      528,
      311,
      38,
      C.ink,
      'center',
    );
    for (let i = 0; i < f.drawn; i++) {
      const gridX = 363 + (i % 10) * 36;
      const gridY = 369 + Math.floor(i / 10) * 36;
      const x = i < 5 ? api.lerp(220 + i * 154, gridX, spread) : gridX;
      const reviewed = i < f.labeled;
      const specialist = reviewed && firstTray[i].specialist;
      const lift = specialist ? 32 * inspect : 0;
      const y = i < 5 ? api.lerp(486 - lift, gridY, spread) : gridY;
      const color = reviewed ? (specialist ? C.pink : C.blue) : C.muted;
      if (i >= 5 || spread === 1) {
        api.circle(ctx, x, y, 12, color);
        continue;
      }
      const turn = Math.max(0, Math.min(1, inspect * 5 - i));
      const w = api.lerp(126 * (1 - 0.85 * Math.sin(Math.PI * turn)), 24, spread);
      const h = api.lerp(88, 24, spread);
      const flap = specialist ? C.panel : color;
      api.rect(ctx, x - w / 2, y - h / 2, w, h, specialist ? color : C.panel, color, 4, 6);
      api.line(ctx, x - w * 0.46, y - h * 0.39, x, y + h * 0.1, flap, 3);
      api.line(ctx, x, y + h * 0.1, x + w * 0.46, y - h * 0.39, flap, 3);
      if (spread === 0)
        text(
          ctx,
          api,
          reviewed ? (specialist ? 'Specialist' : 'Routine') : 'Sealed',
          x,
          y + 95,
          27,
          color,
          'center',
        );
    }
    if (state.beat === 2)
      text(
        ctx,
        api,
        f.k + ' specialist / ' + f.labeled + ' reviewed',
        525,
        750,
        30,
        C.pink,
        'center',
      );
  });

  if (state.beat < 2) {
    focusTarget(ctx, api, 'reviewed-labels', () => {
      const heading =
        state.beat === 0 ? 'How many need a specialist?' : 'Specialist cases / messages reviewed';
      text(ctx, api, heading, 1370, 311, 32, C.ink, 'center');
      const tally = f.labeled === 5 || tallied ? f.k : '?';
      text(
        ctx,
        api,
        tally + ' / ' + (state.beat === 0 ? 5 : f.labeled),
        1370,
        516,
        93,
        C.ink,
        'center',
      );
      if (f.known)
        text(
          ctx,
          api,
          Math.round(100 * f.estimate) + '% in the first hundred',
          1370,
          612,
          35,
          C.yellow,
          'center',
        );
    });
  } else {
    focusTarget(ctx, api, 'sealed-plan', () => {
      text(ctx, api, 'Plan fixed before review', 1370, 311, 38, C.ink, 'center');
      const plan = event(state, 2, 'lock-plan', 0.03, 0.17);
      for (let i = 0; i < 1 + Math.floor(3 * plan); i++) {
        const x = 990 + i * 192;
        const color = i === 0 ? C.cyan : C.muted;
        api.rect(ctx, x + 6, 378, 177, 102, C.panel, color, 2, 5);
        api.rect(ctx, x, 386, 177, 102, C.panel, color, 3, 5);
        text(ctx, api, '100', x + 88, 454, 47, color, 'center');
        text(ctx, api, i === 0 ? 'reviewed' : 'sealed', x + 88, 536, 26, color, 'center');
      }
      if (event(state, 2, 'lock-rule', 0.43, 0.54) > 0) {
        text(ctx, api, 'One decision at 400 reviews', 1370, 619, 32, C.yellow, 'center');
        text(ctx, api, 'Two-sided 95% Wilson interval', 1370, 671, 28, C.ink, 'center');
      }
      if (event(state, 2, 'rule-limit', 0.62, 0.74) > 0)
        text(ctx, api, 'Regular shift if upper end < 20%', 1370, 722, 28, C.ink, 'center');
    });
  }

  focusTarget(ctx, api, 'capacity-ruler', () => {
    api.line(ctx, rateX(0), railY, rateX(0.4), railY, C.muted, 3);
    for (const rate of [0, 0.1, 0.2, 0.3, 0.4]) {
      const x = rateX(rate);
      api.line(ctx, x, railY, x, railY + 12, C.muted, 2);
      text(ctx, api, Math.round(100 * rate) + '%', x, railY + 65, 29, C.muted, 'center');
    }
    const line = rateX(limit);
    api.line(ctx, line, railY - 78, line, railY + 12, C.pink, 4);
    text(ctx, api, 'Regular shift if upper end < 20%', line - 18, railY - 73, 28, C.pink, 'right');
    const land = event(state, 0, 'shift-capacity', 0.26, 0.42);
    if (land > 0) {
      const x = api.lerp(1370, rateX(api.lerp(fiveRate, trayRate, lower)), land);
      api.circle(ctx, x, api.lerp(558, railY, land), 13, C.yellow);
      if (lower === 1) {
        text(ctx, api, '16 / 100', x - 16, railY - 24, 31, C.yellow, 'right');
      } else if (land === 1 && lower === 0) {
        text(ctx, api, '1 / 5', x - 16, railY - 24, 31, C.yellow, 'right');
      }
    }
  });
  text(ctx, api, 'Share needing a specialist', 960, 985, 30, C.muted, 'center');
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'five-count',
    'shift-capacity',
    'sample-draw',
    'sample-label',
    'sample-tally',
    'sample-fraction',
    'move-point',
    'lock-plan',
    'lock-rule',
    'rule-limit',
  ],
};
