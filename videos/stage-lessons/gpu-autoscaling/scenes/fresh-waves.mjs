// Scene 38: fresh-waves - The last start moves
// Transfer challenge on a 6s clock: 72 requests, 4 slots/GPU, cold=120s.
// Strict prediction withholding on BOTH transfers:
//   Q1 (beat 0): 18s gate (waves 0, 6, 12, 18 -> 16/GPU) -> reveals 4 GPUs=64/8 expired, 5 GPUs=all 72 AFTER ga-fresh-four / try-five / ga-fresh-five!
//   Q2 (beat 2): Gate moves 18s -> 12s -> reveals R61..R72 lost (60/12), 6 GPUs=all 72, R72 -> GPU 6 @ 12s AFTER ga-fresh-five-short / ga-fresh-six / track-last-request!
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
  freshBurstSchedules,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function freshWaves(s, c) {
  const phase = s.value(0);
  const step = s.value(0); // 1=Q1(18s), 2=4->64/8(AFTER), 3=5th GPU(AFTER), 4=5->72(AFTER), 5=Q2(12s gate), 6=5->60/12(AFTER), 7=6->72(AFTER), 8=R72->GPU6@12s(AFTER)

  const header = cinemaHeader('YOUR TURN  ·  NEW CLOCK', 'The last start', 'moves inward', {
    x: -860,
    y: -420,
    accent: ROLE.predict,
    size: 52,
  });

  const bgAura = aura(300, 25, 630, '#ffd16622', '#6ee7b71c');

  // 3D 4 -> 5 -> 6 Warm GPU Cluster on right
  const waveView = cinematic3d({
    theta: -0.8,
    phi: 1.0,
    distance: 18.2,
    unit: 86,
    focus: [0, 0, 0.85],
  }).at(340, -170);

  waveView.add(
    gridPlane3d({
      x: [-4.0, 4.0],
      y: [-2.2, 2.2],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  for (let i = 0; i < 4; i++) {
    addBox3D(waveView, -3.7 + i * 1.25, -0.95, 0.05, 0.96, 1.9, 1.25, ROLE.active, ROLE.active, {
      faceOpacity: 0.82,
      edgeWidth: 2.1,
      edgeGlow: 7,
    });
  }
  const gpu5 = hideNodes(
    addBox3D(waveView, 1.3, -0.95, 0.05, 0.96, 1.9, 1.35, ROLE.warm, ROLE.warm, {
      faceOpacity: 0.86,
      edgeWidth: 2.4,
      edgeGlow: 9,
    }),
  );
  const gpu6 = hideNodes(
    addBox3D(waveView, 2.55, -0.95, 0.05, 0.96, 1.9, 1.48, ROLE.focus, ROLE.focus, {
      faceOpacity: 0.9,
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
      const shorterGate = st >= 4.5;
      const gpus = st >= 6.5 ? 6 : st >= 2.5 ? 5 : 4;

      const nodes = [
        txt(
          `${gpus} WARM GPUs · 4 SLOTS EACH · 6s HOLD (COLD 120s)`,
          340,
          -435,
          26,
          gpus === 6 ? ROLE.focus : gpus === 5 ? ROLE.warm : ROLE.active,
          'mono',
        ).glow(5, gpus === 6 ? ROLE.focus : ROLE.warm),
        txt('FRESH QUEUE:  72 REQUESTS AT t = 0', -860, -195, 28, COSMOS.ink, 'mono', 'left'),
        txt(
          shorterGate ? 'NEW START GATE:  12 s  (was 18 s)' : 'START GATE:  18 s  (inclusive)',
          -860,
          -138,
          28,
          shorterGate ? ROLE.expired : ROLE.deadline,
          'mono',
          'left',
        ).glow(6, shorterGate ? ROLE.expired : ROLE.deadline),
      ];

      // Q1 Prediction (Beat 0 hold: NO answers!)
      if (st >= 0.5 && st < 1.5) {
        nodes.push(
          txt(
            'PREDICT: Smallest warm pool for all 72?',
            -860,
            -35,
            30,
            ROLE.predict,
            'sans',
            'left',
          )
            .glow(8, ROLE.predict)
            .opacity(blink),
          txt('Count refills on 6s clock through 18s', -860, 26, 26, COSMOS.muted, 'sans', 'left'),
        );
      }

      // Q1 Reveal (Beat 1 AFTER cues)
      if (st >= 1.5 && st < 4.5) {
        const s4 = freshBurstSchedules.four;
        nodes.push(
          txt(
            `4 GPUs -> ${s4.admitted} start · ${s4.expired} expire`,
            -860,
            -35,
            28,
            ROLE.expired,
            'mono',
            'left',
          ),
          txt(
            '4 waves (0,6,12,18s) x 4 slots = 16 / GPU',
            -860,
            22,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
        if (st >= 3.5) {
          nodes.push(
            txt(
              '5 GPUs -> ALL 72 START! (R72 @ GPU 3, 18s)',
              -860,
              86,
              28,
              ROLE.warm,
              'mono',
              'left',
            ).glow(8, ROLE.warm),
          );
        }
      }

      // Q2 Prediction (Beat 2 hold: gate moves to 12s, withhold R61..R72 & 6 GPUs!)
      if (st >= 4.5 && st < 5.5) {
        nodes.push(
          txt('GATE MOVES: 18 s -> 12 s (5 GPUs kept)', -860, -35, 28, ROLE.focus, 'mono', 'left'),
          txt('PREDICT: Who loses their start?', -860, 32, 30, ROLE.predict, 'sans', 'left')
            .glow(8, ROLE.predict)
            .opacity(blink),
          txt('And how many warm GPUs are needed now?', -860, 88, 28, ROLE.predict, 'sans', 'left')
            .glow(7, ROLE.predict)
            .opacity(blink),
        );
      }

      // Q2 Reveal (Beat 3 AFTER cues)
      if (st >= 5.5) {
        const s5s = freshBurstSchedules.fiveShort;
        nodes.push(
          txt(
            `5 GPUs @ 12s -> ${s5s.admitted} start · R61..R72 lost`,
            -860,
            -35,
            28,
            ROLE.expired,
            'mono',
            'left',
          ),
        );
        if (st >= 6.5) {
          nodes.push(
            txt('6 GPUs -> ALL 72 START BY 12 s!', -860, 26, 30, ROLE.warm, 'mono', 'left').glow(
              8,
              ROLE.warm,
            ),
          );
        }
        if (st >= 7.5) {
          nodes.push(
            txt(
              'R72 shifts: (GPU 3, 18s) -> (GPU 6, 12s)',
              -860,
              92,
              28,
              ROLE.focus,
              'mono',
              'left',
            ).glow(8, ROLE.focus),
            txt(
              'Size warm pool from deadline waves, then benchmark',
              -860,
              152,
              26,
              COSMOS.muted,
              'sans',
              'left',
            ),
          );
        }
      }

      // Wave timeline across lower canvas (0s, 6s, 12s, 18s)
      const baseX = -50;
      const dx = 225;
      const yRow = 285;
      const ticks = [0, 6, 12, 18];
      const gateIdx = shorterGate ? 2 : 3;
      const gateX = baseX + gateIdx * dx + 112;

      nodes.push(
        dashedRule(gateX, 205, gateX, 395, shorterGate ? ROLE.expired : ROLE.deadline, 0.94, 3.2),
        txt(
          shorterGate ? '12s GATE' : '18s GATE',
          gateX,
          174,
          26,
          shorterGate ? ROLE.expired : ROLE.deadline,
          'mono',
        ).glow(7, shorterGate ? ROLE.expired : ROLE.deadline),
      );

      ticks.forEach((tk, i) => {
        const cx = baseX + i * dx;
        const pastGate = shorterGate && i === 3;
        const perWave = gpus * 4;
        const startR = i * perWave + 1;
        const endR = Math.min(72, (i + 1) * perWave);
        const showNums =
          (st >= 1.5 && st < 4.5) ||
          (st >= 5.5 && !pastGate) ||
          (st >= 5.5 && st < 6.5 && pastGate);
        const col = pastGate
          ? st >= 6.5
            ? COSMOS.dim
            : ROLE.expired
          : i === gateIdx
            ? ROLE.warm
            : ROLE.active;
        const label =
          pastGate && st >= 6.5
            ? 'unused'
            : !showNums
              ? pastGate
                ? 'CUT?'
                : '???'
              : pastGate && st < 6.5
                ? 'R61..72 X'
                : startR <= 72
                  ? `R${startR}..R${endR}`
                  : 'done';

        nodes.push(
          rect(190, 76, {
            fill: pastGate ? '#2a1220' : showNums ? '#102138' : '#0c1324',
            stroke: showNums || pastGate ? col : '#33466d',
            width: 2.4,
            radius: 12,
            ...(showNums ? {} : { dash: [6, 6] }),
          })
            .at(cx, yRow)
            .glow(showNums ? 7 : 0, col),
          txt(label, cx, yRow, 26, showNums || pastGate ? col : COSMOS.dim, 'mono'),
          txt(`${tk}s`, cx, yRow + 68, 26, COSMOS.muted, 'mono'),
        );
      });

      return group(...nodes);
    },
  );

  s.add(bgAura, waveView, header, dyn);
  orbitScene(s, c, waveView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, phase, 7.5, { startOffset: 0.1, endMargin: 0.5 });

  // Beat 0: Q1 (18s gate: NO reveal!)
  c.on('fresh-input', () => {
    s.play(step.to(1, { duration: clampDur(c, c.cue('fresh-input').start, 0.3) }));
  });

  // Beat 1: Q1 Reveals (STRICTLY AFTER)
  c.after('ga-fresh-four', () => {
    s.play(step.to(2, { duration: clampDur(c, c.cue('ga-fresh-four').end, 0.3) }));
  });
  c.after('try-five', () => {
    const t = c.cue('try-five').end;
    s.play(step.to(3, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu5, 0.35);
  });
  c.after('ga-fresh-five', () => {
    s.play(step.to(4, { duration: clampDur(c, c.cue('ga-fresh-five').end, 0.3) }));
  });

  // Beat 2: Q2 (12s gate: NO reveal!)
  c.on('shorter-gate', () => {
    s.play(step.to(5, { duration: clampDur(c, c.cue('shorter-gate').start, 0.3) }));
  });

  // Beat 3: Q2 Reveals (STRICTLY AFTER)
  c.after('ga-fresh-five-short', () => {
    s.play(step.to(6, { duration: clampDur(c, c.cue('ga-fresh-five-short').end, 0.3) }));
  });
  c.after('ga-fresh-six', () => {
    const t = c.cue('ga-fresh-six').end;
    s.play(step.to(7, { duration: clampDur(c, t, 0.3) }));
    fadeInNodes(s, c, t, gpu6, 0.35);
  });
  c.after('track-last-request', () => {
    s.play(step.to(8, { duration: clampDur(c, c.cue('track-last-request').end, 0.3) }));
  });
}
