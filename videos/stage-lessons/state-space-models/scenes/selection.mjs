// Scene 08: selection: Input-dependent selective updates on [3, 1, 4, 2] + zero vs four stability probes.
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  group,
  guardedDynamic,
  heroTitle,
  lumBar,
  playCue,
  selective,
  selectiveCoefficients,
  swapVis,
  txt,
} from '../parts.mjs';

export default function selection(s, c) {
  const view1Vis = s.value(1);
  const view2Vis = s.value(0);
  const focusStep = s.value(1); // 1 (x=1) -> 2 (x=4) -> 3 (x=2)
  const showReadout = s.value(0);
  const probeStep = s.value(1); // 1 = x=0, 2 = x=4

  const bgAura = aura(0, 0, 740, '#3a1a3626', '#103c3618');
  const title = heroTitle(['Selective State Space:', 'let input choose the update'], {
    x: -855,
    y: -430,
    size: 50,
    lineHeight: 58,
    accent: ROLE.delta,
  });

  // View 1: Selective trace comparing x=3, x=1, x=4, x=2
  const view1 = guardedDynamic(view1Vis, (alpha) => {
    const fs = Math.round(focusStep.value);
    const rd = showReadout.value;
    const maxW = 520;
    const barX = -260;
    const nodes = [
      txt('CARRY (a·h_{t-1})', barX, -210, 26, ROLE.carry, 'mono', 'left').opacity(alpha),
      txt('+ SELECTIVE WRITE', barX + 275, -210, 26, ROLE.write, 'mono', 'left').opacity(alpha),
    ];

    selective.forEach((row, idx) => {
      const y = -125 + idx * 108;
      const oldH = idx === 0 ? 0 : selective[idx - 1].h;
      const carry = row.a * oldH;
      const write = row.write;
      const isFocus = idx === fs;
      const carryW = (carry / 1.8) * maxW;
      const writeW = (write / 1.8) * maxW;
      const rowAlpha = (idx <= Math.max(2, fs) ? 1 : 0.35) * alpha;

      nodes.push(
        txt(
          `x=${row.x}  (a=${row.a.toFixed(2)}, c=${row.c.toFixed(2)})`,
          -855,
          y,
          28,
          isFocus ? ROLE.delta : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(isFocus ? 6 : 0, ROLE.delta)
          .opacity(rowAlpha),
      );
      if (carry > 0.005) {
        nodes.push(lumBar(barX, y, carryW, 34, ROLE.carry, { opacity: rowAlpha }));
      }
      nodes.push(
        lumBar(barX + carryW, y, writeW, 34, ROLE.write, { opacity: rowAlpha }),
        txt(
          rd > 0.3 && idx === 2
            ? `h=${row.h.toFixed(2)}  →  y=${row.y.toFixed(2)}`
            : `h=${row.h.toFixed(2)}  (w=${write.toFixed(2)})`,
          barX + carryW + writeW + 26,
          y,
          28,
          idx === 2 ? ROLE.state : COSMOS.ink,
          'mono',
          'left',
        )
          .glow(idx === 2 ? 8 : 0, ROLE.state)
          .opacity(rowAlpha),
      );
    });

    nodes.push(
      txt(
        `x=1 keeps ${(selective[1].a * 100).toFixed(0)}% (+${selective[1].write.toFixed(2)}); x=4 writes +${selective[2].write.toFixed(2)} → h=${selective[2].h.toFixed(2)}, y=${selective[2].y.toFixed(2)}`,
        -855,
        345,
        26,
        ROLE.read,
        'mono',
        'left',
      ).opacity(alpha),
    );
    return group(...nodes);
  });

  // View 2: Diagnostic stability probes from h=1 (send x=0 vs send x=4)
  const c0 = selectiveCoefficients(0);
  const c4 = selectiveCoefficients(4);
  const view2 = guardedDynamic(view2Vis, (alpha) => {
    const ps = Math.round(probeStep.value);
    const maxW = 680;
    const barX = -430;
    const nodes = [
      txt(
        'STABILITY PROBES STARTING FROM h = 1.0',
        -855,
        -215,
        28,
        ROLE.delta,
        'mono',
        'left',
      ).opacity(alpha),
      // Probe 1: x = 0 -> write = 0, state = a_0 < 1.0
      txt('Probe A: x = 0', -855, -90, 32, ROLE.carry, 'mono', 'left').opacity(alpha),
      lumBar(barX, -90, (c0.a / 2.0) * maxW, 38, ROLE.carry, { opacity: alpha, maxTrackW: maxW }),
      txt(
        `carry ${c0.a.toFixed(3)} + 0  (< 1.0)`,
        barX + maxW + 30,
        -90,
        28,
        ROLE.carry,
        'mono',
        'left',
      ).opacity(alpha),
    ];

    const h4 = c4.a * 1 + c4.write;
    const cW = (c4.a / 2.0) * maxW;
    const wW = (c4.write / 2.0) * maxW;
    const aB = (ps >= 2 ? 1 : 0.28) * alpha;
    nodes.push(
      txt(
        'Probe B: x = 4',
        -855,
        65,
        32,
        ps >= 2 ? ROLE.write : COSMOS.dim,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barX, 65, ps >= 2 ? cW : 16, 38, ROLE.carry, {
        opacity: aB,
        maxTrackW: ps >= 2 ? 0 : maxW,
      }),
    );
    if (ps >= 2) {
      nodes.push(
        lumBar(barX + cW, 65, wW, 38, ROLE.write, { opacity: alpha }),
        txt(
          `${c4.a.toFixed(2)} + ${c4.write.toFixed(2)} = ${h4.toFixed(2)}  (> 1.0)`,
          barX + cW + wW + 30,
          65,
          28,
          ROLE.write,
          'mono',
          'left',
        )
          .glow(8, ROLE.write)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          'reset to 1.0, next probe pending',
          barX + maxW + 30,
          65,
          26,
          COSMOS.dim,
          'mono',
          'left',
        ).opacity(alpha),
      );
    }
    nodes.push(
      txt(
        'Zero input tests decay stability (A < 0, Δ > 0); nonzero input verifies content-dependent write',
        -855,
        245,
        28,
        ROLE.state,
        'sans',
        'left',
      ).opacity((ps >= 2 ? 1 : 0.45) * alpha),
    );
    return group(...nodes);
  });

  s.add(bgAura, title, view1, view2);
  playCue(s, c, 'selective-write', (d) => s.play(focusStep.to(2, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'selective-readout', (d) => s.play(showReadout.to(1, { duration: d })), {
    dur: 0.45,
  });
  playCue(s, c, 'decay-and-replace', (d) => s.play(focusStep.to(3, { duration: d })), {
    dur: 0.45,
  });

  playCue(s, c, 'probe-zero', (d) => s.play(swapVis(view1Vis, view2Vis, d)), { dur: 0.6 });
  playCue(s, c, 'probe-four', (d) => s.play(probeStep.to(2, { duration: d })), { dur: 0.45 });
  bindCueBeat(s, c, s.value(0), [
    'selective-coefficients',
    'input-activation',
    'selective-carry',
    'ssm-selective-state',
    'ssm-selective-readout',
    'preserve-evidence',
    'probe-write',
  ]);
}
