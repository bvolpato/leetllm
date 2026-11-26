// Scene 16: batch-deadline - Match lower-cost processing to the deadline
// Dual-lane routing cascade energy splitter: Live interactive lane (cyan) vs 24h async Batch lane (50% discount)
// nested cleanly inside a 48h evaluation deadline with 24h completion window and recovery margin.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  evaluationMicro,
  glowBar,
  glowTex,
  guardedDynamic,
  quadArcPts,
  txt,
  usd,
} from '../parts.mjs';

export default function batchDeadline(s, c) {
  const pulseT = s.value(0);
  const liveProg = s.value(0); // `interactive-work`
  const batchProg = s.value(0); // `batch-window`
  const fitProg = s.value(0); // `deadline-fit`

  const header = cinemaHeader('ROUTING BY DEADLINE', 'Trade response time', 'for a 50% discount', {
    x: -860,
    y: -415,
    accent: ROLE.batch,
    size: 52,
  });

  const sceneAura = aura(140, 40, 720, '#60a5fa24', '#6ee7b71a');

  const batchEq = glowTex(String.raw`C_{\mathrm{batch}} = \$2.82 / \text{night}\;(-50\%)`, {
    x: 420,
    y: 355,
    size: 40,
    color: ROLE.ok,
    glow: 8,
  });

  const stageCanvas = guardedDynamic(
    () => 1,
    () => {
      const lp = liveProg.value;
      const bp = batchProg.value;
      const fp = fitProg.value;
      const p = pulseT.value;

      const nodes = [];

      // Left incoming request router node
      nodes.push(
        rect(300, 120, { fill: '#121b33', stroke: COSMOS.ink, width: 2.4, radius: 16 })
          .at(-700, 40)
          .glow(7, ROLE.input),
        txt('TRAFFIC', -700, 16, 26, COSMOS.muted, 'mono'),
        txt('ROUTER', -700, 60, 34, COSMOS.ink, 'mono'),
      );

      // Upper Lane: Interactive Live Support (y = -135)
      const upperPts = quadArcPts([-540, 10], [-140, -135], -65);
      nodes.push(
        beamWithPhotons(upperPts, ROLE.input, p, {
          width: 4.2,
          glow: 11,
          photonCount: 2,
          alpha: 0.45 + 0.55 * lp,
        }),
        txt('LIVE SUPPORT  ·  IMMEDIATE REPLY', -110, -210, 26, ROLE.input, 'mono', 'left'),
        rect(960, 92, { fill: '#0e2838', stroke: ROLE.input, width: 2.4, radius: 14 })
          .at(370, -135)
          .glow(8, ROLE.input),
        txt('Interactive Standard Lane  ·  Customer waiting', 370, -135, 30, ROLE.input, 'sans'),
        txt('Keep interactive  ·  100% Standard rate', -110, -52, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Lower Lane: Nightly Evaluation Async Batch (y = 145)
      const lowerPts = quadArcPts([-540, 70], [-140, 145], 65);
      nodes.push(
        beamWithPhotons(lowerPts, ROLE.cached, (p + 0.5) % 1, {
          width: 4.2,
          glow: 11,
          photonCount: 2,
          alpha: 0.35 + 0.65 * bp,
        }),
        txt('NIGHTLY EVALUATION  ·  48h DEADLINE', -110, 58, 26, ROLE.cached, 'mono', 'left'),
      );

      // 48h timeline bar with 24h provider batch window + 24h recovery cushion
      const barLeft = -110;
      const barW = 960;
      const midX = barLeft + barW * 0.5;
      nodes.push(
        glowBar(barLeft, 138, barW, 48, 0.5 * Math.max(0.3, bp), {
          fill: ROLE.cached,
          border: ROLE.batch,
          glow: 10,
        }),
        dashedRule(midX, 95, midX, 174, ROLE.ok, { width: 2.6 }),
        txt('0 h', barLeft, 214, 26, COSMOS.muted, 'mono', 'left'),
        txt('24 h Batch Window (50% off)', midX, 214, 26, ROLE.cached, 'mono'),
        txt('48 h Deadline', barLeft + barW, 214, 26, ROLE.ok, 'mono', 'right'),
      );

      // Bottom fit checklist / cold-cache caution
      nodes.push(
        txt(
          fp > 0.3
            ? `Model + endpoint + 24h window + recovery fit  ·  warm ${usd(evaluationMicro)}`
            : 'Batch trades response latency for 50% token price reduction',
          -860,
          345,
          28,
          fp > 0.3 ? ROLE.ok : COSMOS.muted,
          'sans',
          'left',
        ).glow(fp > 0.3 ? 6 : 0, ROLE.ok),
        txt(
          'Always estimate cold-cache & expired-job recovery too',
          -860,
          410,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, stageCanvas);
  driftValue(s, c, pulseT, 4.2, { startOffset: 0.1, endMargin: 0.5 });

  c.on('interactive-work', () => {
    const t = c.cue('interactive-work').start;
    s.play(liveProg.to(1, { duration: clampDur(c, t, 0.5) }));
  });
  c.on('batch-window', () => {
    const t = c.cue('batch-window').start;
    s.play(batchProg.to(1, { duration: clampDur(c, t, 0.6) }));
  });
  c.show('deadline-fit', batchEq);
  c.on('deadline-fit', () => {
    const t = c.cue('deadline-fit').start;
    s.play(fitProg.to(1, { duration: clampDur(c, t, 0.45) }));
  });
}
