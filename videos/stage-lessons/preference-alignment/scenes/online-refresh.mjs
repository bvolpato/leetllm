// Scene 28: New comparisons can follow the policy without a critic (Iterative / Online DPO refresh + sampling mixture + judge risk)
import {
  COSMOS,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function onlineRefresh(s, c) {
  const phase = s.value(0);
  const sLoop = s.value(0);
  const sEdge = s.value(0);
  const sFam = s.value(0);
  const sMix = s.value(0);
  const sBias = s.value(0);

  const bgAura = aura(0, 20, 620, '#123e3626', '#2e1a4a18');
  const title = heroTitle(['New Comparisons Follow', 'the Policy Without a Critic'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'ITERATIVE / ONLINE DPO · LIVE SAMPLING · MIXTURE RULES · JUDGE INTEGRITY',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const lp = Math.max(0.75, sLoop.value);
    const ed = sEdge.value;
    const fm = sFam.value;
    const mx = sMix.value;
    const bs = sBias.value;

    const nodes = [
      // LEFT: Pair Archive growing with new comparison edge
      txt('1. PAIR ARCHIVE + FRESH COMPARISON EDGE', -855, -214, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(-465, -118, 760, 108, COSMOS.blue, { fill: '#102138', glow: 5, opacity: lp }),
      txt('OLD ARCHIVE  C1:  P-7 Ticket A > Grant B', -815, -142, 26, COSMOS.blue, 'mono', 'left'),
      txt(
        'Original stored texts & label retained intact',
        -815,
        -94,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(-465, 22, 760, 118, ed > 0.2 ? COSMOS.emerald : COSMOS.dim, {
        fill: ed > 0.2 ? '#0e2824' : '#12182b',
        glow: ed > 0.2 ? 10 * pulse : 3,
        opacity: Math.max(0.75, ed),
      }),
      txt(
        'NEW TRIPLE  C_new:  Ticket A2 > Exception C2',
        -815,
        -6,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt(
        'Sampled from live pi_theta -> exposes harder negative C2',
        -815,
        44,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // RIGHT: Current Policy Sampler -> Judge -> Append arc
      glassCell(445, -118, 780, 108, COSMOS.cyan, { fill: '#0f2138', glow: 6, opacity: lp }),
      txt('LIVE POLICY  pi_theta (NO CRITIC NEEDED)', 90, -142, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Generates >= 2 fresh candidates (A2, C2)', 90, -94, 26, COSMOS.ink, 'sans', 'left'),

      glassCell(445, 22, 780, 118, bs > 0.3 ? COSMOS.rose : COSMOS.gold, {
        fill: bs > 0.3 ? '#29101a' : '#221c0e',
        glow: bs > 0.3 ? 10 * pulse : 5,
      }),
      txt(
        bs > 0.3
          ? 'RISK: STALE / BIASED JUDGE MISLABELS C2 > A2!'
          : 'PREFERENCE LABELER (HUMAN OR MODEL)',
        90,
        -6,
        26,
        bs > 0.3 ? COSMOS.rose : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        bs > 0.3
          ? 'Keep provenance & ref; verify outputs independently'
          : 'Appends new triple to next pairwise DPO update',
        90,
        44,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      // Refresh return arrow
      glowingArc([50, 22], [-80, 22], -36, {
        color: ed > 0.2 ? COSMOS.emerald : COSMOS.cyan,
        width: 4,
        glow: 9,
      }),

      // BOTTOM: Online DPO / IPO / IPO-MD sampling distribution spectrum
      glassCell(0, 272, 1680, 212, mx > 0.2 || fm > 0.2 ? COSMOS.violet : COSMOS.dim, {
        fill: '#14172b',
        glow: mx > 0.2 ? 9 * pulse : 4,
      }),
      txt(
        '2. SAMPLING & REFERENCE RULES DEFINE THE METHOD (NOT ONE ALGORITHM)',
        -805,
        200,
        26,
        COSMOS.violet,
        'mono',
        'left',
      ),

      // Pure current-policy bar (taller 52px bar so 26px text has generous clearance)
      txt('Online DPO / Online IPO:', -805, 266, 26, COSMOS.cyan, 'mono', 'left'),
      rect(760, 52, { fill: '#103b54', stroke: COSMOS.cyan, width: 2.2, radius: 7 }).at(70, 266),
      txt('100% current policy pi_theta', 70, 266, 26, COSMOS.cyan, 'mono'),

      // Reference-mixture bar (IPO-MD)
      txt('Mixture (e.g. IPO-MD):', -805, 336, 26, COSMOS.gold, 'mono', 'left'),
      rect(370, 52, { fill: '#103b54', stroke: COSMOS.cyan, width: 2.2, radius: 7 }).at(-125, 336),
      rect(370, 52, { fill: '#2a2210', stroke: COSMOS.gold, width: 2.2, radius: 7 }).at(265, 336),
      txt('pi_theta', -125, 336, 26, COSMOS.cyan, 'mono'),
      txt('+ ref pi_ref', 265, 336, 26, COSMOS.gold, 'mono'),
      txt('Changes drift distribution', 650, 336, 26, COSMOS.muted, 'sans'),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('online-refresh-b0', () =>
    s.play(sLoop.to(1, { duration: remainDuration(c, 'online-refresh-b0', 0.45) })),
  );
  c.on('pa-refresh-edge', () =>
    s.play(sEdge.to(1, { duration: remainDuration(c, 'pa-refresh-edge', 0.55) })),
  );
  c.on('online-refresh-b1', () =>
    s.play(sFam.to(1, { duration: remainDuration(c, 'online-refresh-b1', 0.45) })),
  );
  c.on('pa-refresh-mixture', () =>
    s.play(sMix.to(1, { duration: remainDuration(c, 'pa-refresh-mixture', 0.55) })),
  );
  c.on('online-refresh-b2', () =>
    s.play(sBias.to(1, { duration: remainDuration(c, 'online-refresh-b2', 0.55) })),
  );
}
