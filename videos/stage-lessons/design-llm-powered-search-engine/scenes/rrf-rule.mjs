// Scene 8: rrf-rule - Add one reciprocal contribution per branch identity
// Visualizes per-branch deduplication (removing repeated Policy before assigning ranks),
// MathJax RRF formula `1/(60+r)`, stacked reciprocal bars (1/61 + 1/62 = 0.0325225), and ID tie-break.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  RRF_BASE_LISTS,
  RRF_BASE_ROWS,
  RRF_TIE_SCORE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowTex,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function rrfRule(s, c) {
  const pulse = s.value(0);
  const startOn = s.value(0);
  const dedupOn = s.value(0);
  const barsProg = s.value(0);
  const sumOn = s.value(0);
  const tieOn = s.value(0);
  const scaleOn = s.value(0);

  const header = cinemaHeader(
    'RECIPROCAL RANK FUSION',
    'Deduplicate first, then',
    'add 1 / (k + rank)',
    {
      accent: ROLE.rrf,
      size: 46,
    },
  );

  const stageAura = aura(0, 60, 700, '#ffd1661c', '#5ce1e618');

  const rrfEq = glowTex('\\mathrm{RRF}(d) = \\sum_{b} \\frac{1}{60 + \\mathrm{rank}_b(d)}', {
    x: 430,
    y: -375,
    size: 38,
    color: ROLE.rrf,
    glow: 7,
  });

  const view = guardedDynamic(
    () => 1,
    () => {
      const dd = dedupOn.value > 0.5;
      const bp = barsProg.value;
      const sm = sumOn.value > 0.5;
      const ti = tieOn.value > 0.5;
      const sc = scaleOn.value > 0.5;
      const nodes = [];

      const lists = dd ? RRF_BASE_LISTS.map((l) => [...new Set(l)]) : RRF_BASE_LISTS;
      const branchNames = ['LEXICAL LIST', 'DENSE LIST'];
      const branchCols = [ROLE.lexical, ROLE.dense];

      // Top section: ranked candidate lists (Lexical starts with duplicate Policy!)
      lists.forEach((list, bIdx) => {
        const y = -205 + bIdx * 130;
        nodes.push(txt(branchNames[bIdx], -855, y, 28, branchCols[bIdx], 'mono', 'left'));
        list.forEach((doc, rIdx) => {
          const x = -390 + rIdx * 420;
          const isDup = !dd && bIdx === 0 && rIdx === 1;
          const col = isDup ? ROLE.deny : doc === 'Policy' ? ROLE.policy : ROLE.exception;
          const label = dd ? `${doc}  ·  rank ${rIdx + 1}` : isDup ? 'Policy  (duplicate!)' : doc;
          nodes.push(
            rect(370, 86, {
              fill: '#0d1527',
              stroke: col,
              width: isDup ? 3.2 : 2.6,
              dash: isDup ? [8, 6] : undefined,
              radius: 12,
            })
              .at(x, y)
              .glow(isDup ? 8 : 5, col),
            txt(label, x, y, 27, isDup ? ROLE.deny : COSMOS.ink, 'mono', 'center'),
          );
        });
      });

      // Lower section: Reciprocal rank contribution bars for Policy & Exception
      const count = bp > 0.05 ? Math.ceil(bp * RRF_BASE_ROWS.length) : 0;
      const active = RRF_BASE_ROWS.slice(0, count);

      ['Policy', 'Exception'].forEach((doc, dIdx) => {
        const x0 = -855 + dIdx * 890;
        const docCol = doc === 'Policy' ? ROLE.policy : ROLE.exception;
        nodes.push(
          txt(`${doc.toUpperCase()} ACCUMULATOR`, x0, 82, 28, docCol, 'mono', 'left'),
          rect(790, 74, { fill: '#0b1222', stroke: '#2c3d66', width: 2, radius: 10 }).at(
            x0 + 395,
            152,
          ),
        );

        let cursor = x0 + 6;
        for (const row of active.filter((r) => r.id === doc)) {
          const w = (row.value / 0.036) * 760;
          const bCol = row.branch === 0 ? ROLE.lexical : ROLE.dense;
          nodes.push(
            rect(w - 4, 62, { fill: bCol, stroke: '#ffffff', width: 1.2, radius: 7 })
              .at(cursor + (w - 4) * 0.5, 152)
              .glow(7, bCol)
              .opacity(0.9),
            txt(`1/${60 + row.rank}`, cursor + (w - 4) * 0.5, 152, 26, '#070910', 'mono', 'center'),
          );
          cursor += w;
        }

        if (sm) {
          const expr =
            doc === 'Policy'
              ? `1/61 + 1/62 = ${RRF_TIE_SCORE.toFixed(7)}`
              : `1/62 + 1/61 = ${RRF_TIE_SCORE.toFixed(7)}`;
          nodes.push(txt(expr, x0, 240, 30, ROLE.rrf, 'mono', 'left').glow(6, ROLE.rrf));
        }
      });

      // Bottom status line
      if (sc) {
        nodes.push(
          txt(
            'k = 60 is a study default to tune; ranks let lexical and vector branches share one scale.',
            0,
            372,
            29,
            ROLE.query,
            'serif',
            'center',
          ).glow(5, ROLE.query),
        );
      } else if (ti) {
        nodes.push(
          txt(
            'EXACT TIE (0.0325225) -> deterministic ID sort puts Exception first',
            0,
            372,
            30,
            ROLE.rrf,
            'mono',
            'center',
          ).glow(7, ROLE.rrf),
        );
      } else if (!dd) {
        nodes.push(
          txt(
            'Remove duplicate Policy inside the lexical branch before assigning ranks.',
            0,
            372,
            29,
            ROLE.deny,
            'sans',
            'center',
          ).opacity(0.55 + 0.45 * startOn.value),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, rrfEq, view);
  driftValue(s, c, pulse, 4.5, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-rrf-rule-0', () => {
    s.play(startOn.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-0').start, 0.35) }));
  });
  c.on('se-rrf-rule-dedup', () => {
    s.play(dedupOn.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-dedup').start, 0.35) }));
  });
  c.on('se-rrf-rule-1', () => {
    s.play(barsProg.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-1').start, 1.1) }));
  });
  c.on('se-rrf-rule-sum', () => {
    s.play(sumOn.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-sum').start, 0.3) }));
  });
  c.on('se-rrf-rule-tie', () => {
    s.play(tieOn.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-tie').start, 0.3) }));
  });
  c.on('se-rrf-rule-2', () => {
    s.play(scaleOn.to(1, { duration: clampDur(c, c.cue('se-rrf-rule-2').start, 0.3) }));
  });
}
