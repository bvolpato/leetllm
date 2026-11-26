// Scene 19: synthesis - Dual glowing oscilloscope memory traces distinguishing temporary vs leaked copies.
import {
  COMPACT_MIB,
  COSMOS,
  PEAK_MIB,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowRing,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  playCue,
  rule,
  runPhase,
  txt,
} from '../parts.mjs';

export default function synthesis(s, c) {
  const phase = s.value(0);
  const showAsk = s.value(0);
  const showShort = s.value(0);
  const showLong = s.value(0);
  const showPeakNote = s.value(0);
  const gateStep = s.value(0); // 1=parity, 2=quality, 3=device

  const title = heroTitle(['Where did the', 'extra memory go?'], {
    x: -855,
    y: -445,
    size: 50,
    lineHeight: 58,
    accent: ROLE.gold,
    eyebrow: 'PROFILING MEMORY TRACES · RELEASE VERIFICATION',
  });

  const live = guardedDynamic(1, () => {
    const ph = phase.value;
    const ask = showAsk.value;
    const sh = showShort.value;
    const lg = showLong.value;
    const pk = showPeakNote.value;
    const gs = Math.round(gateStep.value);

    const nodes = [
      txt(
        'LIVE KV ARRAYS (MiB · ONE LAYER) · SAME 5 MiB PEAK',
        -855,
        -268,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    const trLeft = -620;
    const trRight = 540;
    const trW = trRight - trLeft;
    const xAt = (u) => trLeft + u * trW;

    const lanes = [
      {
        name: 'Trace 1',
        baseY: -50,
        h: 145,
        drop: true,
        rev: sh,
        col: ROLE.value,
        afterVal: COMPACT_MIB,
      },
      {
        name: 'Trace 2',
        baseY: 185,
        h: 145,
        drop: false,
        rev: lg,
        col: ROLE.alert,
        afterVal: PEAK_MIB,
      },
    ];

    for (const ln of lanes) {
      const yAt = (mib) => ln.baseY - (mib / PEAK_MIB) * ln.h;

      // Baseline + subtle 1 MiB & 5 MiB gridlines
      nodes.push(
        txt(ln.name, -855, ln.baseY - ln.h * 0.5, 36, COSMOS.ink, 'mono', 'left'),
        line([trLeft, ln.baseY], [trRight, ln.baseY], { stroke: '#31426b', width: 2 }),
        line([trLeft, yAt(PEAK_MIB)], [trRight, yAt(PEAK_MIB)], {
          stroke: '#223054',
          width: 1.2,
          dash: [6, 6],
        }),
        // Common prefix: Before (1 MiB) -> In attention (5 MiB peak)
        glowingTrail(
          [
            [xAt(0), yAt(COMPACT_MIB)],
            [xAt(0.24), yAt(COMPACT_MIB)],
            [xAt(0.24), yAt(PEAK_MIB)],
            [xAt(0.68), yAt(PEAK_MIB)],
          ],
          { color: ROLE.key, width: 5, glow: 9 },
        ),
        txt(`${PEAK_MIB} MiB peak`, 585, ln.baseY - ln.h * 0.72, 30, COSMOS.muted, 'mono', 'left'),
      );

      // Vertical gold return line on 'ask'
      if (ask > 0.02) {
        const retX = xAt(0.68);
        nodes.push(
          line([retX, ln.baseY + 8], [retX, yAt(PEAK_MIB) - 18], {
            stroke: ROLE.gold,
            width: 3,
            dash: [7, 6],
          })
            .glow(7, ROLE.gold)
            .opacity(ask),
        );
        if (ln.rev < 0.05) {
          nodes.push(
            txt('? after return', xAt(0.84), ln.baseY - ln.h * 0.5, 30, ROLE.gold, 'mono', 'center')
              .glow(7, ROLE.gold)
              .opacity(ask),
          );
        }
      }

      // Post-return tail (strictly withheld until c.after('short') & c.after('long')!)
      if (ln.rev > 0.02) {
        const tailPts = ln.drop
          ? [
              [xAt(0.68), yAt(PEAK_MIB)],
              [xAt(0.68), yAt(ln.afterVal)],
              [xAt(0.68 + 0.32 * ln.rev), yAt(ln.afterVal)],
            ]
          : [
              [xAt(0.68), yAt(PEAK_MIB)],
              [xAt(0.68 + 0.32 * ln.rev), yAt(ln.afterVal)],
            ];
        const endPt = tailPts.at(-1);
        nodes.push(
          glowingTrail(tailPts, { color: ln.col, width: 5.5, glow: 11, opacity: ln.rev }),
          glowDot(endPt[0], endPt[1], { radius: 8, color: ln.col, glow: 13, opacity: ln.rev }),
          txt(`${ln.afterVal} MiB live`, 585, ln.baseY - ln.h * 0.25, 34, ln.col, 'mono', 'left')
            .glow(7, ln.col)
            .opacity(ln.rev),
          txt(
            ln.drop ? 'copies released' : 'copies still live!',
            xAt(0.84),
            ln.drop ? yAt(COMPACT_MIB) - 34 : yAt(PEAK_MIB) + 42,
            26,
            ln.col,
            'sans',
            'center',
          ).opacity(ln.rev),
        );
      }
    }

    // Time phase axis labels beneath Trace 2
    const phaseY = 236;
    nodes.push(
      txt('Before call', xAt(0.12), phaseY, 26, COSMOS.muted, 'mono', 'center'),
      txt('In attention', xAt(0.46), phaseY, 26, COSMOS.muted, 'mono', 'center'),
      txt('After return', xAt(0.84), phaseY, 26, ROLE.gold, 'mono', 'center'),
    );

    // Subtle animated scan dot along the 5 MiB plateau
    const scanU = 0.24 + ((ph * 0.25) % 1) * 0.44;
    nodes.push(
      glowDot(xAt(scanU), -50 - 145, { radius: 5, color: ROLE.query, glow: 10 }),
      glowDot(xAt(scanU), 185 - 145, { radius: 5, color: ROLE.query, glow: 10 }),
    );

    // Bottom 3-pillar floating verification checklist (glowing orbital rings, ZERO prose boxes!)
    nodes.push(rule(-855, 290, 855, 290, COSMOS.rule, 1.5).opacity(0.6));
    if (gs === 0) {
      const cap =
        pk > 0.5
          ? 'Same 5 MiB peak: inspect retained shapes'
          : ask > 0.5
            ? 'Look just after return: were copies freed?'
            : 'Peak memory alone cannot separate temporary copies from retained state';
      nodes.push(
        txt(cap, 0, 380, 30, ask > 0.5 && pk < 0.5 ? ROLE.gold : COSMOS.muted, 'sans', 'center'),
      );
    } else {
      const pillars = [
        {
          idx: 1,
          x: -575,
          label: '1. Output parity',
          sub: '1-token & chunk vs full-prefix',
          col: ROLE.query,
        },
        {
          idx: 2,
          x: 0,
          label: '2. Task quality',
          sub: 'held-out eval vs quality limit',
          col: ROLE.value,
        },
        {
          idx: 3,
          x: 575,
          label: '3. Rank copies',
          sub: 'physical copies per TP rank',
          col: ROLE.gold,
        },
      ];
      for (const p of pillars) {
        const on = gs >= p.idx;
        const op = on ? 1 : 0.28;
        nodes.push(
          glowRing(p.x - 165, 378, 24, p.col, {
            width: on ? 3 : 1.8,
            glow: on ? 9 : 2,
            opacity: op,
          }),
          txt(String(p.idx), p.x - 165, 378, 26, p.col, 'mono', 'center').opacity(op),
          txt(
            p.label.slice(3),
            p.x - 122,
            358,
            30,
            on ? p.col : COSMOS.muted,
            'serif',
            'left',
          ).opacity(op),
          txt(p.sub, p.x - 122, 400, 26, COSMOS.muted, 'sans', 'left').opacity(op),
        );
      }
    }

    return group(...nodes);
  });

  s.add(cinemaAtmosphere(ROLE.gold, ROLE.value), title, live);
  runPhase(s, c, phase, 14);

  playCue(s, c, 'ask', (d) => s.play(showAsk.to(1, { duration: d })), { dur: 0.45 });
  playCue(s, c, 'short', (d) => s.play(showShort.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'long', (d) => s.play(showLong.to(1, { duration: d })), {
    after: true,
    dur: 0.6,
  });
  playCue(s, c, 'peak', (d) => s.play(showPeakNote.to(1, { duration: d })), {
    after: true,
    dur: 0.4,
  });
  playCue(s, c, 'parity', (d) => s.play(gateStep.to(1, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'quality', (d) => s.play(gateStep.to(2, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
  playCue(s, c, 'device', (d) => s.play(gateStep.to(3, { duration: Math.min(0.25, d) })), {
    dur: 0.3,
  });
}
