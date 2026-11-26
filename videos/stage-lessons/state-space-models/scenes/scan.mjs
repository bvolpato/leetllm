// Scene 09: scan: Associative parallel prefix scan tree composing ordered affine pairs (a_t, b_t).
import {
  COSMOS,
  ROLE,
  aura,
  bindCueBeat,
  compose,
  glowTex,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  hs,
  pairs,
  playCue,
  txt,
  valuePill,
} from '../parts.mjs';

export default function scan(s, c) {
  const treeStage = s.value(0); // 0=4 leaf pairs, 1=compose 2 subtrees, 2=full root + all 4 prefixes, 3=fused SRAM note

  const bgAura = aura(0, 0, 740, '#16355e28', '#103c3618');
  const title = heroTitle(['Parallel Prefix Scan:', 'associative affine tree'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.delta,
  });

  const eq = glowTex(String.raw`(a_2, b_2) \circ (a_1, b_1) = (a_2 a_1,\; a_2 b_1 + b_2)`, {
    x: 420,
    y: -380,
    size: 34,
    color: ROLE.delta,
    glow: 6,
  });

  const leftPair = compose(pairs[1], pairs[0]); // [0.81, 0.74]
  const rightPair = compose(pairs[3], pairs[2]); // [0.81, 1.12]
  const totalPair = compose(rightPair, leftPair); // [0.6561, 1.7194]

  const leafXs = [-630, -210, 210, 630];
  const leafY = -175;
  const midY = 5;
  const outY = 195;

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const st = Math.round(treeStage.value);
    const nodes = [];

    // Row 0: 4 ordered leaf affine pairs (a_t, b_t)
    pairs.forEach(([a, b], idx) => {
      nodes.push(
        valuePill(`(${a.toFixed(1)}, ${b.toFixed(1)})`, leafXs[idx], leafY, {
          w: 225,
          h: 72,
          color: ROLE.carry,
          size: 30,
          opacity: alpha,
        }),
      );
    });

    // Row 1: adjacent subtree pairs (0..1) and (2..3) - quiet skeleton from t=0, illuminates at st >= 1
    const mxL = (leafXs[0] + leafXs[1]) * 0.5;
    const mxR = (leafXs[2] + leafXs[3]) * 0.5;
    const r1Op = st >= 1 ? alpha : alpha * 0.28;
    nodes.push(
      glowingTrail(
        [
          [leafXs[0], leafY + 38],
          [mxL, midY - 38],
        ],
        { color: st >= 1 ? ROLE.delta : COSMOS.rule, width: 3.5, opacity: r1Op },
      ),
      glowingTrail(
        [
          [leafXs[1], leafY + 38],
          [mxL, midY - 38],
        ],
        { color: st >= 1 ? ROLE.delta : COSMOS.rule, width: 3.5, opacity: r1Op },
      ),
      valuePill(
        st >= 1
          ? `(${leftPair[0].toFixed(2)}, ${leftPair[1].toFixed(2)})`
          : '(a_2·a_1, a_2·b_1+b_2)',
        mxL,
        midY,
        {
          w: 360,
          h: 72,
          color: st >= 1 ? ROLE.delta : COSMOS.rule,
          size: 28,
          glow: st >= 1 ? 10 : 0,
          opacity: r1Op,
        },
      ),
      glowingTrail(
        [
          [leafXs[2], leafY + 38],
          [mxR, midY - 38],
        ],
        { color: st >= 1 ? ROLE.delta : COSMOS.rule, width: 3.5, opacity: r1Op },
      ),
      glowingTrail(
        [
          [leafXs[3], leafY + 38],
          [mxR, midY - 38],
        ],
        { color: st >= 1 ? ROLE.delta : COSMOS.rule, width: 3.5, opacity: r1Op },
      ),
      valuePill(
        st >= 1
          ? `(${rightPair[0].toFixed(2)}, ${rightPair[1].toFixed(2)})`
          : '(a_4·a_3, a_4·b_3+b_4)',
        mxR,
        midY,
        {
          w: 360,
          h: 72,
          color: st >= 1 ? ROLE.delta : COSMOS.rule,
          size: 28,
          glow: st >= 1 ? 10 : 0,
          opacity: r1Op,
        },
      ),
    );

    // Row 2: All 4 inclusive prefix states (quiet slots from t=0, illuminate at st >= 2)
    const r2Op = st >= 2 ? alpha : alpha * 0.26;
    hs.forEach((hVal, idx) => {
      nodes.push(
        valuePill(
          st >= 2 ? `h_${idx + 1} = ${hVal.toFixed(4)}` : `h_${idx + 1} prefix`,
          leafXs[idx],
          outY,
          {
            w: 265,
            h: 74,
            color: st >= 2 ? ROLE.state : COSMOS.rule,
            size: 28,
            glow: st >= 2 ? 10 : 0,
            opacity: r2Op,
          },
        ),
      );
    });
    if (st >= 2) {
      nodes.push(
        txt(
          `Full composition: (${totalPair[0].toFixed(4)}, ${totalPair[1].toFixed(4)})  matches sequential recurrence exactly`,
          0,
          298,
          28,
          ROLE.state,
          'mono',
          'center',
        ).opacity(alpha),
      );
    }

    if (st >= 3) {
      nodes.push(
        txt(
          'Fused kernels keep expanded state on chip (SRAM); verify float rounding within tolerance',
          0,
          368,
          28,
          ROLE.read,
          'sans',
          'center',
        ).opacity(alpha),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'compose-two', (d) => s.play(treeStage.to(1, { duration: d })), { dur: 0.5 });
  playCue(s, c, 'all-prefix-states', (d) => s.play(treeStage.to(2, { duration: d })), {
    dur: 0.55,
  });
  playCue(s, c, 'fused-scan', (d) => s.play(treeStage.to(3, { duration: d })), { dur: 0.5 });
  bindCueBeat(s, c, s.value(0), ['affine-updates', 'ordered-tree', 'scan-reference']);
}
