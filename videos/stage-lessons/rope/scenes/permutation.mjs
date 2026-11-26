// Scene 2: permutation: Content follows its token (permutation equivariance vs causal mask).
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  bindStepCues,
  contentOutputs,
  contentWeights,
  glowDot,
  heroTitle,
  txt,
} from '../parts.mjs';

const TOKENS = [
  { name: 'dogs', color: ROLE.query, idx: 0 },
  { name: 'chase', color: COSMOS.blue, idx: 1 },
  { name: 'cats', color: ROLE.key, idx: 2 },
];

const ALL_CUES = [
  'rp-permutation-0-0',
  'rp-permutation-0-1',
  'permutation-permuted-output-0-b1-1',
  'rp-permutation-0-2',
  'rp-permutation-1-0',
  'rp-permutation-1-1',
  'permutation-permuted-token-0-b2-1',
  'rp-permutation-1-2',
  'rp-permutation-1-3',
  'permutation-content-weight-0-2-b3-1',
  'rp-permutation-2-0',
  'rp-permutation-2-1',
  'rp-permutation-2-2',
];

export default function permutation(s, c) {
  const step = s.value(0);

  const title = heroTitle(['Content follows', 'its token'], {
    x: -860,
    y: -420,
    size: 56,
    lineHeight: 66,
    accent: ROLE.query,
    eyebrow: 'PERMUTATION EQUIVARIANCE',
  });

  const footer = txt(
    'Unmasked attention is permutation equivariant; a causal mask breaks symmetry',
    -860,
    405,
    26,
    COSMOS.muted,
    'sans',
    'left',
  );

  const picture = dynamic(() => {
    const st = step.value;
    const permP = Math.max(0, Math.min(1, (st - 4.2) / 1.5));
    const maskP = Math.max(0, Math.min(1, (st - 10.5) / 1.2));

    const nodes = [];

    // Left: 3 token rows. During mid-swap (0.08 < permP < 0.92), show glowing traveling dots
    // instead of text crossing through row 1 (per REBUILD.md crossing rule!)
    const leftX = -690;
    const outX = -290;
    const rowYs = [-75, 90, 255];
    const orderY = [
      rowYs[0] + permP * (rowYs[2] - rowYs[0]),
      rowYs[1],
      rowYs[2] + permP * (rowYs[0] - rowYs[2]),
    ];
    const inFlight = permP > 0.05 && permP < 0.95;

    nodes.push(
      txt('Token', leftX, -172, 26, COSMOS.muted, 'mono'),
      txt('Attention Output', outX, -172, 26, COSMOS.muted, 'mono'),
    );

    TOKENS.forEach((tok, i) => {
      const y = orderY[i];
      const out = contentOutputs[tok.idx];
      const moving = i !== 1;
      if (inFlight && moving) {
        // Traveling glowing orbs arc cleanly around row 1 without crossing its text!
        const arcX = i === 0 ? -155 * Math.sin(Math.PI * permP) : 155 * Math.sin(Math.PI * permP);
        nodes.push(
          glowDot(leftX + arcX, y, { radius: 12, color: tok.color, glow: 14 }),
          glowDot(outX + arcX, y, { radius: 12, color: tok.color, glow: 14 }),
        );
      } else {
        nodes.push(
          rect(200, 64, { fill: '#111626', stroke: tok.color, width: 2.6, radius: 12 }).at(
            leftX,
            y,
          ),
          txt(tok.name, leftX, y, 32, tok.color, 'serif'),
          line([leftX + 110, y], [outX - 150, y], {
            stroke: tok.color,
            width: 2.6,
            dash: [6, 6],
          })
            .opacity(0.65)
            .glow(4, tok.color),
          glowDot(outX - 150, y, { radius: 5.5, color: tok.color, glow: 8 }),
          rect(270, 64, { fill: '#0e1424', stroke: tok.color, width: 2.2, radius: 12 }).at(outX, y),
          txt(`[${out[0].toFixed(3)}, ${out[1].toFixed(3)}]`, outX, y, 27, COSMOS.ink, 'mono'),
        );
      }
    });

    // Right: 3x3 Attention Weight Matrix permuting both rows and columns together
    const matLeft = 200;
    const matTop = -175;
    const cell = 148;
    const permIdx = permP > 0.5 ? [2, 1, 0] : [0, 1, 2];

    nodes.push(
      txt(
        maskP > 0.5 ? 'Causal mask' : permP > 0.5 ? 'Permuted P A Pᵀ' : 'Weights A',
        matLeft + cell * 1.5,
        matTop - 98,
        28,
        maskP > 0.5 ? ROLE.danger : ROLE.score,
        'mono',
      ),
    );

    for (let r = 0; r < 3; r++) {
      const rTok = TOKENS[permIdx[r]];
      const cy = matTop + r * cell + cell * 0.5;
      nodes.push(txt(rTok.name, matLeft - 78, cy, 26, rTok.color, 'mono'));
      for (let k = 0; k < 3; k++) {
        const kTok = TOKENS[permIdx[k]];
        const cx = matLeft + k * cell + cell * 0.5;
        if (r === 0) {
          nodes.push(txt(kTok.name, cx, matTop - 42, 26, kTok.color, 'mono'));
        }
        const w = contentWeights[rTok.idx][kTok.idx];
        const blocked = maskP > 0.3 && k > r;
        const fillCol = blocked ? '#2b1220' : '#162848';
        const strokeCol = blocked ? ROLE.danger : rTok.color;
        nodes.push(
          rect(cell - 16, cell - 16, {
            fill: fillCol,
            stroke: strokeCol,
            width: blocked ? 2.6 : 1.8,
            radius: 12,
          })
            .at(cx, cy)
            .opacity(blocked ? 0.92 : 0.45 + w * 1.2),
          txt(
            blocked ? '−∞' : w.toFixed(2),
            cx,
            cy,
            30,
            blocked ? ROLE.danger : COSMOS.ink,
            'mono',
          ),
        );
      }
    }

    return group(...nodes);
  });

  s.add(title, footer, picture);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
