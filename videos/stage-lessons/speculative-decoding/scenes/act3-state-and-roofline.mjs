// Act 3: Commit State, CPU Round, 60k Joint Proof & 3D Weight Roofline
// (commit, round-cpu, sequence-check, weight-roofline, weight-reuse)
import { curve3d, group, line, line3d, linear, point3d, rect } from 'vizmatic/stage';
import { cinematic3d, orbitScene, wireframeSlab3d } from '../../cinematic-kit.mjs';
import {
  COSMOS,
  SAMPLING_COUNTS,
  SEQUENCE_COND,
  SEQUENCE_P0,
  SEQUENCE_WORDS,
  cinemaRails,
  crossPhase,
  deliverUntilStop,
  glowDot,
  glowingArc,
  glowingTrail,
  guardedDynamic,
  heroAura,
  heroTitle,
  onCue,
  probBarH,
  startAmbient,
  tokenPill,
  txt,
  weightWorksheet,
} from '../shared.mjs';

/**
 * Scene 11: commit ("Committed text and computed state advance separately")
 * Phase 1: Rejection trims provisional KV [sang, softly, today] -> [sang], nearby pending.
 * Phase 2: Full acceptance emits bonus EOS from target row 4 (pending KV).
 * Phase 3: Ordered stopping on [sang, EOS, today] -> delivers sang, stops at EOS, drops today.
 */
export function commit(s, c) {
  const amb = startAmbient(s, c);
  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const showChain = s.value(0);
  const trimKV = s.value(0);
  const showPendingCorr = s.value(0);
  const showBonus = s.value(0);
  const showBonusPend = s.value(0);
  const stopScan = s.value(0);
  const hitEos = s.value(0);

  const stopRes = deliverUntilStop(['sang', 'EOS', 'today']);

  const title = heroTitle(['Committed text vs', 'computed KV state'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: 'STATE LIFECYCLE & STOPPING',
  });

  // Phase 1: Rejection + trim + pending correction
  const v1 = guardedDynamic(p1, (a) => {
    const t = amb.value;
    const sc = showChain.value;
    const tr = trimKV.value;
    const pc = showPendingCorr.value;
    const nodes = [];

    nodes.push(
      txt('COMMITTED TEXT', -835, -165, 28, COSMOS.emerald, 'mono', 'left').opacity(a),
      tokenPill('sang', -320, -165, { w: 230, h: 82, color: COSMOS.emerald, opacity: a }),
      tokenPill('nearby', -20, -165, { w: 230, h: 82, color: COSMOS.violet, opacity: a }),
    );

    // Computed KV row
    nodes.push(
      txt(
        tr > 0.4 ? 'RETAINED KV CACHE (1 POSITION)' : 'PROVISIONAL KV COMPUTED (3 POSITIONS)',
        -835,
        35,
        28,
        tr > 0.4 ? COSMOS.gold : COSMOS.blue,
        'mono',
        'left',
      ).opacity(a),
    );
    const kvItems = [
      { w: 'sang', x: -560, keep: true },
      { w: 'softly', x: -160, keep: false },
      { w: 'today', x: 240, keep: false },
    ];
    kvItems.forEach((item) => {
      const removed = !item.keep && tr > 0.4;
      const col = removed ? COSMOS.rose : COSMOS.blue;
      nodes.push(
        tokenPill(removed ? `trim: ${item.w}` : item.w, item.x, 125, {
          w: 310,
          h: 82,
          color: col,
          wordSize: 28,
          opacity: a * Math.max(0.25, sc) * (removed ? 0.45 : 1),
          dash: removed ? [7, 6] : null,
          glow: removed ? 4 : 10,
        }),
      );
    });

    if (pc > 0.05) {
      nodes.push(
        tokenPill('pending KV: nearby', 630, 125, {
          w: 350,
          h: 82,
          color: COSMOS.amber,
          wordColor: COSMOS.gold,
          wordSize: 28,
          dash: [8, 6],
          opacity: pc * a,
          glow: 12,
        }),
      );
    }

    nodes.push(
      glowDot(-560 + ((t * 1.4) % 1) * 1190, 225, {
        radius: 5,
        color: COSMOS.amber,
        glow: 10,
        opacity: 0.7 * a,
      }),
      txt(
        'Trim rejected suffix KV first; the sampled replacement still needs a forward pass',
        0,
        415,
        29,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Phase 2: Full acceptance -> bonus token EOS from row 4
  const v2 = guardedDynamic(p2, (a) => {
    const t = amb.value;
    const sb = showBonus.value;
    const bp = showBonusPend.value;
    const nodes = [];

    nodes.push(
      txt(
        'ALL 3 DRAFT TOKENS SURVIVE  ->  BONUS FROM TARGET ROW 4',
        0,
        -215,
        28,
        COSMOS.emerald,
        'mono',
      ).opacity(a),
    );
    const words = ['sang', 'softly', 'today', 'EOS'];
    words.forEach((w, i) => {
      const isBonus = i === 3;
      const x = -540 + i * 360;
      const col = isBonus ? COSMOS.gold : COSMOS.emerald;
      const op = a * (isBonus ? Math.max(0.2, sb) : 1);
      nodes.push(
        tokenPill(w, x, -45, {
          w: 250,
          h: 92,
          color: col,
          wordColor: isBonus ? COSMOS.gold : COSMOS.ink,
          topTag: isBonus ? 'BONUS (ROW 4)' : 'ACCEPTED + KV',
          topColor: col,
          sub: isBonus && bp > 0.3 ? 'KV PENDING' : isBonus ? 'TARGET DRAW' : 'KV READY',
          subColor: isBonus && bp > 0.3 ? COSMOS.amber : col,
          opacity: op,
          glow: isBonus ? 14 : 9,
        }),
      );
    });

    nodes.push(
      glowDot(-540 + ((t * 1.5) % 1) * 1080, 155, {
        radius: 5.5,
        color: COSMOS.gold,
        glow: 12,
        opacity: 0.75 * a,
      }),
      txt(
        'Committed: sang, softly, today, EOS   |   Computed KV: sang, softly, today (EOS pending)',
        0,
        415,
        28,
        COSMOS.gold,
        'mono',
      ).opacity(a),
    );
    return group(...nodes);
  });

  // Phase 3: Ordered stopping at EOS
  const v3 = guardedDynamic(p3, (a) => {
    const t = amb.value;
    const sc = stopScan.value;
    const eos = hitEos.value;
    const nodes = [];

    nodes.push(
      txt('APPLY STOPPING RULES IN EMITTED ORDER', 0, -215, 28, COSMOS.cyan, 'mono').opacity(a),
    );
    const block = ['sang', 'EOS', 'today'];
    block.forEach((w, i) => {
      const x = -440 + i * 440;
      let col = COSMOS.blue;
      let tag = `POS ${i + 1}`;
      if (i === 0 && sc > 0.2) {
        col = COSMOS.emerald;
        tag = 'DELIVERED';
      } else if (i === 1 && eos > 0.2) {
        col = COSMOS.rose;
        tag = 'STOP HERE';
      } else if (i === 2 && eos > 0.2) {
        col = COSMOS.rose;
        tag = 'SUPPRESSED';
      }
      nodes.push(
        tokenPill(w, x, -45, {
          w: 280,
          h: 92,
          color: col,
          topTag: tag,
          topColor: col,
          dash: i === 2 && eos > 0.2 ? [8, 6] : null,
          opacity: a * (i === 2 && eos > 0.2 ? 0.42 : 1),
          glow: i === 1 && eos > 0.2 ? 14 : 9,
        }),
      );
    });

    // Red stop barrier between EOS and today
    if (eos > 0.1) {
      nodes.push(
        line([220, -145], [220, 60], { stroke: COSMOS.rose, width: 5.5 })
          .glow(14, COSMOS.rose)
          .opacity(eos * a),
        tokenPill(`Delivered: "${stopRes.delivered.join(' ')}"`, -220, 215, {
          w: 480,
          h: 82,
          color: COSMOS.emerald,
          wordColor: COSMOS.emerald,
          wordSize: 30,
          opacity: eos * a,
        }),
        tokenPill(`Suppressed: "${stopRes.discarded.join(' ')}"`, 360, 215, {
          w: 480,
          h: 82,
          color: COSMOS.rose,
          wordColor: COSMOS.rose,
          wordSize: 30,
          opacity: eos * a,
        }),
      );
    }

    nodes.push(
      glowDot(-440 + ((t * 1.4) % 1) * 440, 105, {
        radius: 5,
        color: COSMOS.emerald,
        glow: 10,
        opacity: 0.7 * a,
      }),
      txt(
        'Never deliver tokens after the first EOS or output limit in a verified block',
        0,
        415,
        29,
        COSMOS.rose,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 0, 520, '#ffd16618', '#6ee7b716'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'computed-chain', (d) => showChain.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'trim-state', (d) => trimKV.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'pending-correction', (d) => showPendingCorr.to(1, { duration: d }), {
    desired: 0.55,
  });
  onCue(s, c, 'target-bonus', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'target-bonus', (d) => showBonus.to(1, { duration: d }), { desired: 0.65 });
  onCue(s, c, 'pending-bonus-state', (d) => showBonusPend.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'ordered-stopping', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'ordered-stopping', (d) => stopScan.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'stop-at-eos', (d) => hitEos.to(1, { duration: d }), { desired: 0.6 });
}

/**
 * Scene 12: round-cpu ("Follow the complete probability-level round")
 * Phase 1: Conditional probability table for noon/dawn/dusk.
 * Phase 2: Three scripted branches (draft noon -> noon): reject@1 -> dawn, reject@2 -> noon,dusk, full -> noon,noon,dawn.
 * Phase 3: Edge-case invariants (depth 0, p=q, disjoint, validation, EOS).
 */
export function roundCpu(s, c) {
  const amb = startAmbient(s, c);
  const p1 = s.value(1);
  const p2 = s.value(0);
  const p3 = s.value(0);

  const showTable = s.value(0);
  const br1 = s.value(0);
  const br2 = s.value(0);
  const br3 = s.value(0);
  const showGuards = s.value(0);

  const title = heroTitle(['Complete round trace', 'noon / dawn / dusk'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.cyan,
    eyebrow: 'PROBABILITY-LEVEL REFERENCE PROGRAM',
  });

  const v1 = guardedDynamic(p1, (a) => {
    const t = amb.value;
    const rows = [
      { prefix: 'empty prefix', p: [0.4, 0.5, 0.1], q: [0.6, 0.3, 0.1] },
      { prefix: 'after "noon"', p: [0.1, 0.6, 0.3], q: [0.6, 0.3, 0.1] },
      { prefix: 'after "dusk"', p: [0.3, 0.2, 0.5], q: [0.2, 0.3, 0.5] },
    ];
    const nodes = [
      txt('PREFIX', -650, -210, 26, COSMOS.muted, 'mono'),
      txt('TARGET p [noon, dawn, dusk]', -70, -210, 26, COSMOS.gold, 'mono'),
      txt('DRAFT q [noon, dawn, dusk]', 530, -210, 26, COSMOS.cyan, 'mono'),
    ];
    rows.forEach((r, i) => {
      const y = -85 + i * 165;
      nodes.push(
        tokenPill(r.prefix, -650, y, {
          w: 320,
          h: 82,
          color: COSMOS.blue,
          wordSize: 28,
          opacity: a,
        }),
        tokenPill(`[${r.p.map((v) => v.toFixed(1)).join(', ')}]`, -70, y, {
          w: 440,
          h: 82,
          color: COSMOS.gold,
          wordColor: COSMOS.gold,
          wordSize: 30,
          opacity: a * Math.max(0.25, showTable.value),
        }),
        tokenPill(`[${r.q.map((v) => v.toFixed(1)).join(', ')}]`, 530, y, {
          w: 440,
          h: 82,
          color: COSMOS.cyan,
          wordColor: COSMOS.cyan,
          wordSize: 30,
          opacity: a * Math.max(0.25, showTable.value),
        }),
      );
    });
    nodes.push(
      glowDot(-650 + ((t * 1.4) % 1) * 1200, 345, {
        radius: 5,
        color: COSMOS.cyan,
        glow: 10,
        opacity: 0.7 * a,
      }),
      txt(
        'Draft records every proposal law first; target supplies one conditional row per prefix + bonus',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v2 = guardedDynamic(p2, (a) => {
    const t = amb.value;
    const branches = [
      { label: 'Reject at pos 1', out: 'dawn', prog: br1.value, col: COSMOS.rose },
      { label: 'Reject at pos 2', out: 'noon -> dusk', prog: br2.value, col: COSMOS.amber },
      {
        label: 'Full accept + bonus',
        out: 'noon -> noon -> dawn',
        prog: br3.value,
        col: COSMOS.emerald,
      },
    ];
    const nodes = [
      txt('FIXED DRAFT PROPOSALS:  noon -> noon', 0, -220, 30, COSMOS.cyan, 'mono').opacity(a),
    ];
    branches.forEach((b, i) => {
      const y = -85 + i * 165;
      nodes.push(
        tokenPill(b.label, -580, y, { w: 400, h: 86, color: b.col, wordSize: 28, opacity: a }),
        txt('draft: noon, noon', -120, y, 28, COSMOS.muted, 'mono').opacity(a),
      );
      if (b.prog > 0.05) {
        nodes.push(
          line([70, y], [190, y], { stroke: b.col, width: 3.8 })
            .glow(8, b.col)
            .opacity(b.prog * a),
          tokenPill(b.out, 515, y, {
            w: 580,
            h: 86,
            color: b.col,
            wordColor: COSMOS.ink,
            wordSize: 30,
            opacity: b.prog * a,
            glow: 12,
          }),
        );
      }
    });
    nodes.push(
      glowDot(-580 + ((t * 1.5) % 1) * 1160, 345, {
        radius: 5,
        color: COSMOS.emerald,
        glow: 10,
        opacity: 0.7 * a,
      }),
      txt(
        'Three scripted draws exercise every branch: early rejection, late rejection, and bonus emission',
        0,
        415,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    );
    return group(...nodes);
  });

  const v3 = guardedDynamic(p3, (a) => {
    const t = amb.value;
    const g = showGuards.value;
    const guards = [
      { k: 'depth = 0', v: 'ordinary target sample', c: COSMOS.cyan },
      { k: 'identical p = q', v: 'skip zero-residual divide -> bonus', c: COSMOS.emerald },
      { k: 'disjoint p / q', v: 'reject & correct at position 1', c: COSMOS.violet },
      { k: 'non-finite / bool', v: 'reject invalid law before sampling', c: COSMOS.rose },
      { k: 'EOS / max tokens', v: 'apply strictly in emitted order', c: COSMOS.gold },
    ];
    const nodes = [];
    guards.forEach((row, i) => {
      const y = -205 + i * 124;
      nodes.push(
        tokenPill(row.k, -485, y, {
          w: 460,
          h: 74,
          color: row.c,
          wordSize: 28,
          opacity: a * Math.max(0.25, g),
        }),
        line([-235, y], [-95, y], { stroke: row.c, width: 3.0 }).opacity(a * g),
        tokenPill(row.v, 365, y, {
          w: 860,
          h: 74,
          color: row.c,
          wordColor: COSMOS.ink,
          wordSize: 28,
          opacity: a * Math.max(0.25, g),
        }),
      );
    });
    nodes.push(
      glowDot(-235 + ((t * 1.5) % 1) * 140, 291, {
        radius: 5,
        color: COSMOS.gold,
        glow: 10,
        opacity: 0.7 * a,
      }),
    );
    return group(...nodes);
  });

  s.add(heroAura(0, 20, 520, '#5ce1e61a', '#a78bfa16'), cinemaRails(), title, v1, v2, v3);

  onCue(s, c, 'sd-round-cpu-b0', (d) => showTable.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-round-cpu-b1', (d) => crossPhase(p1, p2, d), { desired: 0.45 });
  onCue(s, c, 'sd-round-first', (d) => br1.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-round-second', (d) => br2.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-round-bonus', (d) => br3.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-round-cpu-b2', (d) => crossPhase(p2, p3, d), { desired: 0.45 });
  onCue(s, c, 'sd-round-cpu-b2', (d) => showGuards.to(1, { duration: d }), { desired: 0.6 });
}

/**
 * Scene 13: sequence-check ("Test the joint output after the corrected prefix")
 * 3x3 matrix of all 9 ordered pairs from 60,000 fixed-seed runs comparing exact joint probability
 * p(a)*p(b|a) against observed frequency (max abs diff = 0.0037 < 0.006 tolerance).
 */
export function sequenceCheck(s, c) {
  const amb = startAmbient(s, c);
  const showExact = s.value(0);
  const showObserved = s.value(0);
  const showStale = s.value(0);

  const totalRuns = SAMPLING_COUNTS.reduce((a, v) => a + v, 0);
  let maxErr = 0;
  for (let a = 0; a < 3; a++) {
    for (let z = 0; z < 3; z++) {
      maxErr = Math.max(
        maxErr,
        Math.abs(SEQUENCE_P0[a] * SEQUENCE_COND[a][z] - SAMPLING_COUNTS[a * 3 + z] / totalRuns),
      );
    }
  }

  const title = heroTitle(['Joint sequence check', '60,000 fixed-seed runs'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'MULTI-TOKEN DISTRIBUTION TEST',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const ex = showExact.value;
      const obs = showObserved.value;
      const st = showStale.value;
      const nodes = [];

      // Legend floating top right
      nodes.push(
        rect(22, 18, { fill: COSMOS.gold, stroke: null, radius: 4 }).at(260, -395),
        txt('Exact joint p(a)p(b|a)', 290, -395, 26, COSMOS.gold, 'mono', 'left'),
        rect(22, 18, { fill: COSMOS.cyan, stroke: null, radius: 4 }).at(260, -352),
        txt('Observed (60,000 runs)', 290, -352, 26, COSMOS.cyan, 'mono', 'left'),
      );

      // 3x3 ordered-pair comparison grid
      const colXs = [-580, 0, 580];
      const rowYs = [-175, 45, 265];
      const barMaxW = 390;

      for (let a = 0; a < 3; a++) {
        for (let z = 0; z < 3; z++) {
          const idx = a * 3 + z;
          const cx = colXs[z];
          const cy = rowYs[a];
          const exact = SEQUENCE_P0[a] * SEQUENCE_COND[a][z];
          const freq = SAMPLING_COUNTS[idx] / totalRuns;
          const xLeft = cx - 220;

          nodes.push(
            txt(
              `${SEQUENCE_WORDS[a]} -> ${SEQUENCE_WORDS[z]}`,
              xLeft,
              cy - 52,
              26,
              COSMOS.ink,
              'mono',
              'left',
            ),
            probBarH(xLeft, cy - 12, barMaxW, 22, exact * Math.max(0.25, ex), 0.34, {
              color: COSMOS.gold,
              glow: 5,
            }),
            txt(exact.toFixed(3), xLeft + barMaxW + 16, cy - 12, 26, COSMOS.gold, 'mono', 'left'),
          );
          if (obs > 0.05) {
            nodes.push(
              probBarH(xLeft, cy + 26, barMaxW, 22, freq * obs, 0.34, {
                color: COSMOS.cyan,
                glow: 6,
                opacity: obs,
              }),
              txt(
                freq.toFixed(4),
                xLeft + barMaxW + 16,
                cy + 26,
                26,
                COSMOS.cyan,
                'mono',
                'left',
              ).opacity(obs),
            );
          }
        }
      }

      // Ambient scan bead
      nodes.push(
        glowDot(-800 + ((t * 1.3) % 1) * 1600, 358, {
          radius: 5,
          color: COSMOS.emerald,
          glow: 10,
          opacity: 0.7,
        }),
      );

      const foot =
        st > 0.25
          ? 'Checking two-token joints catches stale-prefix bugs that pass single-token tests'
          : obs > 0.25
            ? `Max |observed - target| = ${maxErr.toFixed(4)} < 0.006 tolerance across all 9 pairs`
            : 'Joint target probability = p(first word) * p(second word | first word)';
      nodes.push(txt(foot, 0, 415, 29, obs > 0.25 ? COSMOS.emerald : COSMOS.muted, 'sans'));

      return group(...nodes);
    },
  );

  s.add(heroAura(0, 40, 520, '#6ee7b718', '#5ce1e614'), cinemaRails(), title, view);

  onCue(s, c, 'sd-sequence-check-b0', (d) => showExact.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-sequence-error', (d) => showObserved.to(1, { duration: d }), { desired: 0.75 });
  onCue(s, c, 'sd-sequence-check-b1', (d) => showStale.to(1, { duration: d }), { desired: 0.55 });
}

/**
 * Scene 14: weight-roofline ("Derive a weight-traffic floor before predicting speed")
 * SIGNATURE 3D SCENE: Orbiting 3D HBM Weight Slab (`wireframeSlab3d`) + glowing 3D roofline curve
 * showing 30B BF16 = 60 GB read (17.91 ms memory floor vs 0.061 ms compute floor, ridge 295.4 FLOPs/byte,
 * 1 FLOP/byte = 0.34% peak dense BF16)!
 */
export function weightRoofline(s, c) {
  const amb = startAmbient(s, c);
  const w1 = weightWorksheet(1);

  const showBytes = s.value(0);
  const showFloors = s.value(0);
  const showIntensity = s.value(0);
  const showRidge = s.value(0);
  const showPct = s.value(0);

  // Orbiting 3D roofline + HBM weight slab on right half of canvas
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.08,
    distance: 14.5,
    unit: 122,
    focus: [0, 0, 0.5],
  }).at(320, 15);

  // Glowing 3D HBM weight slab (60 GB BF16 matrix weights)
  const hbmSlab = wireframeSlab3d([-1.8, -0.4, 0.5], 0.95, 0.65, 0.52, {
    color: COSMOS.cyan,
    width: 2.8,
    glow: 10,
  });

  // 3D Roofline curve in (log intensity, throughput) space
  // x: [-3.2 .. 3.2] maps log10(intensity) from 0 (1 FLOP/byte) to 3.0 (1000 FLOPs/byte)
  // ridge at log10(295.4) = 2.47 -> x = -3.2 + (2.47 / 3.0) * 6.4 = +2.07
  const roofCurve = curve3d(
    (u) => {
      const logI = u * 3.0;
      const intensity = 10 ** logI;
      const tflops = Math.min(989.5, intensity * 3.35);
      const wx = -3.0 + u * 6.0;
      const wz = 0.15 + (Math.log10(Math.max(1, tflops)) / 3.0) * 2.55;
      return [wx, 1.35, wz];
    },
    0,
    1,
    { samples: 64, color: COSMOS.gold, width: 4.4, glow: 12, blend: 'screen', onTop: true },
  );

  // 3D floor grid rails under the roofline
  const floorGrid = [
    line3d([-3.1, -1.5, 0.02], [3.1, -1.5, 0.02], { color: '#3a4b78', width: 1.6, opacity: 0.6 }),
    line3d([-3.1, 1.35, 0.02], [3.1, 1.35, 0.02], { color: '#3a4b78', width: 1.8, opacity: 0.7 }),
    line3d([-3.0, 1.35, 0.02], [-3.0, 1.35, 2.8], { color: '#3a4b78', width: 1.8, opacity: 0.7 }),
    // Vertical ridge drop line at u = log10(295.37)/3 = 0.8235 -> wx = 1.94
    line3d([1.94, 1.35, 0.02], [1.94, 1.35, 2.7], {
      color: COSMOS.amber,
      width: 2.6,
      glow: 8,
      blend: 'screen',
    }),
  ];

  // Animated operating beacon moving up from 1 FLOP/byte along the bandwidth slope
  const opBeacon = point3d(
    () => {
      const pulse = 0.04 * Math.sin(amb.value * Math.PI * 10);
      return [-3.0, 1.35, 0.6 + pulse];
    },
    { color: COSMOS.rose, radius: 10, glow: 16, blend: 'screen', onTop: true },
  );

  // Ridge beacon at 295.4 FLOPs/byte
  const ridgeBeacon = point3d([1.94, 1.35, 2.7], {
    color: COSMOS.gold,
    radius: 9,
    glow: 15,
    blend: 'screen',
    onTop: true,
  });

  // Energy beams carrying 60 GB weights from HBM slab into the compute floor
  const beams = [-0.45, 0, 0.45].map((dy) =>
    line3d([-0.82, -0.4 + dy, 0.5], [1.6, -0.4 + dy, 0.5], {
      color: COSMOS.cyan,
      width: 2.2,
      glow: 8,
      blend: 'screen',
      opacity: 0.7,
    }),
  );

  view3d.add(...hbmSlab, ...floorGrid, roofCurve, opBeacon, ridgeBeacon, ...beams);

  const title = heroTitle(['H100 SXM weight', 'roofline floor'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.gold,
    eyebrow: '30B ACTIVE BF16 WEIGHTS',
  });

  const leftMetrics = guardedDynamic(
    () => 1,
    () => {
      const sb = showBytes.value;
      const sf = showFloors.value;
      const si = showIntensity.value;
      const sr = showRidge.value;
      const sp = showPct.value;
      const nodes = [];

      // Left-column floating cinema readouts (zero boxes/cards, >= 26px)
      nodes.push(
        txt('WEIGHT STREAM (1 POSITION)', -855, -210, 26, COSMOS.cyan, 'mono', 'left'),
        txt('60 GB read  |  60 GFLOPs', -855, -162, 34, COSMOS.ink, 'mono', 'left').opacity(
          Math.max(0.3, sb),
        ),
      );

      if (sf > 0.05) {
        nodes.push(
          txt('HBM MEMORY FLOOR (3.35 TB/s)', -855, -65, 26, COSMOS.rose, 'mono', 'left').opacity(
            sf,
          ),
          txt(`${w1.memoryMs.toFixed(2)} ms`, -855, -8, 54, COSMOS.rose, 'mono', 'left')
            .glow(10, COSMOS.rose)
            .opacity(sf),
          txt(
            'DENSE BF16 COMPUTE FLOOR (989.5 TF/s)',
            -855,
            68,
            26,
            COSMOS.emerald,
            'mono',
            'left',
          ).opacity(sf),
          txt(
            `${w1.computeMs.toFixed(3)} ms`,
            -855,
            118,
            42,
            COSMOS.emerald,
            'mono',
            'left',
          ).opacity(sf),
        );
      }

      if (si > 0.05) {
        nodes.push(
          txt(
            `Intensity: ${w1.intensity.toFixed(0)} FLOP/byte`,
            -855,
            205,
            30,
            COSMOS.amber,
            'mono',
            'left',
          ).opacity(si),
        );
      }
      if (sr > 0.05) {
        nodes.push(
          txt(
            `Dense ridge: ~${w1.ridge.toFixed(1)} FLOPs/byte`,
            -855,
            258,
            30,
            COSMOS.gold,
            'mono',
            'left',
          ).opacity(sr),
        );
      }
      if (sp > 0.05) {
        const pct = (w1.intensity / w1.ridge) * 100;
        nodes.push(
          txt(
            `Peak dense arithmetic fed: ~${pct.toFixed(2)}%`,
            -855,
            312,
            30,
            COSMOS.rose,
            'mono',
            'left',
          ).opacity(sp),
        );
      }

      // Clean floating labels beside 3D viewport
      nodes.push(
        txt('1 FLOP/byte (memory-bound)', 110, 366, 26, COSMOS.rose, 'mono', 'left'),
        txt('Ridge 295.4', 690, -295, 26, COSMOS.gold, 'mono', 'right'),
        txt(
          'Moving 60 GB of weights dominates single-token decode by ~295x over dense compute',
          0,
          422,
          28,
          COSMOS.muted,
          'sans',
        ),
      );
      return group(...nodes);
    },
  );

  s.add(heroAura(320, 15, 520, '#5ce1e622', '#ffd16618'), title, view3d, leftMetrics);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.94 });

  onCue(s, c, 'sd-weight-roofline-b0', (d) => showBytes.to(0.6, { duration: d }), { desired: 0.4 });
  onCue(s, c, 'sd-weight-bytes', (d) => showBytes.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-weight-roofline-b1', (d) => showFloors.to(0.6, { duration: d }), {
    desired: 0.45,
  });
  onCue(s, c, 'sd-roof-floor', (d) => showFloors.to(1, { duration: d }), { desired: 0.6 });
  onCue(s, c, 'sd-weight-roofline-b2', (d) => showIntensity.to(1, { duration: d }), {
    desired: 0.45,
  });
  onCue(s, c, 'sd-roof-ridge', (d) => showRidge.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-roof-fraction', (d) => showPct.to(1, { duration: d }), { desired: 0.5 });
}

/**
 * Scene 15: weight-reuse ("What can one weight read buy?")
 * Compares 1 pending token (1 FLOP/byte, 0.061 ms compute) vs 1 + 5 draft tokens = 6 positions
 * sharing the SAME 60 GB weight stream (6 FLOPs/byte, 0.364 ms compute, still 17.91 ms memory),
 * plus sequential draft reads (5 x 2 GB ~ 3.0 ms at peak bandwidth).
 */
export function weightReuse(s, c) {
  const amb = startAmbient(s, c);
  const w1 = weightWorksheet(1);
  const w6 = weightWorksheet(6);

  const showOne = s.value(0);
  const addFive = s.value(0);
  const showCompute = s.value(0);
  const showDraftOne = s.value(0);
  const showDraftFive = s.value(0);

  const title = heroTitle(['Amortizing one', '60 GB weight stream'], {
    x: -855,
    y: -425,
    size: 52,
    lineHeight: 60,
    accent: COSMOS.emerald,
    eyebrow: 'PARALLEL VERIFICATION REUSE',
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const t = amb.value;
      const f5 = addFive.value;
      const sc = showCompute.value;
      const d1 = showDraftOne.value;
      const d5 = showDraftFive.value;
      const nodes = [];

      // Left glowing 60 GB weight source block
      nodes.push(
        tokenPill('60 GB weights', -655, -80, {
          w: 310,
          h: 112,
          color: COSMOS.cyan,
          wordColor: COSMOS.cyan,
          wordSize: 32,
          topTag: 'ONE HBM STREAM',
          topColor: COSMOS.cyan,
          topYOffset: -86,
          sub: `${w1.memoryMs.toFixed(2)} ms floor`,
          subColor: COSMOS.rose,
          subYOffset: 88,
          glow: 12,
        }),
      );

      // 1 pending + 5 draft tokens fanned out from the SAME 60 GB stream
      const posCount = 1 + Math.round(f5 * 5);
      for (let i = 0; i < posCount; i++) {
        const px = -240 + i * 195;
        const py = -80;
        const isPending = i === 0;
        const col = isPending ? COSMOS.blue : COSMOS.emerald;
        nodes.push(
          tokenPill(isPending ? 'pending' : `draft ${i}`, px, py, {
            w: 168,
            h: 82,
            color: col,
            wordSize: 26,
            glow: 9,
          }),
        );
      }

      // Glowing fan beam from 60 GB stream across active positions
      const spanEnd = -240 + (posCount - 1) * 195 + 84;
      nodes.push(
        line([-490, -162], [spanEnd, -162], { stroke: COSMOS.gold, width: 4.0 })
          .glow(12, COSMOS.gold)
          .set('blend', 'screen'),
        glowDot(-490 + ((t * 1.6) % 1) * (spanEnd + 490), -162, {
          radius: 7,
          color: '#ffffff',
          glow: 14,
        }),
        txt(
          `${posCount} position${posCount > 1 ? 's' : ''} -> ${posCount} FLOP/byte`,
          220,
          -202,
          30,
          COSMOS.gold,
          'mono',
        ),
      );

      // Compute floor vs Memory floor readout
      if (sc > 0.05) {
        nodes.push(
          txt(
            `Compute floor: ${w1.computeMs.toFixed(3)} ms -> ${w6.computeMs.toFixed(3)} ms   |   Weight floor: unchanged ${w6.memoryMs.toFixed(2)} ms`,
            0,
            68,
            28,
            COSMOS.emerald,
            'mono',
          ).opacity(sc),
        );
      }

      // Lower lane: Draft model sequential reads (5 x 2 GB = ~0.6 ms each = ~3.0 ms)
      if (d1 > 0.05) {
        const dy = 235;
        const draftShown = d5 > 0.25 ? 5 : 1;
        nodes.push(
          txt(
            'DRAFT SEQUENTIAL READS (2 GB EACH)',
            -855,
            dy - 78,
            26,
            COSMOS.amber,
            'mono',
            'left',
          ).opacity(d1),
        );
        for (let k = 0; k < draftShown; k++) {
          const dx = -760 + k * 215;
          nodes.push(
            tokenPill(`2 GB`, dx, dy, {
              w: 172,
              h: 68,
              color: COSMOS.amber,
              wordColor: COSMOS.amber,
              wordSize: 26,
              sub: `~0.6ms`,
              subColor: COSMOS.muted,
              subYOffset: 62,
              opacity: d1,
              glow: 8,
            }),
          );
        }
        if (d5 > 0.25) {
          nodes.push(
            txt('~3.0 ms total', 855, dy, 34, COSMOS.gold, 'mono', 'right')
              .glow(8, COSMOS.gold)
              .opacity(d5),
          );
        }
      }

      nodes.push(
        txt(
          'Target reuses one weight stream across all 6 positions; draft still pays serial reads + catch-up',
          0,
          415,
          28,
          COSMOS.muted,
          'sans',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(heroAura(0, -40, 520, '#6ee7b71a', '#5ce1e616'), cinemaRails(), title, view);

  onCue(s, c, 'sd-weight-reuse-b0', (d) => showOne.to(1, { duration: d }), { desired: 0.45 });
  onCue(s, c, 'sd-reuse-six', (d) => addFive.to(1, { duration: d }), { desired: 0.8 });
  onCue(s, c, 'sd-reuse-compute', (d) => showCompute.to(1, { duration: d }), { desired: 0.5 });
  onCue(s, c, 'sd-weight-reuse-b1', (d) => showDraftOne.to(1, { duration: d }), { desired: 0.55 });
  onCue(s, c, 'sd-draft-cost', (d) => showDraftFive.to(1, { duration: d }), { desired: 0.65 });
}
