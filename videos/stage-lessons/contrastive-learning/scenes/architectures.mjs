// Scene 19: architectures - "Choose where the query and document are allowed to interact"
// Pure Cinema: three stacked luminous interaction diagrams (Bi-encoder offline index, Cross-encoder
// bipartite all-to-all attention web, and ColBERT late-interaction token MaxSim grid).
import { arrow, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  glowDot,
  glowMatrix,
  guardedDynamic,
  heroTitle,
  lumBar,
  playOn,
  rule,
  txt,
} from '../parts.mjs';

export default function architectures(s, c) {
  const biPhase = s.value(0);
  const crossOn = s.value(0);
  const lateOn = s.value(0);

  const title = heroTitle(['Where do query and document', 'tokens get to interact?'], {
    x: -860,
    y: -455,
    size: 44,
    lineHeight: 52,
    accent: ROLE.anchor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const bp = biPhase.value;
    const cr = crossOn.value;
    const lt = lateOn.value;
    const nodes = [];

    const rowYs = [-215, 55, 315];

    // Row 1: Bi-encoder (independent stored document vector)
    const y1 = rowYs[0];
    nodes.push(
      txt('1. Bi-encoder', -850, y1 - 24, 34, ROLE.anchor, 'serif', 'left').glow(
        bp > 0.1 ? 6 : 0,
        ROLE.anchor,
      ),
      txt('1 stored vector / doc', -850, y1 + 22, 26, COSMOS.muted, 'mono', 'left'),
      // Query -> pooled q
      lumBar(-390, y1, 180, 64, { color: ROLE.anchor, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('query', -390, y1, 30, COSMOS.ink, 'sans', 'center'),
      arrow([-290, y1], [-185, y1], { stroke: ROLE.anchor, width: 3, tip: 11 }),
      lumBar(-100, y1, 150, 56, { color: ROLE.anchor, fillAlpha: 0.34, glow: 8, radius: 8 }),
      txt('vec q', -100, y1, 28, COSMOS.ink, 'mono', 'center'),
      // Dot product hub
      txt('q · d', 85, y1, 34, ROLE.focus, 'mono', 'center').glow(6, ROLE.focus),
      // Stored d <- document (precomputed offline!)
      lumBar(270, y1, 170, 56, {
        color: ROLE.unrelated,
        fillAlpha: 0.34,
        glow: bp > 0.4 ? 11 : 7,
        radius: 8,
      }),
      txt('stored d', 270, y1, 28, COSMOS.ink, 'mono', 'center'),
      arrow([530, y1], [368, y1], { stroke: ROLE.unrelated, width: 3, tip: 11 }),
      lumBar(630, y1, 190, 64, { color: ROLE.unrelated, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('document', 630, y1, 30, COSMOS.ink, 'sans', 'center'),
      txt('indexed offline', 450, y1 - 66, 26, ROLE.unrelated, 'mono', 'center'),
    );
    if (bp > 0.02 && bp < 0.99) {
      const px = 530 - bp * 165;
      nodes.push(glowDot(px, y1, { radius: 9, color: ROLE.unrelated, glow: 14 }));
    }

    nodes.push(rule(-850, -85, 850, -85, COSMOS.rule, 1.5).opacity(0.55));

    // Row 2: Cross-encoder (joint all-to-all self-attention web)
    const y2 = rowYs[1];
    const qToks = [-120, 0, 120];
    const dToks = [-120, 0, 120];
    nodes.push(
      txt('2. Cross-encoder', -850, y2 - 24, 34, ROLE.violet, 'serif', 'left').glow(
        cr > 0.2 ? 6 : 0,
        ROLE.violet,
      ),
      txt('joint pass per pair', -850, y2 + 22, 26, COSMOS.muted, 'mono', 'left'),
      lumBar(-390, y2, 180, 64, { color: ROLE.anchor, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('query', -390, y2, 30, COSMOS.ink, 'sans', 'center'),
      arrow([-290, y2], [-170, y2], { stroke: ROLE.violet, width: 3, tip: 11 }),
      lumBar(630, y2, 190, 64, { color: ROLE.unrelated, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('document', 630, y2, 30, COSMOS.ink, 'sans', 'center'),
      arrow([525, y2], [320, y2], { stroke: ROLE.violet, width: 3, tip: 11 }),
    );
    // Bipartite all-to-all token attention web in center [x: -140..300]
    const topWebY = y2 - 48;
    const botWebY = y2 + 48;
    const webXs = [-105, 80, 265];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        nodes.push(
          line([webXs[i], topWebY + 14], [webXs[j], botWebY - 14], {
            stroke: cr > 0.2 ? ROLE.violet : '#3a4b73',
            width: cr > 0.2 ? 2.4 : 1.3,
          })
            .glow(cr > 0.2 ? 6 : 0, ROLE.violet)
            .opacity(0.35 + 0.65 * cr),
        );
      }
    }
    webXs.forEach((wx, idx) => {
      nodes.push(
        glowDot(wx, topWebY, { radius: 9, color: ROLE.anchor, glow: 10 }),
        glowDot(wx, botWebY, { radius: 9, color: ROLE.unrelated, glow: 10 }),
        txt(`q${idx + 1}`, wx, topWebY - 40, 26, ROLE.anchor, 'mono', 'center'),
        txt(`d${idx + 1}`, wx, botWebY + 40, 26, ROLE.unrelated, 'mono', 'center'),
      );
    });

    nodes.push(rule(-850, 180, 850, 180, COSMOS.rule, 1.5).opacity(0.55));

    // Row 3: Late interaction (ColBERT stored token vectors + MaxSim grid)
    const y3 = rowYs[2];
    nodes.push(
      txt('3. Late interaction', -850, y3 - 24, 34, ROLE.positive, 'serif', 'left').glow(
        lt > 0.2 ? 6 : 0,
        ROLE.positive,
      ),
      txt('stored token vectors', -850, y3 + 22, 26, COSMOS.muted, 'mono', 'left'),
      lumBar(-390, y3, 180, 64, { color: ROLE.anchor, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('q tokens', -390, y3, 30, COSMOS.ink, 'sans', 'center'),
      arrow([-290, y3], [-155, y3], { stroke: ROLE.positive, width: 3, tip: 11 }),
      glowMatrix({
        cx: 80,
        cy: y3,
        rows: 2,
        cols: 3,
        cellW: 112,
        cellH: 54,
        gap: 10,
        values: [
          ['0.12', '0.93', '0.08'],
          ['0.19', '0.07', '0.91'],
        ],
        colors: [
          [COSMOS.dim, ROLE.positive, COSMOS.dim],
          [COSMOS.dim, COSMOS.dim, ROLE.positive],
        ],
        highlight: (r, k) => lt > 0.2 && ((r === 0 && k === 1) || (r === 1 && k === 2)),
        fontSize: 26,
      }),
      arrow([525, y3], [320, y3], { stroke: ROLE.positive, width: 3, tip: 11 }),
      lumBar(630, y3, 190, 64, { color: ROLE.unrelated, fillAlpha: 0.22, glow: 7, radius: 10 }),
      txt('d tokens', 630, y3, 30, COSMOS.ink, 'sans', 'center'),
      txt('MaxSim at query time', 630, y3 - 66, 26, ROLE.positive, 'mono', 'center'),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.violet), title, stageLayer);

  playOn(s, c, 'cl-architectures-bi', (d) => biPhase.to(1, { duration: d }), 1.2);
  playOn(s, c, 'cl-architectures-cross', (d) => crossOn.to(1, { duration: d }), 1.2);
  playOn(s, c, 'cl-architectures-late', (d) => lateOn.to(1, { duration: d }), 1.0);
}
