// Scene 37: synthesis - How many workers should be warm at nine?
// Orbiting 3D 4-GPU -> 5-GPU warm cluster + wave grid across t = 0, 10, 20, 30s gate.
// Strict prediction withholding on BOTH questions:
//   Q1 (beat 0): Will 4 warm workers get all 100 in? -> reveals 80 admitted / 20 wait AFTER four-short.
//   Q2 (beat 2): With 5 warm workers, where & when does R100 start? -> reveals GPU 5 @ 30s (finishes 40s) AFTER hundred-starts!
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  driftValue,
  fadeInNodes,
  glowTex,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=4 warm Q1(PREDICT!), 2=80 start/20 short(AFTER!), 3=5th GPU ready, 4=fill Q2(PREDICT!), 5=R100->GPU5@30s(AFTER!)

  const header = cinemaHeader('WARM POOL SIZING FORMULA', 'How many workers', 'warm at nine?', {
    x: -860,
    y: -420,
    accent: ROLE.warm,
    size: 52,
  });

  const bgAura = aura(285, 25, 630, '#6ee7b722', '#ffd1661c');

  const sizeEq = glowTex(String.raw`\lceil 100 / (5 \times 4) \rceil = 5\;\text{GPUs}`, {
    x: -555,
    y: 355,
    size: 38,
    color: ROLE.warm,
    glow: 7,
  });

  // 3D Warm GPU Cluster on right: GPUs 1..4 always visible; GPU 5 fades in on fifth-ready!
  const synthView = cinematic3d({
    theta: -0.8,
    phi: 1.0,
    distance: 18.0,
    unit: 88,
    focus: [0, 0, 0.85],
  }).at(340, -170);

  synthView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  for (let i = 0; i < 4; i++) {
    const gx = -3.4 + i * 1.45;
    addBox3D(synthView, gx, -0.95, 0.05, 1.1, 1.9, 1.3, ROLE.active, ROLE.active, {
      faceOpacity: 0.82,
      edgeWidth: 2.2,
      edgeGlow: 7,
    });
  }
  const gpu5 = hideNodes(
    addBox3D(synthView, 2.4, -0.95, 0.05, 1.1, 1.9, 1.45, ROLE.warm, ROLE.focus, {
      faceOpacity: 0.88,
      edgeWidth: 2.8,
      edgeGlow: 11,
    }),
  );

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const p = phase.value;
      const blink = 0.68 + 0.32 * Math.sin(p * 5.0);
      const fiveWarm = st >= 2.5;
      const nodes = [
        txt(
          fiveWarm ? '5 WARM GPUs  (25 SLOTS / WAVE)' : '4 WARM GPUs  (20 SLOTS / WAVE)',
          340,
          -435,
          26,
          fiveWarm ? ROLE.warm : ROLE.active,
          'mono',
        ).glow(6, fiveWarm ? ROLE.warm : ROLE.active),
        txt('100 summaries · 5 slots/GPU · 10s hold', -860, -195, 28, COSMOS.ink, 'mono', 'left'),
        txt(
          'Legal starts: 0s, 10s, 20s, 30s (4 waves)',
          -860,
          -138,
          28,
          ROLE.deadline,
          'mono',
          'left',
        ),
      ];

      // Q1 Prediction (Beat 0 hold)
      if (st >= 0.5 && st < 1.5) {
        nodes.push(
          txt(
            'PREDICT: Will 4 warm GPUs start all 100?',
            -860,
            -35,
            30,
            ROLE.predict,
            'sans',
            'left',
          )
            .glow(8, ROLE.predict)
            .opacity(blink),
          txt(
            'Waves 0, 10, 20s shown  ·  1 refill left at 30s',
            -860,
            26,
            26,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      // Q1 Reveal (AFTER four-short)
      if (st >= 1.5 && st < 2.5) {
        nodes.push(
          txt(
            '4 GPUs -> 80 START  ·  20 MISS GATE',
            -860,
            -35,
            32,
            ROLE.expired,
            'mono',
            'left',
          ).glow(8, ROLE.expired),
          txt(
            'R81..R100 still waiting when 30s gate closes',
            -860,
            28,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      }

      // Q2 Prediction (Beat 2 hold: with 5th GPU added, withhold R100 location/time!)
      if (st >= 2.5 && st < 4.5) {
        nodes.push(
          txt('REWIND WITH 5th WARM GPU READY AT 9:00', -860, -35, 28, ROLE.warm, 'mono', 'left'),
          txt('PREDICT: Where & when does R100 start?', -860, 32, 32, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(blink),
        );
      }

      // Q2 Reveal (STRICTLY AFTER hundred-starts)
      if (st >= 4.5) {
        nodes.push(
          txt('R100 -> GPU 5 AT t = 30 s!', -860, -35, 34, ROLE.warm, 'mono', 'left').glow(
            9,
            ROLE.warm,
          ),
          txt(
            'Finishes at 40s (legal for a 30s start gate)',
            -860,
            28,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt('5 GPUs = smallest warm pool for all 100', -860, 86, 26, ROLE.focus, 'mono', 'left'),
        );
      }

      // Wave start strip along lower canvas (0s, 10s, 20s, 30s gate)
      const baseX = -50;
      const dx = 225;
      const yRow = 285;
      const ticks = [0, 10, 20, 30];
      const perWave = fiveWarm ? 25 : 20;
      const show30 = (st >= 1.5 && st < 2.5) || st >= 4.5;

      const gateX = baseX + 3 * dx + 125;
      nodes.push(
        dashedRule(gateX, 205, gateX, 395, ROLE.deadline, 0.92, 3.0),
        txt('30s GATE', gateX, 174, 26, ROLE.deadline, 'mono').glow(6, ROLE.deadline),
      );

      ticks.forEach((tk, i) => {
        const cx = baseX + i * dx;
        const revealed = i < 3 || show30;
        const startR = i * perWave + 1;
        const endR = (i + 1) * perWave;
        const col = i === 3 ? (fiveWarm ? ROLE.warm : ROLE.expired) : ROLE.active;
        nodes.push(
          rect(190, 76, {
            fill: revealed ? '#102138' : '#0c1324',
            stroke: revealed ? col : '#33466d',
            width: 2.4,
            radius: 12,
            ...(revealed ? {} : { dash: [6, 6] }),
          })
            .at(cx, yRow)
            .glow(revealed ? 7 : 0, col),
          txt(
            revealed ? `R${startR}..R${endR}` : '???',
            cx,
            yRow,
            26,
            revealed ? col : COSMOS.dim,
            'mono',
          ),
          txt(`${tk}s`, cx, yRow + 68, 26, COSMOS.muted, 'mono'),
        );
      });

      if (st >= 4.5) {
        nodes.push(
          txt('R100 -> 40s end', baseX + 3 * dx, yRow + 114, 26, ROLE.focus, 'mono').glow(
            7,
            ROLE.focus,
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, synthView, header, dyn);
  orbitScene(s, c, synthView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 7.0, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0: Q1
  c.on('three-starts', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('three-starts').start, 0.3) }));
  });
  // Beat 1: Q1 Reveal (AFTER)
  c.after('four-short', () => {
    s.play(step.to(2, { duration: clampDur(c, c.cue('four-short').end, 0.3) }));
  });
  // Beat 2: Q2 (add 5th GPU, ask where R100 lands; DO NOT reveal t=30s!)
  c.on('fifth-ready', () => {
    const t = c.cue('fifth-ready').start;
    s.play(step.to(3, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu5, 0.4);
  });
  c.on('fill-again', () => {
    s.play(step.to(4, { duration: clampDur(c, c.cue('fill-again').start, 0.3) }));
  });
  // Beat 3: Q2 Reveal (STRICTLY AFTER hundred-starts)
  c.show('hundred-starts', sizeEq, { after: true });
  c.after('hundred-starts', () => {
    s.play(step.to(5, { duration: clampDur(c, c.cue('hundred-starts').end, 0.3) }));
  });
}
