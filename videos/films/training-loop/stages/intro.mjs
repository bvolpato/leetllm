import { text } from '../defaults.mjs';
import { FEATURES } from '../fixtures.mjs';
import { oneTrainingStep } from '../model.mjs';
import { routeRuler, scoreTicket, signed } from '../route-ruler.mjs';
import { finished, progressDuring } from '../scene-clock.mjs';

const step = oneTrainingStep();
const initial = scoreTicket(step.weights, FEATURES[0]);
const learned = scoreTicket(step.updated, FEATURES[0]);

function drawTicket(ctx, api, x, y) {
  const { C } = api;
  const left = x - 280;
  api.path(
    ctx,
    [
      { x: left, y },
      { x: x + 230, y },
      { x: x + 280, y: y + 50 },
      { x: x + 280, y: y + 208 },
      { x: left, y: y + 208 },
    ],
    { closed: true, fill: C.ink, width: 0 },
  );
  api.path(
    ctx,
    [
      { x: x + 230, y },
      { x: x + 230, y: y + 50 },
      { x: x + 280, y: y + 50 },
    ],
    { color: C.muted, width: 3 },
  );
  text(ctx, api, 'TICKET A   /   LABEL: ESCALATE', left + 28, y + 47, 26, C.bg);
  text(ctx, api, 'Checkout is down', left + 28, y + 112, 55, C.bg);
  text(
    ctx,
    api,
    'Urgency ' + FEATURES[0][0] + '    Severity ' + FEATURES[0][1],
    left + 28,
    y + 162,
    29,
    C.bg,
  );
}

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  if (state.t < 0.35) ctx.globalAlpha = 1;
  const hasGradient = finished(state, 'intro-gradient', 1, 0.53);
  const hasStep = finished(state, 'intro-result', 2, 0.38);
  const hasScores = finished(state, 'intro-read-scores', 2, 0.7);
  const hasGap = finished(state, 'intro-gap', 2, 0.94);
  const makeRoom = progressDuring(state, 'intro-score-tie', 0, 0.25, 0.4);
  const inboxes = [520, 1400];
  const arrival = api.clamp((state.t ?? 0) / 1.15, 0, 1);
  const result = state.cues?.['intro-result'];
  const reroute = hasStep ? (result ? api.ease((state.t - result.end) / 0.95) : 1) : 0;
  const x = api.lerp(inboxes[0] + 360 * (1 - arrival) ** 2, inboxes[1], reroute);
  const y = 220 + 125 * arrival - 132 * Math.sin(Math.PI * reroute);

  api.focus.target('intro-scores', () => {
    ctx.save();
    ctx.translate(0, 118 * (1 - makeRoom));
    drawTicket(ctx, api, x, y);
    for (const [i, center] of inboxes.entries()) {
      const color = i ? C.green : C.blue;
      const left = center - 340;
      const right = center + 340;
      api.path(
        ctx,
        [
          { x: left, y: 489 },
          { x: left + 48, y: 489 },
          { x: left + 80, y: 521 },
          { x: right - 80, y: 521 },
          { x: right - 48, y: 489 },
          { x: right, y: 489 },
          { x: right - 18, y: 608 },
          { x: left + 18, y: 608 },
        ],
        { color, width: 5, fill: C.panel, closed: true },
      );
      const score = hasScores
        ? signed(learned.logits[i])
        : hasStep
          ? '…'
          : signed(initial.logits[i]);
      text(ctx, api, i ? 'Escalation' : 'Standard', left + 60, 581, 47, color);
      text(ctx, api, 'score  ' + score, right - 60, 580, 37, C.ink, 'right');
    }
    ctx.restore();
  });

  const marks = [
    {
      gap: initial.gap,
      label: hasStep ? 'Before step' : 'Ticket A',
      color: hasStep ? C.muted : C.yellow,
      hollow: hasStep,
    },
  ];
  if (hasGap) marks.push({ gap: learned.gap, label: 'A  ' + signed(learned.gap), color: C.green });
  if (makeRoom > 0.75) {
    ctx.save();
    ctx.globalAlpha *= api.ease((makeRoom - 0.75) / 0.25);
    routeRuler(ctx, api, 795, marks);
    ctx.restore();
  }
  api.focus.target('intro-operation', () => {
    text(
      ctx,
      api,
      hasGradient ? 'loss.backward()   →   .grad' : 'loss.backward()',
      520,
      851 + 143 * makeRoom,
      42,
      hasGradient ? C.yellow : C.ink,
      'center',
    );
    text(
      ctx,
      api,
      hasStep ? 'optimizer.step()   →   weights' : 'optimizer.step()',
      1400,
      851 + 143 * makeRoom,
      42,
      hasStep ? C.green : C.ink,
      'center',
    );
  });
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: [
    'intro-score-tie',
    'intro-pin',
    'intro-choose',
    'intro-gradient',
    'intro-still',
    'intro-result',
    'intro-read-scores',
    'intro-gap',
  ],
};
