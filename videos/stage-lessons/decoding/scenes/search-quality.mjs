// Scene 10: search-quality: "What does a wider beam buy?"
// View 1 (Beat 0): High-probability repetition loops & wide-beam immediate-EOS hazard (GPT-2 / Meister).
// View 2 (Beat 1): Task-matched verification rails (Translation, Code, Canary Update).
// View 3 (Beat 2): 3D batched beam-width x 50,000-vocab score slab (cinematic3d + wireframeSlab3d)
//   growing from 1 -> 8 prefixes, revealing 400,000 child scores AFTER dec-beam-work.
import { gridPlane3d } from 'vizmatic/stage';
import {
  COSMOS,
  cinematic3d,
  glowDot,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  txt,
  wireframeSlab3d,
} from '../../cinematic-kit.mjs';
import {
  ROLE,
  arcPts,
  cinemaAtmosphere,
  glowRing,
  glowVector,
  lumBar,
  playCue,
  swapVis,
} from '../parts.mjs';

export default function searchQuality(s, c) {
  const title = heroTitle(['What does a', 'wider beam buy?'], {
    x: -850,
    y: -435,
    size: 46,
    lineHeight: 54,
    accent: ROLE.heat,
  });

  const vGpt = s.value(1);
  const vChecks = s.value(0);
  const vBatch = s.value(0);

  const showEosTrap = s.value(0);
  const checksReveal = s.value(0.25);
  const prefixCount = s.value(1); // 1 -> 8
  const showTotal = s.value(0);

  // 3D batched beam score slab visible ONLY in View 3 (Beat 2)
  const view3d = cinematic3d({
    theta: -0.72,
    phi: 1.06,
    distance: 15.4,
    unit: 78,
    focus: [0, 0, 0.7],
  }).at(485, 35);

  const floor3d = gridPlane3d({
    x: [-2.8, 2.8],
    y: [-2.4, 2.4],
    z: -0.8,
    step: 1,
    color: '#2b3d69',
    opacity: 0.42,
  });
  const slabBase = wireframeSlab3d([-0.1, 0, -0.55], 2.2, 1.1, 0.2, {
    color: ROLE.base,
    width: 2.8,
    glow: 9,
  });
  const slabStack = wireframeSlab3d(
    () => [-0.1, 0, -0.55 + ((prefixCount.value - 1) / 7) * 1.3],
    2.2,
    1.1,
    1.1,
    {
      color: ROLE.active,
      width: 2.6,
      glow: 10,
    },
  );
  view3d.add(floor3d, ...slabBase, ...slabStack);

  // VIEW 1 (Beat 0): Repetition loop vs wide-beam immediate EOS
  const gptLayer = guardedDynamic(vGpt, (alpha) => {
    const nodes = [];
    const eos = showEosTrap.value;

    // Left: Glowing repetition cycle orbit
    const cxL = -420;
    const cy = 20;
    nodes.push(
      txt(
        'High likelihood in open text (GPT-2)',
        cxL,
        -210,
        32,
        ROLE.base,
        'mono',
        'center',
      ).opacity(alpha),
      glowRing(cxL, cy, 155, ROLE.base, {
        width: 3.4,
        glow: 11,
        fillOpacity: 0.12,
        opacity: alpha,
      }),
      glowingTrail(arcPts([cxL - 120, cy - 85], [cxL + 120, cy - 85], -65), {
        color: ROLE.active,
        width: 4.5,
        glow: 10,
        opacity: alpha,
      }),
      glowingTrail(arcPts([cxL + 120, cy + 85], [cxL - 120, cy + 85], 65), {
        color: ROLE.heat,
        width: 4.5,
        glow: 10,
        opacity: alpha,
      }),
      txt('generic', cxL, cy - 46, 36, COSMOS.ink, 'serif', 'center').opacity(alpha),
      txt('repetitive loops', cxL, cy + 44, 34, ROLE.heat, 'serif', 'center').opacity(alpha),
    );

    // Right: Wide-beam immediate EOS collapse
    const cxR = 420;
    const eosCol = eos > 0.3 ? ROLE.pruned : COSMOS.dim;
    nodes.push(
      txt('Very wide beams', cxR, -210, 32, eosCol, 'mono', 'center').opacity(alpha),
      glowRing(cxR - 190, cy, 62, ROLE.active, { width: 2.8, glow: 8, opacity: alpha }),
      txt('start', cxR - 190, cy, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      glowVector([cxR - 118, cy], [cxR + 96, cy], {
        color: eosCol,
        width: 4.8,
        glow: 12 * Math.max(0.3, eos),
        opacity: alpha,
      }),
      glowRing(cxR + 175, cy, 62, eosCol, {
        width: 3.6,
        glow: 12 * Math.max(0.3, eos),
        fillOpacity: 0.22 * Math.max(0.3, eos),
        opacity: alpha,
      }),
      txt(
        'EOS',
        cxR + 175,
        cy,
        34,
        eos > 0.3 ? ROLE.winner : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        eos > 0.3 ? 'Short-circuit directly to EOS!' : 'Objective shapes which prefixes win',
        cxR,
        cy + 165,
        30,
        eos > 0.3 ? ROLE.winner : COSMOS.muted,
        'serif',
        'center',
      )
        .glow(eos > 0.3 ? 6 : 0, ROLE.winner)
        .opacity(alpha),
    );

    nodes.push(
      txt(
        'Holtzman et al. (2020) & Meister et al. (2020): higher probability is not always better text.',
        0,
        385,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 2 (Beat 1): Task -> Verifier rails
  const checksLayer = guardedDynamic(vChecks, (alpha) => {
    const nodes = [];
    const rev = checksReveal.value;
    const rows = [
      { task: 'Translation', check: 'Preserve source meaning', col: ROLE.base, y: -155 },
      { task: 'Code completion', check: 'Pass unit tests', col: ROLE.valid, y: 40 },
      { task: 'Canary update', check: 'Match deployment telemetry', col: ROLE.winner, y: 235 },
    ];

    nodes.push(
      txt(
        'Evaluate finished outputs on the check that matters',
        0,
        -295,
        32,
        ROLE.active,
        'serif',
        'center',
      ).opacity(alpha),
    );

    rows.forEach((row, i) => {
      const lit = rev >= i * 0.32;
      const rowA = (lit ? 1 : 0.3) * alpha;
      nodes.push(
        lumBar(-435, row.y, 460, 82, {
          color: row.col,
          fillOpacity: 0.22,
          strokeWidth: 2.5,
          glow: 9,
          radius: 41,
          opacity: rowA,
        }),
        txt(row.task, -435, row.y, 34, COSMOS.ink, 'serif', 'center').opacity(rowA),
        glowVector([-190, row.y], [30, row.y], {
          color: row.col,
          width: 4.5,
          glow: 10,
          opacity: rowA,
        }),
        lumBar(420, row.y, 680, 82, {
          color: row.col,
          fillOpacity: 0.16,
          strokeWidth: 2.2,
          glow: 8,
          radius: 14,
          opacity: rowA,
        }),
        txt(row.check, 420, row.y, 32, row.col, 'mono', 'center').opacity(rowA),
      );
    });

    nodes.push(
      txt(
        'Widening the beam changes surviving prefixes; compare finished answers directly.',
        0,
        390,
        28,
        COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );
    return nodes;
  });

  // VIEW 3 (Beat 2): 1..8 batched prefix rows × 50,000 vocab paired with 3D slab
  const batchLayer = guardedDynamic(vBatch, (alpha) => {
    const nodes = [];
    const nRows = Math.round(Math.max(1, Math.min(8, prefixCount.value)));
    const totReady = showTotal.value > 0.4;

    nodes.push(
      txt(
        'One decoding step: active prefixes × |V|',
        -845,
        -265,
        30,
        COSMOS.ink,
        'mono',
        'left',
      ).opacity(alpha),
      txt('Batched KV suffix tensor', 485, -315, 30, ROLE.active, 'mono', 'center')
        .glow(6, ROLE.active)
        .opacity(alpha),
    );

    const rowL = -640;
    const rowW = 630;
    for (let r = 0; r < nRows; r++) {
      const y = -185 + r * 66;
      const col = r === 0 ? ROLE.base : ROLE.active;
      nodes.push(
        txt(`P${r + 1}`, rowL - 30, y, 28, col, 'mono', 'right').opacity(alpha),
        lumBar(rowL + rowW / 2, y, rowW, 42, {
          color: col,
          fillOpacity: 0.34,
          strokeWidth: 2.2,
          glow: 7,
          radius: 6,
          opacity: alpha,
        }),
        txt('50,000 child scores', rowL + rowW / 2, y, 26, COSMOS.ink, 'mono', 'center').opacity(
          alpha,
        ),
      );
    }

    nodes.push(
      glowDot(485, 330, { radius: 6, color: ROLE.active, glow: 10, opacity: alpha }),
      txt(
        totReady ? '8 × 50,000 = 400,000 continuations / step' : `${nRows} × 50,000 = ?`,
        0,
        395,
        36,
        totReady ? ROLE.winner : ROLE.active,
        'mono',
        'center',
      )
        .glow(totReady ? 9 : 4, totReady ? ROLE.winner : ROLE.active)
        .opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.heat, ROLE.active), title, gptLayer, checksLayer, batchLayer);

  playCue(s, c, 'dec-search-quality-1', (d) => s.play(showEosTrap.to(1, { duration: d })), {
    dur: 0.75,
  });

  c.onBeat(1, () => s.play(swapVis(vGpt, vChecks, 0.55)));
  playCue(s, c, 'dec-search-quality-2', (d) => s.play(checksReveal.to(1, { duration: d })), {
    dur: 0.9,
  });

  c.onBeat(2, () => {
    s.play(swapVis(vChecks, vBatch, 0.55));
  });
  const beat2Offset = c.beats[2].start - c.start + 0.34;
  c.at(beat2Offset, () => {
    s.add(view3d);
    const rem = Math.max(0.8, c.end - (c.start + beat2Offset) - 0.65);
    s.play(view3d.orbit({ theta: -0.2, phi: 0.95, distance: 14.5 }, { duration: rem }));
  });
  playCue(s, c, 'dec-search-quality-3', (d) => s.play(prefixCount.to(8, { duration: d })), {
    dur: 1.0,
  });
  playCue(s, c, 'dec-beam-work', (d) => s.play(showTotal.to(1, { duration: d })), {
    after: true,
    dur: 0.5,
  });
}
