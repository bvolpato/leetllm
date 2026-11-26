// Scene 08: Where does the sum go? Col C (3+4+5+9 = 21 -> rank 2, strict hold!) + all-gather + ring cost 280 vs 420 GB (1.5x).
import { delay, par } from 'vizmatic/stage';
import {
  COSMOS,
  GRADIENT_CONTRIBUTIONS,
  ROLE,
  RS_CHANGED,
  RS_CHANGED_GRID,
  SHARDS,
  aura,
  glassCell,
  glowDot,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function collectiveCost(s, c) {
  const phase = s.value(0);
  const showGrid = s.value(1);
  const changed = s.value(0); // R3 col C: 6 -> 9
  const folded = s.value(0);
  const rev21 = s.value(0);
  const gathered = s.value(0);

  const showRingCost = s.value(0);
  const showN = s.value(0);
  const showTwo = s.value(0);
  const showRatio = s.value(0);

  const bgAura = aura(0, 20, 640, '#5ce1e61e', '#ffd16618');
  const title = heroTitle(['Where Does the', 'Sum Go?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: ROLE.comm,
    eyebrow: 'REDUCE-SCATTER + ALL-GATHER = ALL-REDUCE',
  });

  const gridView = guardedDynamic(showGrid, (a) => {
    const ch = changed.value;
    const fl = folded.value;
    const r21 = rev21.value;
    const ga = gathered.value;
    const grid = ch > 0.5 ? RS_CHANGED_GRID : GRADIENT_CONTRIBUTIONS;

    const nodes = [
      txt('4 RANKS × 4 SHARD COLUMNS (A, B, C, D)', -360, -210, 28, ROLE.comm, 'mono').opacity(a),
    ];

    const colXs = [-580, -420, -260, -100];
    SHARDS.forEach((sh, j) => {
      nodes.push(
        txt(`Col ${sh}`, colXs[j], -155, 26, j === 2 ? COSMOS.gold : COSMOS.muted, 'mono').opacity(
          a,
        ),
      );
    });

    for (let r = 0; r < 4; r++) {
      const y = -82 + r * 88;
      nodes.push(txt(`Rank ${r}`, -745, y, 26, COSMOS.ink, 'mono').opacity(a));
      for (let j = 0; j < 4; j++) {
        const isC = j === 2;
        const isChanged = r === 3 && j === 2 && ch > 0.5;
        const val = grid[r][j];
        const stroke = isChanged
          ? COSMOS.gold
          : isC && fl > 0.5
            ? ROLE.good
            : isC
              ? ROLE.comm
              : COSMOS.rule;
        nodes.push(
          glassCell(colXs[j], y, 134, 68, stroke, {
            fill: isChanged ? '#2b2210' : isC ? '#102438' : '#0c1322',
            glow: isChanged || (isC && fl > 0.5) ? 9 : 2,
            opacity: a,
          }),
          txt(String(val), colXs[j], y, 32, isChanged ? COSMOS.gold : COSMOS.ink, 'mono').opacity(
            a,
          ),
        );
      }
    }

    // Right side: Reduce-Scatter owned shard -> All-Gather full vector
    nodes.push(
      txt(
        ga > 0.5 ? 'AFTER ALL-GATHER (ALL RANKS)' : 'AFTER REDUCE-SCATTER (OWNED SHARD)',
        435,
        -155,
        26,
        ga > 0.5 ? ROLE.good : COSMOS.gold,
        'mono',
      ).opacity(a),
    );
    for (let r = 0; r < 4; r++) {
      const y = -82 + r * 88;
      for (let j = 0; j < 4; j++) {
        const cx = 195 + j * 160;
        const owned = r === j;
        const showVal = ga > 0.5 || (owned && (j !== 2 || r21 > 0.5));
        const isHero21 = owned && j === 2;
        const valStr = j === 2 && r21 < 0.5 && owned ? '?' : showVal ? String(RS_CHANGED[j]) : '·';
        const stroke =
          isHero21 && r21 > 0.5
            ? ROLE.good
            : ga > 0.5
              ? ROLE.comm
              : owned
                ? COSMOS.gold
                : COSMOS.dim;
        nodes.push(
          glassCell(cx, y, 134, 68, stroke, {
            fill: isHero21 && r21 > 0.5 ? '#0d2b24' : owned ? '#181e30' : '#0a0f1c',
            glow: isHero21 && r21 > 0.5 ? 11 : ga > 0.5 ? 5 : 0,
            opacity: a,
          }),
          txt(
            valStr,
            cx,
            y,
            32,
            isHero21 && r21 > 0.5 ? ROLE.good : showVal ? COSMOS.ink : COSMOS.dim,
            'mono',
          ).opacity(a),
        );
      }
    }

    const foot =
      ga > 0.5
        ? 'Reduce-Scatter + All-Gather = mathematical All-Reduce · matching types & counts required'
        : r21 > 0.5
          ? '3 + 4 + 5 + 9 = 21 lands on Rank 2 (owner of column C)'
          : ch > 0.5
            ? 'Rank 3 col C changed 6 → 9 · predict what Rank 2 receives!'
            : 'Column C summed to 18 before the update';
    nodes.push(txt(foot, 0, 325, 28, r21 > 0.5 ? ROLE.good : COSMOS.gold, 'mono').opacity(a));
    return group(...nodes);
  });

  const eqRing = glowTex(
    '\\text{Phase} = \\frac{N-1}{N} S \\quad\\Rightarrow\\quad \\text{DDP: } 2S = 280\\text{ GB} \\;\\text{ vs }\\; \\text{FSDP: } 3S = 420\\text{ GB } (1.5\\times)',
    { x: 0, y: 245, size: 32, color: COSMOS.gold },
  );

  const ringCostView = guardedDynamic(showRingCost, (a) => {
    const sn = showN.value;
    const st = showTwo.value;
    const sr = showRatio.value;

    const nodes = [
      glassCell(-540, -70, 520, 188, ROLE.comm, { fill: '#0e1f36', glow: 8, opacity: a }),
      txt('1 RING PHASE (RS or AG)', -540, -124, 26, ROLE.comm, 'mono').opacity(a),
      txt(
        sn > 0.5 ? '((N - 1) / N) × S  ≈  1.0 S' : 'N = 2: sends (1/2) S',
        -540,
        -68,
        30,
        COSMOS.ink,
        'mono',
      ).opacity(a),
      txt('140 GB tensor → ~140 GB / phase', -540, -12, 26, COSMOS.muted, 'mono').opacity(a),

      glassCell(0, -70, 480, 188, st > 0.5 ? COSMOS.gold : COSMOS.dim, {
        fill: '#221c10',
        glow: st > 0.5 ? 9 : 2,
        opacity: a,
      }),
      txt('DDP (ALL-REDUCE = 2 PHASES)', 0, -124, 26, COSMOS.gold, 'mono').opacity(a),
      txt('2 × 140 GB = 280 GB sent', 0, -68, 30, COSMOS.gold, 'mono').opacity(a),
      txt('RS grads + AG grads', 0, -12, 26, COSMOS.muted, 'sans').opacity(a),

      glassCell(540, -70, 520, 188, sr > 0.5 ? ROLE.good : COSMOS.dim, {
        fill: '#0e2824',
        glow: sr > 0.5 ? 10 : 2,
        opacity: a,
      }),
      txt('FULL SHARD (3 PHASES)', 540, -124, 26, ROLE.good, 'mono').opacity(a),
      txt('3 × 140 GB = 420 GB (1.5×)', 540, -68, 30, ROLE.good, 'mono').opacity(a),
      txt('AG fwd + AG bwd + RS grads', 540, -12, 26, COSMOS.muted, 'sans').opacity(a),

      txt(
        'Step time depends on exposed wait · retaining weights or grad accum changes bytes',
        0,
        365,
        28,
        COSMOS.muted,
        'sans',
      ).opacity(a),
    ];

    const u = (phase.value * 0.65) % 1;
    nodes.push(glowDot(-760 + u * 1520, 115, { radius: 6.5, color: COSMOS.gold, opacity: a }));
    return group(...nodes);
  });

  s.add(bgAura, title, gridView, ringCostView);
  runPhase(s, c, phase, 14);

  c.on('change-c', () => s.play(changed.to(1, { duration: remainDuration(c, 'change-c', 0.45) })));
  c.after('fold-column', () =>
    s.play(folded.to(1, { duration: remainDuration(c, 'fold-column', 0.4) })),
  );
  c.after('owned-coordinate', () =>
    s.play(rev21.to(1, { duration: remainDuration(c, 'owned-coordinate', 0.4) })),
  );
  c.after('gather-results', () =>
    s.play(gathered.to(1, { duration: remainDuration(c, 'gather-results', 0.45) })),
  );
  c.on('half-tensor', () => {
    s.play(
      par(showGrid.to(0, { duration: 0.2 }), delay(showRingCost.to(1, { duration: 0.25 }), 0.22)),
    );
  });
  c.show('half-tensor', [eqRing]);
  c.on('ring-size', () => s.play(showN.to(1, { duration: 0.4 })));
  c.on('two-phases', () => s.play(showTwo.to(1, { duration: 0.4 })));
  c.onBeat(3, () => s.play(showRatio.to(1, { duration: 0.5 })));
}
