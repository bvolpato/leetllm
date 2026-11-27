// Scene 7: retrieval-arithmetic - Compute lexical and vector signals inside the permitted set
// Beat 0: exact BM25 term contributions (parser-v2 exclusive to Policy).
// Beat 1: 2D cosine geometry showing q=[1,1] equidistant to Policy [1,0.5] and Exception [0.5,1] (tie -> 0.948683).
// Beat 2: Cross-Encoder joint query+passage attention vs ColBERT late-interaction token vectors.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  LEXICAL_RESULTS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  glowMeter,
  glowTex,
  glowingTrail,
  guardedDynamic,
  quadArcPts,
  searchCosine,
  txt,
} from '../parts.mjs';

export default function retrievalArithmetic(s, c) {
  const termsProg = s.value(0);
  const lexSumOn = s.value(0);
  const beat1On = s.value(0);
  const vecGrow = s.value(0);
  const cosOn = s.value(0);
  const beat2On = s.value(0);
  const colbertProg = s.value(0);

  const cosPolicy = searchCosine([1, 1], [1, 0.5]);
  const cosException = searchCosine([1, 1], [0.5, 1]);

  const header = cinemaHeader(
    'LEXICAL & VECTOR SIGNALS',
    'Score permitted passages',
    'by terms and angles',
    {
      accent: ROLE.lexical,
      size: 46,
    },
  );

  const stageAura = aura(180, 30, 680, '#60a5fa1c', '#5ce1e61c');

  const cosEq = glowTex(
    '\\cos(q, p) = \\frac{1\\cdot 1 + 1\\cdot 0.5}{\\sqrt{2}\\cdot\\sqrt{1.25}} = 0.948683',
    { x: 350, y: -30, size: 36, color: ROLE.focus, glow: 7 },
  ).hide();

  const view = guardedDynamic(
    () => 1,
    () => {
      const tp = termsProg.value;
      const ls = lexSumOn.value > 0.5;
      const b1 = beat1On.value > 0.5;
      const vg = vecGrow.value;
      const cs = cosOn.value > 0.5;
      const b2 = beat2On.value > 0.5;
      const cb = colbertProg.value;
      const nodes = [];

      if (b2) {
        // Beat 2: Cross-Encoder vs ColBERT late interaction
        nodes.push(
          txt(
            'CROSS-ENCODER: JOINT QUERY + PASSAGE ATTENTION',
            -855,
            -225,
            28,
            ROLE.rerank,
            'mono',
            'left',
          ),
          rect(1680, 128, { fill: '#11142a', stroke: ROLE.rerank, width: 2.8, radius: 14 })
            .at(0, -118)
            .glow(8, ROLE.rerank),
          txt(
            'Query tokens  +  Candidate passage tokens  ->  full pairwise self-attention  ->  single relevance score',
            0,
            -118,
            28,
            COSMOS.ink,
            'sans',
            'center',
          ),

          txt(
            'COLBERT LATE INTERACTION: PER-TOKEN PASSAGE VECTORS',
            -855,
            42,
            28,
            ROLE.dense,
            'mono',
            'left',
          ),
        );

        const qTokens = ['q1: service', 'q2: account', 'q3: 60d'];
        const pTokens = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
        const nVis = Math.max(1, Math.ceil(Math.max(0.18, cb) * pTokens.length));

        qTokens.forEach((qt, i) => {
          const x = -640 + i * 320;
          nodes.push(
            rect(260, 68, { fill: '#0c172a', stroke: ROLE.focus, width: 2.4, radius: 10 }).at(
              x,
              128,
            ),
            txt(qt, x, 128, 26, ROLE.focus, 'mono', 'center'),
          );
        });

        for (let j = 0; j < nVis; j++) {
          const px = -715 + j * 286;
          nodes.push(
            rect(220, 74, { fill: '#0b182a', stroke: ROLE.dense, width: 2.4, radius: 10 })
              .at(px, 295)
              .glow(5, ROLE.dense),
            txt(`vec(${pTokens[j]})`, px, 295, 26, ROLE.dense, 'mono', 'center'),
          );
          if (j % 2 === 0) {
            const qx = -640 + Math.min(2, Math.floor(j / 2)) * 320;
            nodes.push(
              beamWithPhotons(quadArcPts([qx, 164], [px, 256], 0, 14), ROLE.dense, 0, {
                width: 2.6,
                glow: 7,
              }),
            );
          }
        }

        nodes.push(
          txt(
            'Tune candidate counts K against exception recall, answer quality, and latency.',
            -855,
            402,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      } else if (b1) {
        // Beat 1: Hand-drawn 2D vectors & cosine tie
        const ox = -680;
        const oy = 310;
        const sc = 370;

        nodes.push(
          line([ox - 40, oy], [ox + sc + 160, oy], { stroke: '#3a4f7c', width: 2.5 }),
          line([ox, oy + 40], [ox, oy - sc - 75], { stroke: '#3a4f7c', width: 2.5 }),
          txt('dim 1', ox + sc + 145, oy + 36, 26, COSMOS.dim, 'mono', 'right'),
          txt('dim 2', ox - 24, oy - sc - 55, 26, COSMOS.dim, 'mono', 'right'),
        );

        const g = Math.max(0.15, vg);
        nodes.push(
          // Query [1, 1]
          glowingTrail(
            [
              [ox, oy],
              [ox + sc * g, oy - sc * g],
            ],
            {
              color: ROLE.query,
              width: 4,
              glow: 9,
            },
          ),
          glowDot(ox + sc * g, oy - sc * g, { radius: 7, color: ROLE.query, glow: 10 }),
          txt('q = [1, 1]', ox + sc * g + 22, oy - sc * g, 28, ROLE.query, 'mono', 'left'),

          // Policy [1, 0.5]
          glowingTrail(
            [
              [ox, oy],
              [ox + sc * g, oy - sc * 0.5 * g],
            ],
            {
              color: ROLE.policy,
              width: 3.6,
              glow: 8,
            },
          ),
          glowDot(ox + sc * g, oy - sc * 0.5 * g, { radius: 7, color: ROLE.policy, glow: 10 }),
          txt(
            'policy = [1, 0.5]',
            ox + sc * g + 22,
            oy - sc * 0.5 * g,
            28,
            ROLE.policy,
            'mono',
            'left',
          ),

          // Exception [0.5, 1]
          glowingTrail(
            [
              [ox, oy],
              [ox + sc * 0.5 * g, oy - sc * g],
            ],
            {
              color: ROLE.exception,
              width: 3.6,
              glow: 8,
            },
          ),
          glowDot(ox + sc * 0.5 * g, oy - sc * g, { radius: 7, color: ROLE.exception, glow: 10 }),
          txt(
            'exception = [0.5, 1]',
            ox + sc * 0.5 * g + 22,
            oy - sc * g - 34,
            28,
            ROLE.exception,
            'mono',
            'left',
          ),

          txt('DOT PRODUCT = 1.5  ·  EQUAL ANGLES', 40, -175, 28, ROLE.focus, 'mono', 'left'),
          txt(
            '||q|| = sqrt(2)    ||p|| = ||e|| = sqrt(1.25)',
            40,
            -118,
            28,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );

        if (cs) {
          nodes.push(
            txt(
              `Policy cosine:    ${cosPolicy.toFixed(6)}`,
              40,
              120,
              34,
              ROLE.policy,
              'mono',
              'left',
            ),
            txt(
              `Exception cosine: ${cosException.toFixed(6)}`,
              40,
              182,
              34,
              ROLE.exception,
              'mono',
              'left',
            ),
            txt(
              'Tie-break by document ID -> Exception first',
              40,
              258,
              28,
              ROLE.focus,
              'sans',
              'left',
            ),
            txt('Zero-norm vector guard -> returns 0', 40, 316, 26, COSMOS.muted, 'mono', 'left'),
          );
        } else {
          nodes.push(
            txt(
              'Same angle from query q -> computing cosine tie...',
              40,
              150,
              28,
              COSMOS.muted,
              'sans',
              'left',
            ),
          );
        }
      } else {
        // Beat 0: BM25 lexical term counts & sums
        const pTerms = LEXICAL_RESULTS[0].terms;
        const eTerms = LEXICAL_RESULTS[1].terms;
        const nShow = Math.max(
          1,
          Math.min(pTerms.length, Math.ceil(Math.max(0.15, tp) * pTerms.length)),
        );

        nodes.push(
          txt(
            'BM25 TERMS IN PERMITTED PASSAGES (N = 2)',
            -855,
            -245,
            26,
            ROLE.lexical,
            'mono',
            'left',
          ),
          txt('TERM', -855, -182, 26, COSMOS.muted, 'mono', 'left'),
          txt('df', -380, -182, 26, COSMOS.muted, 'mono', 'center'),
          txt('POLICY tf', -100, -182, 26, ROLE.policy, 'mono', 'center'),
          txt('EXCEPTION tf', 220, -182, 26, ROLE.exception, 'mono', 'center'),
          txt('TERM WEIGHT', 620, -182, 26, ROLE.focus, 'mono', 'center'),
          line([-855, -148], [855, -148], { stroke: '#2c3d66', width: 2 }),
        );

        pTerms.slice(0, nShow).forEach((t, i) => {
          const y = -102 + i * 56;
          const exactId = t.term === 'parser-v2';
          const col = exactId ? ROLE.focus : COSMOS.ink;
          nodes.push(
            txt(t.term, -855, y, 27, col, 'mono', 'left'),
            txt(String(t.df), -380, y, 27, ROLE.query, 'mono', 'center'),
            txt(String(t.tf), -100, y, 27, t.tf ? ROLE.policy : COSMOS.dim, 'mono', 'center'),
            txt(
              String(eTerms[i].tf),
              220,
              y,
              27,
              eTerms[i].tf ? ROLE.exception : COSMOS.dim,
              'mono',
              'center',
            ),
            glowMeter(440, y, 380, 26, Math.max(t.value, eTerms[i].value) / 1.1, {
              fill: exactId ? ROLE.focus : ROLE.lexical,
            }),
          );
        });

        if (ls) {
          nodes.push(
            txt(
              `Policy BM25 sum: ${LEXICAL_RESULTS[0].score.toFixed(5)}`,
              -855,
              395,
              32,
              ROLE.policy,
              'mono',
              'left',
            ).glow(6, ROLE.policy),
            txt(
              `Exception BM25 sum: ${LEXICAL_RESULTS[1].score.toFixed(5)}`,
              120,
              395,
              32,
              ROLE.exception,
              'mono',
              'left',
            ).glow(6, ROLE.exception),
          );
        }
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view, cosEq);
  c.on('se-retrieval-arithmetic-0', () => {
    s.play(
      termsProg.to(1, { duration: clampDur(c, c.cue('se-retrieval-arithmetic-0').start, 1.3) }),
    );
  });
  c.on('se-retrieval-arithmetic-lexical', () => {
    s.play(
      lexSumOn.to(1, {
        duration: clampDur(c, c.cue('se-retrieval-arithmetic-lexical').start, 0.35),
      }),
    );
  });
  c.on('se-retrieval-arithmetic-1', () => {
    s.play(
      beat1On.to(1, { duration: clampDur(c, c.cue('se-retrieval-arithmetic-1').start, 0.25) }),
    );
    s.play(vecGrow.to(1, { duration: clampDur(c, c.cue('se-retrieval-arithmetic-1').start, 0.9) }));
  });
  c.on('se-retrieval-arithmetic-cosine', () => {
    s.play(
      cosOn.to(1, { duration: clampDur(c, c.cue('se-retrieval-arithmetic-cosine').start, 0.3) }),
    );
  });
  c.show('se-retrieval-arithmetic-cosine', cosEq);
  c.hide('se-retrieval-arithmetic-2', cosEq);
  c.on('se-retrieval-arithmetic-2', () => {
    s.play(
      beat2On.to(1, { duration: clampDur(c, c.cue('se-retrieval-arithmetic-2').start, 0.25) }),
    );
  });
  c.on('se-retrieval-arithmetic-interaction', () => {
    s.play(
      colbertProg.to(1, {
        duration: clampDur(c, c.cue('se-retrieval-arithmetic-interaction').start, 0.9),
      }),
    );
  });
}
