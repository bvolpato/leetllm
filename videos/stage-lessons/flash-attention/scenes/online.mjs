// Scene 09: What survives the first tile?: Dual-track online-softmax accumulation for Tile 1 (fix, this).
import {
  COSMOS,
  SCORES,
  TILE_A,
  TILE_A_OUTPUT,
  VALUES,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

const W_FIX = Math.exp(SCORES[0] - TILE_A.m); // e^-1 ≈ 0.3679
const W_THIS = Math.exp(SCORES[1] - TILE_A.m); // 1.0
const V_FIX = W_FIX * VALUES[0]; // 3.679
const V_THIS = W_THIS * VALUES[1]; // 20.0

export default function online(s, c) {
  const phase = s.value(0);
  const showRef = s.value(0);
  const showWFix = s.value(0);
  const showWThis = s.value(0);
  const fixOnW = s.value(0);
  const fixOnV = s.value(0);
  const thisOnW = s.value(0);
  const thisOnV = s.value(0);
  const showAvg = s.value(0);
  const released = s.value(0);
  const bArrived = s.value(0);
  const askScale = s.value(0);

  const bgAura = aura(120, 40, 560, '#5ce1e622', '#ffd16614');
  const title = heroTitle(['Tile 1:', 'Running Totals'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.cyan,
    eyebrow: 'ONLINE SOFTMAX · FIRST TILE',
  });

  const trackX0 = -200;
  const trackMaxW = 920;
  const wScale = trackMaxW / 1.8; // fits 1.368 and later 1.503
  const vScale = trackMaxW / 54; // fits 23.68 and later 48.71

  const live = guardedDynamic(1, () => {
    const p = phase.value;
    const sr = showRef.value;
    const wf = showWFix.value;
    const wt = showWThis.value;
    const fw = fixOnW.value;
    const fv = fixOnV.value;
    const tw = thisOnW.value;
    const tv = thisOnV.value;
    const avg = showAvg.value;
    const rel = released.value;
    const ba = bArrived.value;
    const ask = askScale.value;

    const curW = W_FIX * fw + W_THIS * tw;
    const curV = V_FIX * fv + V_THIS * tv;

    const nodes = [
      // Reference max beacon
      glassCell(-600, -145, 480, 96, COSMOS.gold, {
        fill: '#1d1912',
        glow: 8,
        opacity: Math.max(0.35, sr),
      }),
      txt('REFERENCE MAX', -600, -172, 26, COSMOS.muted, 'mono').opacity(Math.max(0.35, sr)),
      txt(`m = ${TILE_A.m}`, -600, -124, 38, COSMOS.gold, 'mono')
        .glow(6, COSMOS.gold)
        .opacity(Math.max(0.35, sr)),

      // Two scratch slots on the left
      glassCell(
        -715,
        25,
        275,
        134,
        ba > 0.5 ? COSMOS.amber : rel > 0.5 ? COSMOS.dim : COSMOS.blue,
        {
          fill: '#10182b',
          dash: rel > 0.5 && ba < 0.5 ? [8, 6] : undefined,
          glow: rel > 0.5 && ba < 0.5 ? 0 : 7,
        },
      ),
      txt(
        ba > 0.5 ? 'TILE 2: test' : rel > 0.5 ? 'SLOT 0 FREE' : 'fix: s=1, v=10',
        -715,
        -14,
        26,
        ba > 0.5 ? COSMOS.amber : COSMOS.blue,
        'mono',
      ),
      txt(
        ba > 0.5
          ? 's=3, v=40'
          : rel > 0.5
            ? 'released'
            : wf > 0.5
              ? `w = ${W_FIX.toFixed(3)}`
              : 'score = 1',
        -715,
        44,
        26,
        COSMOS.ink,
        'mono',
      ),

      glassCell(-425, 25, 275, 134, rel > 0.5 ? COSMOS.dim : COSMOS.cyan, {
        fill: '#10182b',
        dash: rel > 0.5 ? [8, 6] : undefined,
        glow: rel > 0.5 ? 0 : 7,
      }),
      txt(
        rel > 0.5 ? 'SLOT 1 FREE' : 'this: s=2, v=20',
        -425,
        -14,
        26,
        rel > 0.5 ? COSMOS.dim : COSMOS.cyan,
        'mono',
      ),
      txt(
        rel > 0.5 ? 'released' : wt > 0.5 ? `w = ${W_THIS.toFixed(1)}` : 'score = 2',
        -425,
        44,
        26,
        rel > 0.5 ? COSMOS.dim : COSMOS.ink,
        'mono',
      ),

      // UPPER TRACK: Total Weight ℓ
      txt('UPPER TRACK · TOTAL WEIGHT  ℓ', trackX0, -255, 26, COSMOS.cyan, 'mono', 'left'),
      line([trackX0, -145], [trackX0 + trackMaxW, -145], { stroke: '#273557', width: 2.2 }),
      // LOWER TRACK: Weighted Value N
      txt('LOWER TRACK · WEIGHTED VALUE  N', trackX0, 40, 26, COSMOS.emerald, 'mono', 'left'),
      line([trackX0, 150], [trackX0 + trackMaxW, 150], { stroke: '#273557', width: 2.2 }),
    ];

    // Weight bar segments
    const wFixPx = W_FIX * fw * wScale;
    const wThisPx = W_THIS * tw * wScale;
    if (wFixPx > 2) {
      nodes.push(
        rect(wFixPx, 64, { fill: COSMOS.blue, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(trackX0 + wFixPx * 0.5, -182)
          .glow(7, COSMOS.blue)
          .opacity(0.9),
      );
    }
    if (wThisPx > 2) {
      nodes.push(
        rect(wThisPx, 64, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(trackX0 + wFixPx + wThisPx * 0.5, -182)
          .glow(8, COSMOS.cyan)
          .opacity(0.92),
      );
    }
    nodes.push(
      txt(
        `ℓ = ${curW.toFixed(3)}`,
        trackX0 + Math.max(120, wFixPx + wThisPx + 24),
        -182,
        32,
        COSMOS.cyan,
        'mono',
        'left',
      ).glow(6, COSMOS.cyan),
    );

    // Value bar segments
    const vFixPx = V_FIX * fv * vScale;
    const vThisPx = V_THIS * tv * vScale;
    if (vFixPx > 2) {
      nodes.push(
        rect(vFixPx, 64, { fill: COSMOS.blue, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(trackX0 + vFixPx * 0.5, 112)
          .glow(7, COSMOS.blue)
          .opacity(0.9),
      );
    }
    if (vThisPx > 2) {
      nodes.push(
        rect(vThisPx, 64, { fill: COSMOS.emerald, stroke: '#ffffff', width: 1.2, radius: 6 })
          .at(trackX0 + vFixPx + vThisPx * 0.5, 112)
          .glow(8, COSMOS.emerald)
          .opacity(0.92),
      );
    }
    nodes.push(
      txt(
        `N = ${curV.toFixed(2)}`,
        trackX0 + Math.max(120, vFixPx + vThisPx + 24),
        112,
        32,
        COSMOS.emerald,
        'mono',
        'left',
      ).glow(6, COSMOS.emerald),
    );

    // Ambient moving energy sparks on active tracks
    if (curW > 0.1) {
      const u = (p * 0.6) % 1;
      nodes.push(
        glowDot(trackX0 + u * (wFixPx + wThisPx), -182, { radius: 4.5, color: '#ffffff' }),
      );
    }
    if (curV > 1) {
      const u = (p * 0.6 + 0.5) % 1;
      nodes.push(glowDot(trackX0 + u * (vFixPx + vThisPx), 112, { radius: 4.5, color: '#ffffff' }));
    }

    // Tile 1 average readout -> Prediction prompt on beat 3
    if (avg > 0.02) {
      const promptActive = ask > 0.5;
      const boxCol = promptActive ? COSMOS.gold : COSMOS.emerald;
      nodes.push(
        glassCell(175, 310, 950, 118, boxCol, { fill: '#101829', glow: 9, opacity: avg }),
        txt(
          promptActive
            ? 'New reference m = 3 > 2: should saved ℓ and N grow or shrink?'
            : `Tile 1 ratio:  N / ℓ = ${TILE_A.u.toFixed(2)} / ${TILE_A.l.toFixed(3)} = ${TILE_A_OUTPUT.toFixed(2)}`,
          175,
          310,
          promptActive ? 30 : 32,
          boxCol,
          promptActive ? 'sans' : 'mono',
        )
          .glow(6, boxCol)
          .opacity(avg),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('tile-reference', () => s.play(showRef.to(1, { duration: 0.4 })));
  c.on('first-weight', () => s.play(showWFix.to(1, { duration: 0.4 })));
  c.on('unit-weight', () => s.play(showWThis.to(1, { duration: 0.4 })));
  c.on('post-fix', () => s.play(fixOnW.to(1, { duration: 0.45 })));
  c.on('value-fix', () => s.play(fixOnV.to(1, { duration: 0.45 })));
  c.on('weight-this', () => s.play(thisOnW.to(1, { duration: 0.45 })));
  c.on('post-this', () => s.play(thisOnV.to(1, { duration: 0.45 })));
  c.after('tile-average', () => s.play(showAvg.to(1, { duration: 0.4 })));
  c.on('release-a', () => s.play(released.to(1, { duration: 0.45 })));
  c.on('arrival-b', () => s.play(bArrived.to(1, { duration: 0.45 })));
  c.on('which-scale', () =>
    s.play(askScale.to(1, { duration: remainDuration(c, 'which-scale', 0.45) })),
  );
}
