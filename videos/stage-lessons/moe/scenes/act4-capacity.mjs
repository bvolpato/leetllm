// Act 4 (Scenes 19 to 24): Capacity cutoff and token overflow, dropless vs rerouting policy,
// scale capacity arithmetic, stored vs active parameters, residency shortfall, and FFN vs SwiGLU FLOPs.
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  glowDot,
  glowTex,
  glowingTrail,
  guardedDynamic,
  heroTitle,
  orbitScene,
  txt,
} from '../../cinematic-kit.mjs';
import {
  CAPACITY_ROUTES,
  EXP_COLORS,
  ROLE,
  buildTensorSlabs3d,
  buildWeightVault3d,
  cinemaAtmosphere,
  clamp,
  fmt,
  lerp,
  lumBar,
  moeCapacity,
  overflowReroute,
  playCue,
  queueExample,
  vecStr,
} from '../parts.mjs';

/** Helper to draw the 4 expert arrival queues cleanly with optional cutoff line & overflow styling. */
export function drawQueueGrid({
  groups,
  leftX = -760,
  topY = -175,
  pitchX = 114,
  laneY = 122,
  trackedToken = 4,
  cutoffSlots = null,
  markOverflow = false,
  labelOverflow = false,
  overflowCounts = [],
  showLoads = false,
  workRows = null,
  alpha = 1,
}) {
  const nodes = [];
  nodes.push(
    txt('Arrival order ->', leftX, topY - 62, 26, COSMOS.muted, 'mono', 'left').opacity(alpha),
  );

  groups.forEach((members, e) => {
    const y = topY + e * laneY;
    const eCol = EXP_COLORS[e];
    nodes.push(
      txt(`E${e + 1}`, leftX - 38, y - (showLoads ? 14 : 0), 32, eCol, 'mono', 'right').opacity(
        alpha,
      ),
    );
    if (showLoads) {
      nodes.push(
        txt(`load ${members.length}`, leftX - 38, y + 22, 26, COSMOS.dim, 'mono', 'right').opacity(
          alpha,
        ),
      );
    }

    members.forEach((tok, j) => {
      const cx = leftX + j * pitchX + 48;
      const isTrack = tok === trackedToken;
      const isOver = markOverflow && cutoffSlots !== null && j >= cutoffSlots;
      const col = isOver ? ROLE.overflow : isTrack ? ROLE.router : '#596d9c';
      nodes.push(
        lumBar(cx, y, 94, 68, {
          color: col,
          fillOpacity: isTrack ? 0.42 : isOver ? 0.24 : 0.16,
          strokeWidth: isTrack || isOver ? 2.8 : 1.8,
          glow: isTrack ? 11 : isOver ? 8 : 3,
          radius: 8,
          opacity: alpha,
        }),
        txt(
          `t${tok}`,
          cx,
          y,
          28,
          isTrack || isOver ? COSMOS.ink : COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    });

    if (workRows && workRows[e] > 0) {
      const wEnd = leftX + workRows[e] * pitchX - 18;
      nodes.push(
        line([leftX, y + 46], [wEnd, y + 46], {
          stroke: e === 0 ? ROLE.router : ROLE.active,
          width: 4.5,
        }).opacity(0.85 * alpha),
      );
    }

    if (markOverflow && labelOverflow && (overflowCounts[e] ?? 0) > 0 && cutoffSlots !== null) {
      const firstX = leftX + cutoffSlots * pitchX;
      const lastX = leftX + members.length * pitchX - 18;
      nodes.push(
        txt(
          `${overflowCounts[e]} overflow`,
          (firstX + lastX) / 2,
          y - 54,
          28,
          ROLE.overflow,
          'mono',
          'center',
        )
          .glow(7, ROLE.overflow)
          .opacity(alpha),
      );
    }
  });

  if (cutoffSlots !== null) {
    const cutX = leftX + cutoffSlots * pitchX - 10;
    const botY = topY + 3 * laneY + 52;
    nodes.push(
      glowingTrail(
        [
          [cutX, topY - 46],
          [cutX, botY],
        ],
        { color: ROLE.overflow, width: 4, glow: 10, opacity: alpha },
      ),
      glowDot(cutX, topY - 46, { radius: 7, color: ROLE.overflow, glow: 11, opacity: alpha }),
      txt(`${cutoffSlots} slots`, cutX, botY + 34, 28, ROLE.overflow, 'mono', 'center').opacity(
        alpha,
      ),
    );
  }
  return nodes;
}

// ---------------------------------------------------------------------------
// Scene 19: capacity-limit: "Which return fits?"
// STRICT PREDICTION WITHHOLDING: Beat 1 asks which of t4's two outputs reaches sum; Beat 2 reveals E3!
// ---------------------------------------------------------------------------
export function capacityLimit(s, c) {
  const title = heroTitle(['Capacity limit:', 'which return fits?'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.overflow,
  });

  const model = queueExample(CAPACITY_ROUTES, 4, [0.6, 0.4], 1, false);
  // slots=4, totalOverflow=4, output=[0, 1.2], terms: E1 slot 5 (runs=false), E3 slot 2 (runs=true)

  const pArrive = s.value(0.5);
  const pCutoff = s.value(0);
  const pFind = s.value(0);
  const pThird = s.value(0); // WITHHELD until Beat 2 third-returns!
  const pGate = s.value(0);
  const pOver = s.value(0);
  const pRes = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const cut = pCutoff.value;
    const fnd = pFind.value;
    const thd = pThird.value;
    const gt = pGate.value;
    const ov = pOver.value;
    const rs = pRes.value;
    const nodes = [];

    nodes.push(
      ...drawQueueGrid({
        groups: model.groups,
        leftX: -745,
        topY: -165,
        pitchX: 110,
        laneY: 118,
        trackedToken: 4,
        cutoffSlots: cut > 0.25 ? model.slots : null,
        markOverflow: thd > 0.25 || ov > 0.25,
        labelOverflow: ov > 0.25,
        overflowCounts: model.overflow,
        alpha,
      }),
    );

    // Right panel: Token 4 routed branch (answers strictly withheld until third-returns / retained-gate!)
    const rx = 545;
    nodes.push(
      txt('Token 4  ·  routed branch', rx, -225, 30, ROLE.router, 'mono', 'center').opacity(alpha),
      // E1 term
      lumBar(rx, -110, 560, 125, {
        color: thd > 0.25 ? ROLE.overflow : fnd > 0.2 ? ROLE.router : '#4e608e',
        fillOpacity: thd > 0.25 ? 0.22 : 0.16,
        strokeWidth: 2.4,
        glow: thd > 0.25 ? 8 : 4,
        opacity: alpha,
      }),
      txt('E1 (slot 5)', rx - 155, -135, 28, EXP_COLORS[0], 'mono', 'center').opacity(alpha),
      txt(
        thd > 0.25 ? 'DROPPED' : 'selected?',
        rx + 155,
        -135,
        28,
        thd > 0.25 ? ROLE.overflow : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        '0.6 x [2, 0]',
        rx,
        -82,
        32,
        thd > 0.25 ? COSMOS.dim : COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      // E3 term
      lumBar(rx, 50, 560, 125, {
        color: thd > 0.25 ? ROLE.active : fnd > 0.2 ? ROLE.router : '#4e608e',
        fillOpacity: thd > 0.25 ? 0.28 : 0.16,
        strokeWidth: 2.5,
        glow: thd > 0.25 ? 10 : 4,
        opacity: alpha,
      }),
      txt('E3 (slot 2)', rx - 155, 25, 28, EXP_COLORS[2], 'mono', 'center').opacity(alpha),
      txt(
        thd > 0.25 ? 'RETURNS' : 'selected?',
        rx + 155,
        25,
        28,
        thd > 0.25 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt('0.4 x [0, 3]', rx, 78, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Routed output box
      lumBar(rx, 218, 600, 134, {
        color: gt > 0.25 ? ROLE.token : '#4c5f8d',
        fillOpacity: gt > 0.25 ? 0.28 : 0.14,
        strokeWidth: 2.6,
        glow: gt > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt('Routed output (unrescaled)', rx, 184, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      txt(
        gt > 0.25 ? vecStr(model.output, 1) : '?',
        rx,
        242,
        46,
        gt > 0.25 ? ROLE.token : ROLE.router,
        'mono',
        'center',
      )
        .glow(gt > 0.25 ? 9 : 0, ROLE.token)
        .opacity(alpha),
    );

    // Bottom prompt / verdict
    if (rs > 0.25) {
      nodes.push(
        txt(
          '4 tickets overflow E1  ·  all 8 tokens keep their residual path  ·  rescaling would change t4',
          0,
          395,
          28,
          ROLE.token,
          'sans',
          'center',
        ).opacity(alpha),
      );
    } else if (gt > 0.25) {
      nodes.push(
        txt(
          'Surviving gate stays at 0.4 -> routed output [0.0, 1.2]',
          0,
          395,
          30,
          ROLE.token,
          'mono',
          'center',
        )
          .glow(7, ROLE.token)
          .opacity(alpha),
      );
    } else if (thd > 0.25) {
      nodes.push(
        txt(
          'Only E3 returns (token 4 is 5th in E1, 2nd in E3)',
          0,
          395,
          30,
          ROLE.active,
          'mono',
          'center',
        )
          .glow(7, ROLE.active)
          .opacity(alpha),
      );
    } else if (fnd > 0.25) {
      nodes.push(
        txt(
          'Token 4 is 5th in E1 and 2nd in E3. Which of its two outputs reaches the sum?',
          0,
          395,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          '16 assignments / 4 experts = 4 slots per expert at capacity factor c = 1.0',
          0,
          395,
          28,
          COSMOS.muted,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    void pArrive.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.overflow, ROLE.router), title, layer);

  playCue(s, c, 'arrange-arrivals', (d) => s.play(pArrive.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'four-slots', (d) => s.play(pCutoff.to(1, { duration: d })), { dur: 0.7 });
  playCue(s, c, 'find-four', (d) => s.play(pFind.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'third-returns', (d) => s.play(pThird.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'retained-gate', (d) => s.play(pGate.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'overflow-assignments', (d) => s.play(pOver.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'residual-positions', (d) => s.play(pRes.to(1, { duration: d })), { dur: 0.6 });
}

// ---------------------------------------------------------------------------
// Scene 20: dropless-work: "What if the fifth row runs?"
// STRICT PREDICTION WITHHOLDING: Beat 1 asks t4's 1st coord under E4 reroute; Beat 2 reveals [3.0, 1.2]!
// ---------------------------------------------------------------------------
export function droplessWork(s, c) {
  const title = heroTitle(['Dropless execution vs', 'rerouting overflow'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.active,
  });

  const beforeReroute = overflowReroute(0); // E1 has 8 rows, output [1.2, 1.2]
  const afterReroute = overflowReroute(1); // t4 moved to E4, E1 has 7 rows, E4 has 3, output [3.0, 1.2]

  const pTail = s.value(0.4);
  const pHot = s.value(0);
  const pAlt = s.value(0);
  const pMove = s.value(0); // WITHHELD until Beat 2 move-four!
  const pCompare = s.value(0); // WITHHELD until Beat 2 compare-returns!
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const tl = pTail.value;
    const ht = pHot.value;
    const al = pAlt.value;
    const mv = pMove.value;
    const cmp = pCompare.value;
    const activeGroups = mv > 0.5 ? afterReroute.grouped : beforeReroute.grouped;
    const loads = activeGroups.map((g) => g.length);
    const nodes = [];

    nodes.push(
      ...drawQueueGrid({
        groups: activeGroups,
        leftX: -745,
        topY: -165,
        pitchX: 110,
        laneY: 118,
        trackedToken: 4,
        cutoffSlots: null,
        showLoads: true,
        workRows: loads,
        alpha,
      }),
    );

    const rx = 545;
    nodes.push(
      txt(
        mv > 0.5 ? 'Token 4  ·  rerouted to E4' : 'Token 4  ·  dropless (all 8 rows run)',
        rx,
        -225,
        28,
        mv > 0.5 ? ROLE.alt : ROLE.active,
        'mono',
        'center',
      ).opacity(alpha),

      // First contribution (E1 -> E4 trial)
      lumBar(rx, -110, 560, 128, {
        color: mv > 0.5 ? EXP_COLORS[3] : al > 0.25 ? ROLE.router : EXP_COLORS[0],
        fillOpacity: 0.24,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      txt(
        mv > 0.5
          ? 'E4 replaces E1 (gate 0.6)'
          : al > 0.25
            ? 'Trial: E4 returns [5, 0]'
            : 'E1 executes tail (slot 5)',
        rx,
        -136,
        28,
        mv > 0.5 ? EXP_COLORS[3] : al > 0.25 ? ROLE.router : EXP_COLORS[0],
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        cmp > 0.25
          ? '0.6 x [5, 0]  =  [3.0, 0.0]'
          : al > 0.25
            ? '0.6 x [5, 0]  =  [?, 0.0]'
            : '0.6 x [2, 0]  =  [1.2, 0.0]',
        rx,
        -82,
        32,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      // Second contribution (E3 stays fixed)
      lumBar(rx, 50, 560, 118, {
        color: EXP_COLORS[2],
        fillOpacity: 0.2,
        strokeWidth: 2.2,
        glow: 6,
        opacity: alpha,
      }),
      txt('E3 unchanged (slot 2)', rx, 26, 26, EXP_COLORS[2], 'mono', 'center').opacity(alpha),
      txt('0.4 x [0, 3]  =  [0.0, 1.2]', rx, 76, 32, COSMOS.ink, 'mono', 'center').opacity(alpha),

      // Resultant output box
      lumBar(rx, 218, 600, 134, {
        color: cmp > 0.25 ? ROLE.alt : ROLE.token,
        fillOpacity: 0.26,
        strokeWidth: 2.6,
        glow: 10,
        opacity: alpha,
      }),
      txt(
        cmp > 0.25
          ? 'Rerouted (was [1.2, 1.2])'
          : al > 0.25
            ? 'Predicted rerouted output'
            : 'Dropless output',
        rx,
        184,
        26,
        COSMOS.muted,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        cmp > 0.25 ? '[3.0, 1.2]' : al > 0.25 ? '[?, 1.2]' : '[1.2, 1.2]',
        rx,
        242,
        44,
        cmp > 0.25 ? ROLE.alt : al > 0.25 ? ROLE.router : ROLE.token,
        'mono',
        'center',
      )
        .glow(9, cmp > 0.25 ? ROLE.alt : ROLE.token)
        .opacity(alpha),
    );

    if (cmp > 0.25) {
      nodes.push(
        txt(
          'Rerouting trims E1 from 8 to 7 rows, but changes token 4 from [1.2, 1.2] to [3.0, 1.2]',
          0,
          395,
          28,
          ROLE.alt,
          'mono',
          'center',
        )
          .glow(7, ROLE.alt)
          .opacity(alpha),
      );
    } else if (al > 0.25) {
      nodes.push(
        txt(
          'If E4 ([5, 0]) replaces E1 with gate 0.6, what will token 4 first coordinate be?',
          0,
          395,
          30,
          ROLE.router,
          'serif',
          'center',
        )
          .glow(7, ROLE.router)
          .opacity(alpha),
      );
    } else {
      nodes.push(
        txt(
          ht > 0.25
            ? 'MegaBlocks block-sparse kernels run all 8 rows of E1 without padding, but hot queue still stalls'
            : 'Dropless execution admits slot 5 and restores [1.2, 1.2]',
          0,
          395,
          28,
          ht > 0.25 ? ROLE.router : ROLE.active,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    void tl;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.active, ROLE.alt), title, layer);

  playCue(s, c, 'execute-tail', (d) => s.play(pTail.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'hot-queue', (d) => s.play(pHot.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'alternative-expert', (d) => s.play(pAlt.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'move-four', (d) => s.play(pMove.to(1, { duration: d })), { dur: 0.8 });
  playCue(s, c, 'compare-returns', (d) => s.play(pCompare.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 21: capacity-arithmetic: "Count assignments before choosing an overflow policy"
// ---------------------------------------------------------------------------
export function capacityArithmetic(s, c) {
  const title = heroTitle(['Count assignments before', 'choosing an overflow policy'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const eq = glowTex(
    '\\text{Slots} = \\left\\lceil \\frac{T \\cdot k}{N} \\times c \\right\\rceil',
    {
      x: 520,
      y: -380,
      size: 42,
      color: ROLE.router,
    },
  );

  const cap10 = moeCapacity(4096, 2, 32, 1.0, [400]); // 8192, 256, 144
  const cap12 = moeCapacity(4096, 2, 32, 1.2, [400]); // 8192, 308, 92

  const pB0 = s.value(0.5);
  const pAssign = s.value(0);
  const pSlots = s.value(0);
  const pOver = s.value(0);
  const pB1 = s.value(0);
  const pB2 = s.value(0);
  const pFactor = s.value(0); // 0 -> 1 morphs c: 1.0 -> 1.2
  const pCeil = s.value(0);
  const pRem = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const asg = pAssign.value;
    const sl = pSlots.value;
    const ov = pOver.value;
    const b1 = pB1.value;
    const fac = pFactor.value;
    const cl = pCeil.value;
    const rm = pRem.value;

    const curC = lerp(1.0, 1.2, clamp(fac));
    const curSlots = Math.round(lerp(cap10.slots, cap12.slots, clamp(fac)));
    const curOver = 400 - curSlots;
    const nodes = [];

    // Top conversion strip: 4,096 tokens -> 8,192 assignments -> 256 / 308 slots
    const chips = [
      { x: -640, cap: 'Tokens T', val: '4,096', col: ROLE.token },
      {
        x: -215,
        cap: 'Assigns T · k (k=2)',
        val: asg > 0.2 ? '8,192' : '4,096 x 2',
        col: ROLE.expert,
      },
      {
        x: 215,
        cap: `Slots (N=32, c=${fmt(curC, 1)})`,
        val: sl > 0.2 ? `${curSlots} slots` : '?',
        col: cl > 0.2 ? ROLE.active : ROLE.router,
      },
      {
        x: 640,
        cap: 'Overflow / 400',
        val: ov > 0.2 ? `${curOver} overflow` : '?',
        col: ROLE.overflow,
      },
    ];

    chips.forEach((ch, i) => {
      nodes.push(
        lumBar(ch.x, -165, 380, 128, {
          color: ch.col,
          fillOpacity: 0.2,
          strokeWidth: 2.5,
          glow: 8,
          opacity: alpha,
        }),
        txt(ch.cap, ch.x, -196, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
        txt(ch.val, ch.x, -142, 34, ch.col, 'mono', 'center').glow(7, ch.col).opacity(alpha),
      );
      if (i < 3) {
        nodes.push(
          arrow([ch.x + 196, -165], [chips[i + 1].x - 196, -165], {
            stroke: '#6c82b6',
            width: 3,
            tip: 12,
          }).opacity(alpha),
        );
      }
    });

    // Horizontal hot-expert capacity bar (400 total arrivals)
    const barW = 1480;
    const barLeft = -barW / 2;
    const barY = 30;
    const fitW = (curSlots / 400) * barW;
    const overW = barW - fitW;

    nodes.push(
      txt(
        'Hot expert queue:  400 arriving assignments',
        0,
        -42,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      lumBar(barLeft + fitW / 2, barY, fitW - 4, 86, {
        color: ROLE.active,
        fillOpacity: 0.42,
        strokeWidth: 2.8,
        glow: 10,
        radius: 6,
        opacity: alpha,
      }),
      lumBar(barLeft + fitW + overW / 2, barY, Math.max(12, overW - 4), 86, {
        color: ROLE.overflow,
        fillOpacity: 0.42,
        strokeWidth: 2.8,
        glow: 10,
        radius: 6,
        opacity: alpha,
      }),
      txt(
        `${curSlots} admitted`,
        barLeft + fitW / 2,
        barY,
        32,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
      txt(
        `${curOver} overflow`,
        barLeft + fitW + overW / 2,
        barY,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Three overflow policy summaries at bottom
    const policies = [
      {
        x: -550,
        name: 'Drop overflow',
        desc: 'Skip update; keep residual',
        col: ROLE.overflow,
      },
      { x: 0, name: 'Reroute', desc: 'Spare expert; new function', col: ROLE.router },
      {
        x: 550,
        name: 'Dropless GEMM',
        desc: 'Run all 400 on orig expert',
        col: ROLE.active,
      },
    ];
    policies.forEach((pol) => {
      nodes.push(
        lumBar(pol.x, 220, 510, 118, {
          color: b1 > 0.25 ? pol.col : '#4a5c88',
          fillOpacity: b1 > 0.25 ? 0.22 : 0.12,
          strokeWidth: 2.2,
          glow: b1 > 0.25 ? 7 : 2,
          opacity: alpha,
        }),
        txt(pol.name, pol.x, 194, 28, pol.col, 'mono', 'center').opacity(alpha),
        txt(pol.desc, pol.x, 244, 26, COSMOS.muted, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        rm > 0.25
          ? 'c = 1.2 raises ceil(307.2) = 308 slots -> admits +52 tickets, reserves buffer at all 32 experts'
          : 'Assignments (8,192) remain distinct from sequence tokens (4,096)',
        0,
        378,
        28,
        rm > 0.25 ? ROLE.active : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    void pB2.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.overflow), title, eq, layer);

  playCue(s, c, 'mo-capacity-arithmetic-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-capacity-assignments', (d) => s.play(pAssign.to(1, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'mo-capacity-slots', (d) => s.play(pSlots.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-capacity-overflow', (d) => s.play(pOver.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-capacity-arithmetic-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.65,
  });
  playCue(s, c, 'mo-capacity-arithmetic-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-capacity-factor', (d) => s.play(pFactor.to(1, { duration: d })), { dur: 0.85 });
  playCue(s, c, 'mo-capacity-ceiling', (d) => s.play(pCeil.to(1, { duration: d })), { dur: 0.55 });
  playCue(s, c, 'mo-capacity-remainder', (d) => s.play(pRem.to(1, { duration: d })), { dur: 0.55 });
}

// ---------------------------------------------------------------------------
// Scene 22: parameter-memory: "Count the stored pool and the active path"
// ---------------------------------------------------------------------------
export function parameterMemory(s, c) {
  const title = heroTitle(['Count the stored pool', 'and the active path'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.expert,
  });

  const view3d = buildWeightVault3d({ x: 615, y: -345, unit: 44 });

  const pStored = s.value(0.5);
  const pAll = s.value(0);
  const pActive = s.value(0);
  const pSep = s.value(0);
  const pBytes = s.value(0);
  const pPlace = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const st = pStored.value;
    const al = pAll.value;
    const ac = pActive.value;
    const sp = pSep.value;
    const by = pBytes.value;
    const pl = pPlace.value;
    const nodes = [];

    const barLeft = -780;
    const scale = 76; // px per B (19B -> 1444px)
    const storedY = -65;
    const activeY = 135;

    // Top bar: 19B stored (3B shared + 8 x 2B experts)
    nodes.push(
      txt(
        al > 0.25
          ? 'STORED POOL:  3B shared + 8 x 2B experts = 19B total'
          : 'Hypothetical MoE weight pool',
        barLeft,
        storedY - 72,
        28,
        ROLE.expert,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(barLeft + (3 * scale) / 2, storedY, 3 * scale - 6, 86, {
        color: ROLE.token,
        fillOpacity: 0.36,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      txt(
        '3B shared',
        barLeft + (3 * scale) / 2,
        storedY,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    for (let i = 0; i < 8; i++) {
      const bx = barLeft + (3 + i * 2 + 1) * scale;
      const isAct = i === 0 || i === 2;
      nodes.push(
        lumBar(bx, storedY, 2 * scale - 8, 86, {
          color: isAct ? ROLE.active : ROLE.expert,
          fillOpacity: isAct ? 0.36 : 0.22 * (0.4 + 0.6 * st),
          strokeWidth: isAct ? 2.6 : 1.8,
          glow: isAct ? 9 : 4,
          opacity: alpha,
        }),
        txt(`E${i + 1}`, bx, storedY - 14, 26, COSMOS.ink, 'mono', 'center').opacity(alpha),
        txt('2B', bx, storedY + 20, 26, COSMOS.muted, 'mono', 'center').opacity(alpha),
      );
    }

    // Lower bar: 7B active per token (3B shared + 2 x 2B selected)
    nodes.push(
      txt(
        ac > 0.25
          ? 'ACTIVE PATH (1 token):  3B shared + 2 x 2B selected = 7B active'
          : 'Active parameters per token',
        barLeft,
        activeY - 72,
        28,
        ROLE.active,
        'mono',
        'left',
      ).opacity((0.45 + 0.55 * ac) * alpha),
      lumBar(barLeft + (3 * scale) / 2, activeY, 3 * scale - 6, 86, {
        color: ROLE.token,
        fillOpacity: 0.38,
        strokeWidth: 2.6,
        glow: 9,
        opacity: (0.45 + 0.55 * ac) * alpha,
      }),
      txt(
        '3B shared',
        barLeft + (3 * scale) / 2,
        activeY,
        26,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity((0.45 + 0.55 * ac) * alpha),
      lumBar(barLeft + 4 * scale, activeY, 2 * scale - 8, 86, {
        color: ROLE.active,
        fillOpacity: 0.44,
        strokeWidth: 2.8,
        glow: 10,
        opacity: (0.45 + 0.55 * ac) * alpha,
      }),
      txt('E1 (2B)', barLeft + 4 * scale, activeY, 26, COSMOS.ink, 'mono', 'center').opacity(
        (0.45 + 0.55 * ac) * alpha,
      ),
      lumBar(barLeft + 6 * scale, activeY, 2 * scale - 8, 86, {
        color: ROLE.active,
        fillOpacity: 0.44,
        strokeWidth: 2.8,
        glow: 10,
        opacity: (0.45 + 0.55 * ac) * alpha,
      }),
      txt('E3 (2B)', barLeft + 6 * scale, activeY, 26, COSMOS.ink, 'mono', 'center').opacity(
        (0.45 + 0.55 * ac) * alpha,
      ),
    );

    // Ghosted idle region + 38 GB raw bytes readout on lower right
    const idleLeft = barLeft + 7 * scale + 12;
    const idleW = 12 * scale - 16;
    nodes.push(
      lumBar(idleLeft + idleW / 2, activeY, idleW, 86, {
        color: '#465884',
        fillOpacity: 0.1,
        strokeWidth: 1.6,
        glow: 0,
        opacity: (0.4 + 0.6 * sp) * alpha,
      }),
      txt(
        by > 0.25 ? '19B x 2B = 38 GB raw (+ KV & work)' : '12B idle for this token, still stored',
        idleLeft + idleW / 2,
        activeY,
        26,
        by > 0.25 ? ROLE.router : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(by > 0.25 ? 7 : 0, ROLE.router)
        .opacity(alpha),

      txt(
        pl > 0.25
          ? 'Sharding, quantization, and offloading change placement with distinct latency tradeoffs'
          : 'Total parameters govern memory residency; active parameters govern per-token FLOPs',
        0,
        325,
        28,
        pl > 0.25 ? ROLE.token : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.expert, ROLE.active), title, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.22, phi: 0.96, distance: 14.4 });

  playCue(s, c, 'stored-parameters', (d) => s.play(pStored.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'all-partitions', (d) => s.play(pAll.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'active-partitions', (d) => s.play(pActive.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'stored-active-bars', (d) => s.play(pSep.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'parameter-bytes', (d) => s.play(pBytes.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'placement-costs', (d) => s.play(pPlace.to(1, { duration: d })), { dur: 0.65 });
}

// ---------------------------------------------------------------------------
// Scene 23: residency-budget: "Place the complete pool in the memory budget"
// ---------------------------------------------------------------------------
export function residencyBudget(s, c) {
  const title = heroTitle(['Place the complete pool', 'in the memory budget'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.overflow,
  });

  const pB0 = s.value(0.5);
  const pPool = s.value(0);
  const pGap = s.value(0);
  const pB1 = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const pl = pPool.value;
    const gp = pGap.value;
    const b1 = pB1.value;
    const b2 = pB2.value;
    const nodes = [];

    const barLeft = -760;
    const barW = 1520; // 38 GB -> 40 px / GB
    const scale = barW / 38;
    const poolY = -130;
    const budY = 10;

    // 38 GB stored pool bar
    nodes.push(
      txt(
        'Complete raw pool:  19B x 2 bytes = 38 decimal GB  (1 GB = 10^9 B)',
        barLeft,
        poolY - 68,
        28,
        ROLE.router,
        'mono',
        'left',
      ).opacity(alpha),
      lumBar(0, poolY, barW, 82, {
        color: pl > 0.25 ? ROLE.router : ROLE.expert,
        fillOpacity: 0.3,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      txt(
        '38 GB raw weights  (all 19B parameters)',
        0,
        poolY,
        30,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // 14 GB device budget vs 24 GB shortfall bracket
    const budW = 14 * scale; // 560 px
    const gapW = 24 * scale; // 960 px
    nodes.push(
      lumBar(barLeft + budW / 2, budY, budW, 82, {
        color: ROLE.active,
        fillOpacity: 0.34,
        strokeWidth: 2.6,
        glow: 9,
        opacity: alpha,
      }),
      txt(
        '14 GB device budget',
        barLeft + budW / 2,
        budY,
        28,
        COSMOS.ink,
        'mono',
        'center',
      ).opacity(alpha),

      lumBar(barLeft + budW + gapW / 2, budY, gapW - 6, 82, {
        color: gp > 0.25 ? ROLE.overflow : '#4a5c88',
        fillOpacity: gp > 0.25 ? 0.34 : 0.12,
        strokeWidth: gp > 0.25 ? 2.8 : 1.8,
        glow: gp > 0.25 ? 11 : 2,
        opacity: alpha,
      }),
      txt(
        gp > 0.25
          ? '24 GB shortfall  (+ KV cache, workspaces, replicas)'
          : 'Shortfall before cache & workspace',
        barLeft + budW + gapW / 2,
        budY,
        28,
        gp > 0.25 ? COSMOS.ink : COSMOS.dim,
        'mono',
        'center',
      ).opacity(alpha),
    );

    // Lower three cards (minimal glowing bars, zero prose boxes): Placement, Training, Cold Experts
    const cols = [
      {
        x: -550,
        head: 'Placement options',
        body: 'Sharding · Quant · Offloading',
        on: b1 > 0.25,
        col: ROLE.token,
      },
      {
        x: 0,
        head: 'Training adds more',
        body: 'Grads + optimizer > weights',
        on: b1 > 0.25,
        col: ROLE.router,
      },
      {
        x: 550,
        head: 'Cold experts in training',
        body: 'Momentum / decay still update',
        on: b2 > 0.25,
        col: ROLE.alt,
      },
    ];
    cols.forEach((cItem) => {
      nodes.push(
        lumBar(cItem.x, 215, 510, 134, {
          color: cItem.on ? cItem.col : '#4b5d8a',
          fillOpacity: cItem.on ? 0.24 : 0.12,
          strokeWidth: cItem.on ? 2.6 : 1.8,
          glow: cItem.on ? 9 : 2,
          opacity: alpha,
        }),
        txt(cItem.head, cItem.x, 186, 28, cItem.col, 'mono', 'center').opacity(alpha),
        txt(cItem.body, cItem.x, 240, 26, COSMOS.ink, 'sans', 'center').opacity(alpha),
      );
    });

    nodes.push(
      txt(
        b2 > 0.25
          ? 'Track weight residency, task gradients, and optimizer updates as three distinct budgets'
          : '7B active FLOPs does not shrink a 38 GB resident checkpoint to 14 GB',
        0,
        378,
        28,
        b2 > 0.25 ? ROLE.alt : ROLE.overflow,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.overflow, ROLE.router), title, layer);

  playCue(s, c, 'mo-residency-budget-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-residency-pool', (d) => s.play(pPool.to(1, { duration: d })), { dur: 0.6 });
  playCue(s, c, 'mo-residency-gap', (d) => s.play(pGap.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-residency-budget-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.7,
  });
  playCue(s, c, 'mo-residency-budget-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.7,
  });
}

// ---------------------------------------------------------------------------
// Scene 24: expert-arithmetic: "Count the matrices inside each expert"
// ---------------------------------------------------------------------------
export function expertArithmetic(s, c) {
  const title = heroTitle(['Count the matrices', 'inside each expert'], {
    x: -850,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.token,
  });

  const eq = glowTex(
    '\\text{2-proj FFN} \\approx 4THI \\quad \\text{vs} \\quad \\text{SwiGLU} \\approx 6THI',
    {
      x: -35,
      y: -380,
      size: 36,
      color: ROLE.router,
    },
  );

  const view3d = buildTensorSlabs3d({ x: 670, y: -375, unit: 38 });

  const pB0 = s.value(0.5);
  const pProj = s.value(0);
  const pFFN = s.value(0);
  const pB1 = s.value(0);
  const pSwi = s.value(0);
  const pB2 = s.value(0);
  const vis = s.value(1);

  const layer = guardedDynamic(vis, (alpha) => {
    const pr = pProj.value;
    const ff = pFFN.value;
    const b1 = pB1.value;
    const sw = pSwi.value;
    const b2 = pB2.value;
    const nodes = [];

    // Left panel: Standard 2-projection FFN (4 T H I)
    const lx = -435;
    nodes.push(
      txt('Standard 2-projection FFN', lx, -182, 32, ROLE.expert, 'mono', 'center').opacity(alpha),
      lumBar(lx - 170, -65, 290, 128, {
        color: ROLE.expert,
        fillOpacity: 0.2 + 0.16 * pr,
        strokeWidth: 2.5,
        glow: 6 + 4 * pr,
        opacity: alpha,
      }),
      txt('Up:  H -> I', lx - 170, -88, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('~ 2 T H I', lx - 170, -40, 28, ROLE.token, 'mono', 'center').opacity(alpha),

      arrow([lx - 16, -65], [lx + 16, -65], { stroke: ROLE.expert, width: 3.4, tip: 12 }).opacity(
        alpha,
      ),

      lumBar(lx + 170, -65, 290, 128, {
        color: ROLE.expert,
        fillOpacity: 0.2 + 0.16 * ff,
        strokeWidth: 2.5,
        glow: 6 + 4 * ff,
        opacity: alpha,
      }),
      txt('Down:  I -> H', lx + 170, -88, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('~ 2 T H I', lx + 170, -40, 28, ROLE.token, 'mono', 'center').opacity(alpha),

      lumBar(lx, 125, 580, 108, {
        color: ff > 0.25 ? ROLE.token : '#4b5e8a',
        fillOpacity: ff > 0.25 ? 0.28 : 0.14,
        strokeWidth: 2.6,
        glow: ff > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'Total matrix work:  ~ 4 T H I',
        lx,
        125,
        32,
        ff > 0.25 ? ROLE.token : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(ff > 0.25 ? 7 : 0, ROLE.token)
        .opacity(alpha),
    );

    // Right panel: SwiGLU 3-projection expert (6 T H I)
    const rx = 435;
    nodes.push(
      txt('SwiGLU 3-projection expert', rx, -182, 32, ROLE.router, 'mono', 'center').opacity(alpha),
      lumBar(rx - 180, -110, 280, 86, {
        color: b1 > 0.2 ? ROLE.router : '#4e608e',
        fillOpacity: b1 > 0.2 ? 0.28 : 0.14,
        strokeWidth: 2.4,
        glow: b1 > 0.2 ? 8 : 3,
        opacity: alpha,
      }),
      txt('Gate (2THI)', rx - 180, -110, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      lumBar(rx - 180, -2, 280, 86, {
        color: b1 > 0.2 ? ROLE.token : '#4e608e',
        fillOpacity: b1 > 0.2 ? 0.28 : 0.14,
        strokeWidth: 2.4,
        glow: b1 > 0.2 ? 8 : 3,
        opacity: alpha,
      }),
      txt('Up (2THI)', rx - 180, -2, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),

      txt('x', rx - 10, -56, 36, ROLE.alt, 'mono', 'center').opacity(alpha),

      lumBar(rx + 175, -56, 280, 148, {
        color: sw > 0.2 ? ROLE.active : '#4e608e',
        fillOpacity: sw > 0.2 ? 0.3 : 0.14,
        strokeWidth: 2.6,
        glow: sw > 0.2 ? 10 : 3,
        opacity: alpha,
      }),
      txt('Down: I -> H', rx + 175, -80, 28, COSMOS.ink, 'mono', 'center').opacity(alpha),
      txt('~ 2 T H I', rx + 175, -32, 28, ROLE.active, 'mono', 'center').opacity(alpha),

      lumBar(rx, 125, 580, 108, {
        color: sw > 0.25 ? ROLE.active : '#4b5e8a',
        fillOpacity: sw > 0.25 ? 0.3 : 0.14,
        strokeWidth: 2.6,
        glow: sw > 0.25 ? 10 : 3,
        opacity: alpha,
      }),
      txt(
        'Total matrix work:  ~ 6 T H I',
        rx,
        125,
        32,
        sw > 0.25 ? ROLE.active : COSMOS.muted,
        'mono',
        'center',
      )
        .glow(sw > 0.25 ? 7 : 0, ROLE.active)
        .opacity(alpha),

      txt(
        b2 > 0.25
          ? 'Compare intermediate width I, shared experts, attention, and dispatch, not expert count alone'
          : 'Multiply-add convention: each (T x H) @ (H x I) matmul costs ~ 2 T H I FLOPs',
        0,
        340,
        28,
        b2 > 0.25 ? ROLE.router : COSMOS.muted,
        'sans',
        'center',
      ).opacity(alpha),
    );

    void pB0.value;
    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.token, ROLE.router), title, eq, view3d, layer);
  orbitScene(s, c, view3d, { theta: -0.24, phi: 0.94, distance: 14.2 });

  playCue(s, c, 'mo-expert-arithmetic-op-0', (d) => s.play(pB0.to(1, { duration: d })), {
    dur: 0.4,
  });
  playCue(s, c, 'mo-projection-work', (d) => s.play(pProj.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-ffn-work', (d) => s.play(pFFN.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-expert-arithmetic-op-1', (d) => s.play(pB1.to(1, { duration: d })), {
    dur: 0.6,
  });
  playCue(s, c, 'mo-swiglu-work', (d) => s.play(pSwi.to(1, { duration: d })), { dur: 0.65 });
  playCue(s, c, 'mo-expert-arithmetic-op-2', (d) => s.play(pB2.to(1, { duration: d })), {
    dur: 0.65,
  });
}
