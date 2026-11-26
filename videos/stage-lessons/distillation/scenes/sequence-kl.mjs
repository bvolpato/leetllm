// Scene 12: Whose paths reach the second token? (Sequence KL chain rule, GKD & MiniLLM)
import {
  COSMOS,
  JOINT,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  kl,
  rect,
  remainAfterDuration,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function sequenceKl(s, c) {
  const phase = s.value(0);
  const sFirst = s.value(0);
  const sAfterA = s.value(0);
  const sAfterB = s.value(0);
  const sChain = s.value(0); // beat 2+
  const sFwdRes = s.value(0);
  const sRev = s.value(0);
  const sUni = s.value(0);
  const sMethods = s.value(0); // beat 4 (GKD vs MiniLLM)

  const bgAura = aura(0, 30, 620, '#14325c26', '#2d1c5014');
  const title = heroTitle(['Whose Paths Reach', 'the Second Token?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'SEQUENCE KL CHAIN RULE · PREFIX WEIGHTS · GKD & MINILLM',
  });

  const eqChain = glowTex(
    'D_{\\mathrm{KL}}(Q \\Vert P) = D_1 + \\sum_{x_1} Q(x_1)\\, D_2(\\cdot \\mid x_1)',
    {
      x: 390,
      y: -365,
      size: 32,
      color: COSMOS.gold,
      glow: 6,
    },
  );

  const uniformFwd = JOINT.first + 0.5 * (JOINT.conditional[0] + JOINT.conditional[1]);
  const revFirst = kl(JOINT.p0, JOINT.q0);
  const revCond = JOINT.p1.map((p, i) => kl(p, JOINT.q1[i]));
  const pct = (v) => `${Math.round(v * 100)}%`;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);
    const sp = Math.max(0.35, sFirst.value);
    const ba = sAfterA.value;
    const bb = sAfterB.value;
    const ch = sChain.value > 0.5;
    const fr = sFwdRes.value > 0.5;
    const rv = sRev.value > 0.5;
    const un = sUni.value > 0.5;
    const mt = sMethods.value > 0.5;

    const stripLeft = -555;
    const stripW = 1360;
    const nodes = [
      txt(
        'COMPLETE 2-TOKEN PATH STRIPS (TOTAL = 100%)',
        stripLeft,
        -218,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    ];

    const strips = [
      {
        name: 'TEACHER',
        pref: JOINT.q0,
        next: JOINT.q1,
        joint: JOINT.q,
        col: COSMOS.blue,
        fill: '#17386b',
        y: -148,
      },
      {
        name: 'STUDENT',
        pref: JOINT.p0,
        next: JOINT.p1,
        joint: JOINT.p,
        col: COSMOS.cyan,
        fill: '#0e3c50',
        y: 18,
      },
    ];

    strips.forEach(({ name, pref, next, joint, col, fill, y }) => {
      nodes.push(
        txt(name, -835, y, 30, col, 'mono', 'left'),
        rect(stripW, 58, { fill: '#10182b', stroke: COSMOS.rule, width: 1.8, radius: 6 }).at(
          stripLeft + stripW * 0.5,
          y,
        ),
      );
      let cursorX = stripLeft;
      ['A', 'B'].forEach((tok, j) => {
        const w = stripW * pref[j];
        const branchVis = j === 0 ? ba : bb;
        nodes.push(
          rect(w - 6, 54, { fill, stroke: col, width: 2.2, radius: 6 })
            .at(cursorX + w * 0.5, y)
            .opacity(sp),
          txt(`${tok} ${pct(pref[j])}`, cursorX + w * 0.5, y + 2, 28, COSMOS.ink, 'mono').opacity(
            sp,
          ),
        );
        let subX = cursorX;
        ['A', 'B'].forEach((suf, k) => {
          const sw = w * next[j][k];
          const jVal = joint[2 * j + k];
          if (branchVis > 0.1) {
            nodes.push(
              rect(Math.max(18, sw - 4), 46, {
                fill: '#101a2f',
                stroke: col,
                width: 1.8,
                radius: 5,
              })
                .at(subX + sw * 0.5, y + 62)
                .opacity(branchVis),
              txt(
                sw >= 135 ? `${tok}${suf} ${pct(jVal)}` : `${tok}${suf}`,
                subX + sw * 0.5,
                y + 64,
                26,
                col,
                'mono',
              ).opacity(branchVis),
            );
          }
          subX += sw;
        });
        cursorX += w;
      });
    });

    if (mt) {
      // Beat 4: GKD vs MiniLLM sequence distillation comparison
      nodes.push(
        glassCell(-425, 256, 790, 186, COSMOS.cyan, { fill: '#0e2336', glow: 8 * pulse }),
        txt('GKD (ON-POLICY MIXING)', -425, 198, 28, COSMOS.cyan, 'mono'),
        txt('Scores prefixes the student actually visits', -425, 248, 28, COSMOS.ink, 'sans'),
        txt('Collection fraction & divergence are separate', -425, 294, 26, COSMOS.muted, 'sans'),

        glassCell(425, 256, 790, 186, COSMOS.violet, { fill: '#1c1638', glow: 8 * pulse }),
        txt('MINILLM (SEQUENCE REVERSE KL)', 425, 198, 28, COSMOS.violet, 'mono'),
        txt(
          'Policy gradient credits earlier tokens for later match',
          425,
          248,
          26,
          COSMOS.ink,
          'sans',
        ),
        txt(
          'Adds teacher mixing & length norm (inspect outputs!)',
          425,
          294,
          26,
          COSMOS.muted,
          'sans',
        ),
      );
    } else if (!ch) {
      // Beats 0 & 1: Build joint paths & ask prediction question
      nodes.push(
        glassCell(0, 276, 1520, 126, bb > 0.5 ? COSMOS.gold : COSMOS.blue, {
          fill: bb > 0.5 ? '#201b0d' : '#101d35',
          dash: bb > 0.5 ? [8, 6] : undefined,
          glow: 7 * pulse,
        }),
        txt(
          bb > 0.5
            ? 'Forward sequence KL: what fraction of teacher probability reaches prefix B?'
            : ba > 0.3
              ? 'Teacher AA = 80% x 90% = 72%   ·   splitting B next...'
              : 'Teacher splits 80% A / 20% B   ·   Student splits 50% A / 50% B',
          0,
          278,
          28,
          bb > 0.5 ? COSMOS.gold : COSMOS.ink,
          'mono',
        ),
      );
    } else {
      // Beats 2 & 3: Chain-rule decomposition terms (Forward -> Reverse -> Uniform contrast)
      const weights = rv ? JOINT.p0 : JOINT.q0;
      const d1 = rv ? revFirst : JOINT.first;
      const conds = rv ? revCond : JOINT.conditional;
      const total = rv ? JOINT.reverse : JOINT.forward;
      const cols = [-600, -200, 200, 610];
      const labels = ['FIRST TOKEN', 'AFTER A', 'AFTER B', rv ? 'REVERSE TOTAL' : 'FORWARD TOTAL'];
      const vals = [
        d1.toFixed(4),
        `${weights[0].toFixed(1)} x ${conds[0].toFixed(3)}`,
        `${weights[1].toFixed(1)} x ${conds[1].toFixed(3)}`,
        fr || rv ? `${total.toFixed(4)} nats` : '?',
      ];
      labels.forEach((lbl, i) => {
        const isTot = i === 3;
        const col = isTot ? (rv ? COSMOS.cyan : COSMOS.gold) : COSMOS.rule;
        nodes.push(
          glassCell(cols[i], 238, 355, 118, col, {
            fill: isTot ? '#1c180f' : '#10182b',
            glow: isTot ? 8 * pulse : 2,
          }),
          txt(lbl, cols[i], 208, 26, COSMOS.muted, 'mono'),
          txt(vals[i], cols[i], 256, isTot ? 32 : 28, isTot ? col : COSMOS.ink, 'mono'),
        );
      });

      nodes.push(
        txt(
          un
            ? `Equal prefix weights (0.5 / 0.5) gives ${uniformFwd.toFixed(4)} nats != Forward ${JOINT.forward.toFixed(4)} nats`
            : rv
              ? 'Reverse KL weights prefixes by STUDENT [0.5, 0.5] -> 0.5309 nats'
              : fr
                ? 'Forward KL weights prefixes by TEACHER [0.8, 0.2] -> 0.5055 nats (matches joint KL)'
                : 'Forward KL weights prefixes by TEACHER [0.8, 0.2] -> add the three terms',
          0,
          362,
          28,
          un ? COSMOS.amber : rv ? COSMOS.cyan : fr ? COSMOS.emerald : COSMOS.gold,
          'mono',
        ),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eqChain, live);
  runPhase(s, c, phase, 14);

  c.on('joint-first', () => s.play(sFirst.to(1, { duration: 0.7 })));
  c.on('joint-after-a', () => s.play(sAfterA.to(1, { duration: 0.7 })));
  c.on('joint-after-b', () => s.play(sAfterB.to(1, { duration: 0.7 })));
  c.onBeat(2, () => s.play(sChain.to(1, { duration: 0.3 })));
  c.after('joint-forward', () =>
    s.play(sFwdRes.to(1, { duration: remainAfterDuration(c, 'joint-forward', 0.45) })),
  );
  c.on('joint-reverse', () => s.play(sRev.to(1, { duration: 0.55 })));
  c.on('joint-uniform', () =>
    s.play(sUni.to(1, { duration: remainDuration(c, 'joint-uniform', 0.5) })),
  );
  c.onBeat(4, () => s.play(sMethods.to(1, { duration: 0.35 })));
}
