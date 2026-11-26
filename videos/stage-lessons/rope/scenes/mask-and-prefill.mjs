// Scene 3: mask-and-prefill: Permutation equality through matrices & causal prefill visibility.
import { arrow, dynamic, group, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, bindStepCues, glowTex, heroTitle, txt } from '../parts.mjs';

const ALL_CUES = [
  'rp-mask-and-prefill-0-0',
  'rp-mask-and-prefill-0-1',
  'rp-mask-and-prefill-0-2',
  'rp-mask-and-prefill-0-3',
  'rp-mask-and-prefill-1-0',
  'rp-mask-and-prefill-1-1',
  'rp-mask-and-prefill-1-2',
  'rp-mask-and-prefill-1-3',
  'rp-mask-and-prefill-1-4',
];

export default function maskAndPrefill(s, c) {
  const step = s.value(0);

  const title = heroTitle(['Parallel work keeps', 'causal visibility'], {
    x: -860,
    y: -425,
    size: 56,
    lineHeight: 66,
    accent: ROLE.shift,
    eyebrow: 'UNMASKED CHAIN VS CAUSAL PREFILL',
  });

  const eq = glowTex(String.raw`\mathrm{Attn}(PX) = P\,\mathrm{Attn}(X)`, {
    x: 420,
    y: -365,
    size: 42,
    color: ROLE.query,
    glow: 6,
  });

  const live = dynamic(() => {
    const st = step.value;
    const causalPhase = Math.max(0, Math.min(1, (st - 4.2) / 1.2));
    const identV = Math.max(0, Math.min(1, (st - 8.1) / 0.8));
    const nodes = [];

    // Top pipeline: PX -> PQ,PK,PV -> P(QK^T)P^T -> softmax -> P*Out
    const stages = [
      { label: 'PX', sub: 'rows permuted', x: -720, col: COSMOS.ink },
      { label: 'PQ, PK, PV', sub: 'projected', x: -370, col: ROLE.query },
      { label: 'P(QKᵀ)Pᵀ', sub: 'both axes', x: -10, col: ROLE.key },
      { label: 'softmax', sub: 'row-wise', x: 345, col: ROLE.shift },
      { label: 'P·Out', sub: 'same rows', x: 695, col: ROLE.score },
    ];
    const pipeY = -160;
    const activeStage = Math.min(4, Math.floor(st));

    stages.forEach((sg, i) => {
      const lit = causalPhase < 0.5 && i <= activeStage;
      const dim = causalPhase > 0.5 ? 0.35 : lit ? 1 : 0.48;
      nodes.push(
        rect(240, 72, {
          fill: '#111626',
          stroke: sg.col,
          width: lit ? 2.8 : 1.6,
          radius: 14,
        })
          .at(sg.x, pipeY)
          .opacity(dim),
        txt(sg.label, sg.x, pipeY, 28, sg.col, 'mono').opacity(dim),
        txt(sg.sub, sg.x, pipeY + 66, 26, COSMOS.dim, 'sans').opacity(dim),
      );
      if (i < stages.length - 1) {
        nodes.push(
          arrow([sg.x + 128, pipeY], [stages[i + 1].x - 128, pipeY], {
            stroke: lit ? sg.col : '#334366',
            width: 2.8,
            tip: 13,
          }).opacity(dim),
        );
      }
    });

    // Lower-left: 3x3 Causal Permission Grid during parallel prefill
    const gLeft = -690;
    const gTop = 45;
    const cell = 112;
    const qHighlight = st >= 5.5 ? 1 : -1;
    nodes.push(
      txt(
        'Causal permission grid',
        gLeft + cell * 1.5,
        gTop - 74,
        26,
        causalPhase > 0.3 ? ROLE.score : COSMOS.dim,
        'mono',
      ),
    );
    for (let r = 0; r < 3; r++) {
      const cy = gTop + r * cell + cell * 0.5;
      nodes.push(
        txt(`q${r + 1}`, gLeft - 52, cy, 28, r === qHighlight ? ROLE.query : COSMOS.muted, 'mono'),
      );
      for (let k = 0; k < 3; k++) {
        const cx = gLeft + k * cell + cell * 0.5;
        if (r === 0) {
          nodes.push(txt(`k${k + 1}`, cx, gTop - 28, 26, COSMOS.muted, 'mono'));
        }
        const allowed = k <= r;
        const col = allowed ? ROLE.score : ROLE.danger;
        const emphasis = r === qHighlight ? 1 : 0.75;
        nodes.push(
          rect(cell - 16, cell - 16, {
            fill: allowed ? '#102c27' : '#2d1322',
            stroke: col,
            width: r === qHighlight ? 3.2 : 1.8,
            radius: 10,
          })
            .at(cx, cy)
            .opacity(0.38 + 0.62 * causalPhase * emphasis),
          txt(allowed ? '✓' : '×', cx, cy, 34, col, 'mono').opacity(
            0.38 + 0.62 * causalPhase * emphasis,
          ),
        );
      }
    }

    // Lower-right: Crisp well-spaced insight lines strictly inside x <= 840
    const rx = -40;
    nodes.push(
      txt('Query 2 permissions:', rx, 75, 28, ROLE.query, 'mono', 'left'),
      txt('Reads k1, k2   |   k3 hidden (−∞)', rx, 132, 30, COSMOS.ink, 'sans', 'left'),
      txt(
        'All 3 queries run in parallel with this mask',
        rx,
        200,
        27,
        COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        'Identical values v₁ = v₂ = v₃ = v:',
        rx,
        278,
        28,
        identV > 0.2 ? ROLE.key : COSMOS.dim,
        'mono',
        'left',
      ),
      txt(
        'Average stays v whether 1 or 3 rows show',
        rx,
        326,
        28,
        identV > 0.2 ? ROLE.key : COSMOS.dim,
        'sans',
        'left',
      ).glow(identV > 0.2 ? 5 : 0, ROLE.key),
    );

    return group(...nodes);
  });

  s.add(title, eq, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
