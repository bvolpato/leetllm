// Scene 21: task-format - "The checkpoint decides which input format is meaningful"
// Pure Cinema: persistent query and passage text streams dynamically sliding open to receive
// checkpoint-specific prefix/instruction badges (E5-base-v2 -> BGE v1.5 -> INSTRUCTOR),
// anchored by a 6-node glowing deployment contract chain.
import { arrow } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  cinemaAtmosphere,
  guardedDynamic,
  heroTitle,
  lumBar,
  playOn,
  rule,
  txt,
} from '../parts.mjs';

export default function taskFormat(s, c) {
  const mode = s.value(0); // 0=plain, 1=E5, 2=BGE, 3=INSTRUCTOR
  const qSlide = s.value(0);
  const pSlide = s.value(0);
  const showBind = s.value(0);

  const title = heroTitle(['The checkpoint defines', 'the input format contract'], {
    x: -860,
    y: -450,
    size: 46,
    lineHeight: 54,
    accent: ROLE.anchor,
  });

  const stageLayer = guardedDynamic(s.value(1), () => {
    const m = Math.round(mode.value);
    const qs = qSlide.value;
    const ps = pSlide.value;
    const bd = showBind.value;
    const nodes = [];

    const qY = -175;
    const pY = 5;
    const badgeX = -650;
    const badgeW = 290;

    // Model header tag above streams
    const modelNames = [
      'RAW INPUTS (NO FORMAT APPLIED)',
      'E5-base-v2  ·  query: & passage: prefixes + masked mean + L2 norm',
      'BGE-base-en-v1.5  ·  retrieval instruction on short query, plain passage',
      'INSTRUCTOR  ·  [instruction, text] pair on both query and passage',
    ];
    const modelCols = [COSMOS.muted, ROLE.anchor, ROLE.focus, ROLE.violet];
    nodes.push(
      txt(modelNames[m], 0, -295, 30, modelCols[m], 'mono', 'center').glow(
        m > 0 ? 6 : 0,
        modelCols[m],
      ),
    );

    // Subtle horizontal stream guide tracks (not prose boxes!)
    nodes.push(
      txt('QUERY STREAM', -840, qY - 56, 26, COSMOS.dim, 'mono', 'left'),
      rule(-840, qY + 52, 840, qY + 52, COSMOS.rule, 1.4).opacity(0.45),
      txt('PASSAGE STREAM', -840, pY - 56, 26, COSMOS.dim, 'mono', 'left'),
      rule(-840, pY + 52, 840, pY + 52, COSMOS.rule, 1.4).opacity(0.45),
    );

    // Query prefix/instruction badge: fades in ONLY after text slides past badge right edge (-505)!
    const qBadgeLabel = m === 1 ? 'query:' : m >= 2 ? 'instruction' : '';
    const qBadgeCol = m === 1 ? ROLE.anchor : m === 2 ? ROLE.focus : ROLE.violet;
    if (qs > 0.92 && qBadgeLabel) {
      const qOp = Math.min(1, (qs - 0.92) / 0.08);
      nodes.push(
        lumBar(badgeX, qY, badgeW, 68, {
          color: qBadgeCol,
          fillAlpha: 0.3,
          strokeWidth: 2.6,
          glow: 9,
          radius: 10,
          opacity: qOp,
        }),
        txt(qBadgeLabel, badgeX, qY, 32, COSMOS.ink, 'mono', 'center').opacity(qOp),
      );
    }

    // Passage prefix/instruction badge: fades in ONLY after text slides past badge right edge (-505)!
    const pBadgeLabel = m === 1 ? 'passage:' : m === 3 ? 'instruction' : '';
    const pBadgeCol = m === 1 ? ROLE.unrelated : ROLE.violet;
    if (ps > 0.92 && pBadgeLabel) {
      const pOp = Math.min(1, (ps - 0.92) / 0.08);
      nodes.push(
        lumBar(badgeX, pY, badgeW, 68, {
          color: pBadgeCol,
          fillAlpha: 0.3,
          strokeWidth: 2.6,
          glow: 9,
          radius: 10,
          opacity: pOp,
        }),
        txt(pBadgeLabel, badgeX, pY, 32, COSMOS.ink, 'mono', 'center').opacity(pOp),
      );
    }

    // Persistent Query & Passage texts smoothly sliding right to make room for badges!
    const qTextX = -780 + qs * 315;
    const pTextX = -780 + ps * 315;
    nodes.push(
      txt('How do I rotate an API key?', qTextX, qY, 36, ROLE.anchor, 'sans', 'left'),
      txt(
        'Create a replacement key, then revoke the old key.',
        pTextX,
        pY,
        34,
        ROLE.unrelated,
        'sans',
        'left',
      ),
    );

    // Bottom: 6-node pinned deployment contract chain
    const chainY = 235;
    const chainItems = [
      'checkpoint',
      'tokenizer',
      'pooling',
      'L2 norm',
      'prefixes',
      'index metric',
    ];
    const chainOp = 0.28 + 0.72 * bd;
    nodes.push(
      txt(
        'PIN TOGETHER ACROSS TRAINING, INDEXING, AND SEARCH',
        0,
        140,
        26,
        bd > 0.3 ? ROLE.positive : COSMOS.dim,
        'mono',
        'center',
      )
        .glow(bd > 0.3 ? 5 : 0, ROLE.positive)
        .opacity(chainOp),
    );
    chainItems.forEach((item, idx) => {
      const cx = -725 + idx * 290;
      const col = bd > 0.3 ? ROLE.positive : ROLE.anchor;
      nodes.push(
        lumBar(cx, chainY, 232, 62, {
          color: col,
          fillAlpha: bd > 0.3 ? 0.26 : 0.14,
          strokeWidth: bd > 0.3 ? 2.4 : 1.6,
          glow: bd > 0.3 ? 8 : 3,
          radius: 10,
          opacity: chainOp,
        }),
        txt(item, cx, chainY, 26, COSMOS.ink, 'mono', 'center').opacity(chainOp),
      );
      if (idx < chainItems.length - 1) {
        nodes.push(
          arrow([cx + 122, chainY], [cx + 168, chainY], {
            stroke: col,
            width: 2.6,
            tip: 10,
          }).opacity(chainOp),
        );
      }
    });

    nodes.push(
      txt(
        bd > 0.3
          ? 'Changing query formatting against old stored embeddings changes the comparison -> re-test!'
          : 'Formatting tells the encoder which asymmetric role each text plays',
        0,
        365,
        28,
        bd > 0.3 ? ROLE.focus : COSMOS.muted,
        'sans',
        'center',
      ),
    );

    return nodes;
  });

  s.add(cinemaAtmosphere(ROLE.anchor, ROLE.violet), title, stageLayer);

  playOn(
    s,
    c,
    'cl-task-format-e5',
    (d) => [
      mode.to(1, { duration: 0.05 }),
      qSlide.to(1, { duration: d }),
      pSlide.to(1, { duration: d }),
    ],
    0.85,
  );
  playOn(
    s,
    c,
    'cl-task-format-bge',
    (d) => [mode.to(2, { duration: 0.05 }), pSlide.to(0, { duration: d })],
    0.85,
  );
  playOn(
    s,
    c,
    'cl-task-format-instructor',
    (d) => [mode.to(3, { duration: 0.05 }), pSlide.to(1, { duration: d })],
    0.85,
  );
  playOn(s, c, 'cl-task-format-bind', (d) => showBind.to(1, { duration: d }), 0.65);
}
