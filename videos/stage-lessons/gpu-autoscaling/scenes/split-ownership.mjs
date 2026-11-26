// Scene 33: split-ownership - Transfer compatible KV between phase-specific pools
// Beat 0: Dual-SLO Pareto scatter plot (TTFT <= 1500ms, TPOT <= 60ms) with Short chat (820,44),
//         Decode pressure (800,90), and Policy surge (2450,93).
// Beats 1-2: 3D Prefill-Pool -> KV Transfer Bridge (NVLink/RDMA + layout check) -> Decode-Pool
//            with readiness gate, cancellation release, backpressure, and DistServe/Splitwise/Dynamo sizing.
import { gridPlane3d, group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  addBox3D,
  addPointerArc3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  dashedRule,
  driftValue,
  fadeInHalf,
  fadeInNodes,
  fadeOutHalf,
  glowDot,
  guardedDynamic,
  hideNodes,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function splitOwnership(s, c) {
  const pulse = s.value(0);
  const mode = s.value(0); // 0=Pareto dual-SLO scatter, 1=3D Disaggregated Prefill->KV->Decode pools
  const subStep = s.value(0); // 1=joint gate highlight, 2=transfer ready, 3=cancel/backpressure, 4=Dynamo sizing

  const header = cinemaHeader(
    'PREFILL-DECODE DISAGGREGATION',
    'Transfer compatible KV',
    'across phase pools',
    {
      x: -860,
      y: -420,
      accent: ROLE.decode,
      size: 52,
    },
  );

  const bgAura = aura(240, 30, 660, '#5ce1e61e', '#a78bfa22');

  // 3D Prefill -> KV Bridge -> Decode Pools (shown cleanly when mode transitions to 1!)
  const splitView = cinematic3d({
    theta: -0.78,
    phi: 1.0,
    distance: 15.8,
    unit: 112,
    focus: [0, 0, 0.9],
  }).at(285, 30);

  splitView.add(
    gridPlane3d({
      x: [-3.8, 3.8],
      y: [-2.4, 2.4],
      z: 0,
      step: 1.2,
      color: '#25395e',
      width: 1.2,
      opacity: 0.5,
    }),
  );

  const poolObjs = [];
  // Left 3D Prefill Pool (2 cyan monoliths)
  for (let i = 0; i < 2; i++) {
    poolObjs.push(
      ...addBox3D(
        splitView,
        -3.2,
        -1.55 + i * 1.75,
        0.06,
        1.5,
        1.35,
        1.35,
        ROLE.active,
        ROLE.active,
        {
          faceOpacity: 0.84,
          edgeWidth: 2.3,
          edgeGlow: 8,
        },
      ),
    );
  }
  // Right 3D Decode Pool (3 violet monoliths)
  for (let i = 0; i < 3; i++) {
    poolObjs.push(
      ...addBox3D(
        splitView,
        1.55,
        -2.0 + i * 1.48,
        0.06,
        1.45,
        1.12,
        1.15,
        ROLE.decode,
        ROLE.decode,
        {
          faceOpacity: 0.84,
          edgeWidth: 2.3,
          edgeGlow: 8,
        },
      ),
    );
  }
  // Glowing 3D KV Transfer Arcs (NVLink / RDMA) carrying initial KV tensors + metadata
  for (let i = 0; i < 3; i++) {
    poolObjs.push(
      ...addPointerArc3D(
        splitView,
        [-1.7, i === 0 ? -0.88 : 0.88, 1.05],
        [1.55, -1.44 + i * 1.48, 0.95],
        ROLE.focus,
        { lift: 0.95, pulseVal: pulse, phaseOffset: i * 0.33 },
      ),
    );
  }
  hideNodes(poolObjs);
  splitView.hide();

  // Mode 0: Dual-SLO Pareto Scatter Plot (TTFT <= 1500 ms, TPOT <= 60 ms)
  const paretoLayer = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const x0 = -360;
      const x1 = 780;
      const yBot = 285;
      const yTop = -230;
      const px = (ttft) => x0 + (ttft / 2800) * (x1 - x0);
      const py = (tpot) => yBot - (tpot / 110) * (yBot - yTop);
      const gx = px(1500);
      const gy = py(60);

      const nodes = [
        txt('MIXED POOL DUAL-SLO TEST', -860, -185, 26, ROLE.focus, 'mono', 'left').opacity(a),
        txt('TTFT target <= 1,500 ms', -860, -125, 28, ROLE.active, 'mono', 'left').opacity(a),
        txt('TPOT target <= 60 ms', -860, -68, 28, ROLE.decode, 'mono', 'left').opacity(a),
        txt('First tune chunking,', -860, 18, 26, COSMOS.muted, 'sans', 'left').opacity(a),
        txt('prefix & batching', -860, 62, 26, COSMOS.muted, 'sans', 'left').opacity(a),

        // Shaded Passing Quadrant (lower-left: TTFT <= 1500 & TPOT <= 60)
        rect(gx - x0, yBot - gy, { fill: '#0e2b25', stroke: ROLE.warm, width: 2.2, radius: 6 })
          .at((x0 + gx) * 0.5, (gy + yBot) * 0.5)
          .opacity(0.62 * a),
        txt('PASS ZONE', (x0 + gx) * 0.5, yBot - 36, 26, ROLE.warm, 'mono').opacity(a),

        // Axes & SLO Gate Lines
        dashedRule(x0, yBot, x1, yBot, '#3a4f7a', 0.8 * a, 2.2),
        dashedRule(x0, yBot, x0, yTop, '#3a4f7a', 0.8 * a, 2.2),
        dashedRule(gx, yTop, gx, yBot, ROLE.deadline, 0.9 * a, 2.8),
        dashedRule(x0, gy, x1, gy, ROLE.deadline, 0.9 * a, 2.8),
        txt('1,500 ms', gx, yBot + 36, 26, ROLE.deadline, 'mono').opacity(a),
        txt('60 ms', x0 - 65, gy, 26, ROLE.deadline, 'mono').opacity(a),
        txt('TTFT (ms)', (x0 + x1) * 0.5, yBot + 82, 26, COSMOS.muted, 'mono').opacity(a),
        txt('TPOT', x0 - 65, yTop, 26, COSMOS.muted, 'mono').opacity(a),
      ];

      for (const wl of DATA.splitWorkloads) {
        const cx = px(wl.ttft);
        const cy = py(wl.tpot);
        const col = wl.pass ? ROLE.warm : ROLE.expired;
        const isPolicy = wl.ttft > 2000;
        const shortName = isPolicy ? 'Policy' : wl.pass ? 'Short chat' : 'Decode';
        const ly = isPolicy ? cy + 42 : cy - 36;
        nodes.push(
          glowDot(cx, cy, { radius: 13, color: col, glow: 14, opacity: a }),
          txt(`${shortName} (${wl.ttft}, ${wl.tpot})`, cx, ly, 26, col, 'mono', 'center')
            .glow(wl.pass && subStep.value >= 0.8 ? 8 : 4, col)
            .opacity(a),
        );
      }

      if (subStep.value >= 0.8) {
        nodes.push(
          txt('Only Short Chat passes', -860, 140, 28, ROLE.warm, 'sans', 'left')
            .glow(6, ROLE.warm)
            .opacity(a),
          txt('-> evaluate phase split', -860, 192, 28, ROLE.focus, 'mono', 'left').opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  // Mode 1: Left readouts framing the 3D Prefill -> KV -> Decode architecture
  const splitLayer = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const ss = subStep.value;
      const nodes = [
        txt('PREFILL POOL  -->  KV TRANSFER  -->  DECODE POOL', 285, -402, 26, ROLE.focus, 'mono')
          .glow(5, ROLE.focus)
          .opacity(a),
        txt(
          'CYAN: PREFILL · GOLD: KV TENSORS + METADATA · VIOLET: DECODE',
          285,
          438,
          26,
          COSMOS.muted,
          'mono',
        ).opacity(a),
        txt('HANDOFF CONTRACT', -860, -190, 26, ROLE.focus, 'mono', 'left').opacity(a),
        txt(
          'Model · dtype · block size · layout match',
          -860,
          -132,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(a),
      ];

      if (ss >= 1.8) {
        nodes.push(
          txt('Decode readiness verified before consume', -860, -64, 28, ROLE.warm, 'mono', 'left')
            .glow(6, ROLE.warm)
            .opacity(a),
        );
      }
      if (ss >= 2.8) {
        nodes.push(
          txt('Cancel / timeout frees BOTH sides', -860, 16, 28, ROLE.expired, 'mono', 'left')
            .glow(6, ROLE.expired)
            .opacity(a),
          txt(
            'Backpressure reaches router before overload',
            -860,
            74,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ).opacity(a),
        );
      }
      if (ss >= 3.8) {
        nodes.push(
          txt('DISTSERVE · SPLITWISE · DYNAMO', -860, 178, 26, ROLE.active, 'mono', 'left')
            .glow(6, ROLE.active)
            .opacity(a),
          txt(
            'Size prefill from prompts & TTFT',
            -860,
            236,
            26,
            ROLE.active,
            'sans',
            'left',
          ).opacity(a),
          txt(
            'Size decode from streams, KV & TPOT',
            -860,
            290,
            26,
            ROLE.decode,
            'sans',
            'left',
          ).opacity(a),
          txt(
            'Include KV transfer time in replay!',
            -860,
            348,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(a),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, splitView, header, paretoLayer, splitLayer);
  orbitScene(s, c, splitView, { theta: -0.22, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 6.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('ga-split-ownership-b0', () => {
    s.play(subStep.to(0.2, { duration: clampDur(c, c.cue('ga-split-ownership-b0').start, 0.25) }));
  });
  c.on('ga-joint-service-gate', () => {
    s.play(subStep.to(1, { duration: clampDur(c, c.cue('ga-joint-service-gate').start, 0.3) }));
  });
  c.on('ga-split-ownership-b1', () => {
    const t = c.cue('ga-split-ownership-b1').start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.4) }));
    splitView.show();
    fadeInNodes(s, c, t, poolObjs, 0.45);
  });
  c.on('ga-transfer-ready', () => {
    s.play(subStep.to(2, { duration: clampDur(c, c.cue('ga-transfer-ready').start, 0.3) }));
  });
  c.on('ga-transfer-cancel', () => {
    s.play(subStep.to(3, { duration: clampDur(c, c.cue('ga-transfer-cancel').start, 0.3) }));
  });
  c.on('ga-split-ownership-b2', () => {
    s.play(subStep.to(4, { duration: clampDur(c, c.cue('ga-split-ownership-b2').start, 0.35) }));
  });
}
