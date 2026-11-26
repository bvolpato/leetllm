// Scene 4: insertion: Three-lane tensor pipeline: Absolute (+E), RoPE (Q/K rotate), ALiBi (score bias).
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, bindStepCues, clockDial, glowDot, heroTitle, txt } from '../parts.mjs';

const ALL_CUES = [
  'rp-insertion-0-0',
  'insertion-embedding-insertion-0-b1-1',
  'rp-insertion-0-1',
  'rp-insertion-1-0',
  'rp-insertion-1-1',
  'insertion-qk-insertion-1-b2-1',
  'rp-insertion-1-2',
  'insertion-score-insertion-2-b3-1',
  'rp-insertion-2-0',
  'rp-insertion-2-1',
  'rp-insertion-2-2',
];

export default function insertion(s, c) {
  const step = s.value(0);

  const title = heroTitle(['Where can', 'position enter?'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 66,
    accent: ROLE.query,
    eyebrow: 'THREE INSERTION ROUTES',
  });

  const picture = dynamic(() => {
    const st = step.value;
    const activeLane = st < 3.5 ? 0 : st < 7.2 ? 1 : 2;
    const dialAngle = Math.max(0, (st - 4) * 0.48);

    const nodes = [];

    // Pipeline columns shifted right so left labels (-860 .. -530) never touch any rail!
    const colXs = [-380, -100, 190, 480, 740];
    const colNames = ['Embedding x', 'Project Q, K', 'QKᵀ / √d', 'Softmax', 'Mix V'];
    colXs.forEach((cx, i) => {
      nodes.push(txt(colNames[i], cx, -228, 26, COSMOS.dim, 'mono'));
    });

    const lanes = [
      {
        name: '1. Absolute',
        sub: 'x + p(m)',
        y: -100,
        col: COSMOS.blue,
        injectAt: 0,
        badge: '+ p(m)',
        badgeW: 168,
      },
      {
        name: '2. RoPE',
        sub: 'R(mθ)q, R(nθ)k',
        y: 75,
        col: ROLE.query,
        injectAt: 1,
        badge: 'rotate Q, K',
        badgeW: 210,
      },
      {
        name: '3. ALiBi',
        sub: 'score − m·|i−j|',
        y: 250,
        col: ROLE.alibi,
        injectAt: 2,
        badge: '− bias',
        badgeW: 168,
      },
    ];

    const railStart = -490;
    const railEnd = 810;

    lanes.forEach((lane, idx) => {
      const lit = idx === activeLane;
      const op = lit ? 1 : 0.36;
      const injX = colXs[lane.injectAt];
      const halfB = lane.badgeW * 0.5 + 10;

      // Split glowing rail cleanly around the badge box so zero strokes cross text!
      if (injX - halfB > railStart) {
        nodes.push(
          line([railStart, lane.y], [injX - halfB, lane.y], {
            stroke: lane.col,
            width: lit ? 4.0 : 2.0,
          })
            .opacity(op)
            .glow(lit ? 8 : 0, lane.col)
            .set('blend', 'screen'),
        );
      }
      nodes.push(
        line([injX + halfB, lane.y], [railEnd, lane.y], {
          stroke: lane.col,
          width: lit ? 4.0 : 2.0,
        })
          .opacity(op)
          .glow(lit ? 8 : 0, lane.col)
          .set('blend', 'screen'),
        txt(lane.name, -860, lane.y - 20, 28, lane.col, 'mono', 'left').opacity(op),
        txt(lane.sub, -860, lane.y + 22, 26, COSMOS.muted, 'mono', 'left').opacity(op),
      );

      colXs.forEach((cx, ci) => {
        if (ci === lane.injectAt) {
          nodes.push(
            rect(lane.badgeW, 56, {
              fill: '#111626',
              stroke: lane.col,
              width: lit ? 3.2 : 1.8,
              radius: 12,
            })
              .at(cx, lane.y)
              .opacity(op)
              .glow(lit ? 10 : 0, lane.col),
            txt(lane.badge, cx, lane.y, 26, lane.col, 'mono').opacity(op),
          );
        } else {
          nodes.push(
            glowDot(cx, lane.y, {
              radius: lit ? 7 : 5,
              color: lane.col,
              glow: lit ? 10 : 0,
            }).opacity(op),
          );
        }
      });
    });

    // Bottom straight Values highway: line sits cleanly ABOVE the caption text
    const valLineY = 360;
    nodes.push(
      line([railStart, valLineY], [colXs[4], valLineY], {
        stroke: ROLE.score,
        width: 3.4,
        dash: [8, 6],
      })
        .opacity(0.88)
        .glow(6, ROLE.score),
      arrow([colXs[4], valLineY], [colXs[4], 275], { stroke: ROLE.score, width: 3.2, tip: 14 }),
      txt(
        'Values V travel straight to Mix V (unrotated in RoPE & ALiBi)',
        -860,
        valLineY + 46,
        26,
        ROLE.score,
        'sans',
        'left',
      ),
    );

    // Mini spinning RoPE dial floating cleanly in top-right corner
    nodes.push(
      clockDial({
        cx: 740,
        cy: -365,
        radius: 76,
        queryAngle: dialAngle,
        keyAngle: dialAngle - 0.65,
        showAxes: false,
        showWake: true,
        showAngleArc: activeLane === 1,
        auraColor: null,
      }),
    );

    return group(...nodes);
  });

  s.add(title, picture);
  bindStepCues(s, c, step, ALL_CUES, 0.5);
}
