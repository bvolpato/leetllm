// Scene 14: alignment: CLIP 3x3 cosine similarity matrix, row/column softmax sweeps, symmetric loss & false negatives.
import {
  COSMOS,
  ROLE,
  aura,
  clip,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  logits,
  loss,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function alignment(s, c) {
  const mode = s.value(0); // 0=diag, 1=row, 2=col, 3=avg, 4=computed, 5=false-neg

  const bgAura = aura(0, 0, 740, '#14335c28', '#25184422');
  const title = heroTitle(['CLIP Contrastive Space:', 'Symmetric Image-Text Matrix'], {
    x: -855,
    y: -430,
    size: 48,
    lineHeight: 56,
    accent: ROLE.patch,
  });

  const eq = glowTex(
    String.raw`\mathcal{L}_{\text{CLIP}} = \tfrac{1}{2}\bigl(\mathcal{L}_{I\to T} + \mathcal{L}_{T\to I}\bigr)`,
    { x: 320, y: -395, size: 34, color: ROLE.pos, glow: 7 },
  );

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const m = Math.round(mode.value);
    const cellW = 170;
    const cellH = 105;
    const gx0 = -640;
    const gy0 = -105;

    const nodes = [
      txt('3 x 3 COSINE SIMILARITY LOGITS', gx0 - 80, -225, 26, ROLE.patch, 'mono', 'left').opacity(
        alpha,
      ),
      txt('T0', gx0, -175, 28, ROLE.pos, 'mono', 'center').opacity(alpha),
      txt('T1', gx0 + cellW, -175, 28, ROLE.pos, 'mono', 'center').opacity(alpha),
      txt('T2', gx0 + cellW * 2, -175, 28, ROLE.pos, 'mono', 'center').opacity(alpha),
    ];

    for (let r = 0; r < 3; r++) {
      const y = gy0 + r * cellH;
      nodes.push(txt(`I${r}`, gx0 - 125, y, 28, ROLE.patch, 'mono', 'center').opacity(alpha));
      for (let col = 0; col < 3; col++) {
        const x = gx0 + col * cellW;
        const isDiag = r === col;
        const val = logits[r][col];
        const highlightRow = m === 1 && r === 0;
        const highlightCol = m === 2 && col === 0;
        const highlightFn = m === 5 && r === 0 && col === 1;
        const stroke = highlightFn
          ? ROLE.warn
          : isDiag
            ? ROLE.ok
            : highlightRow || highlightCol
              ? ROLE.pos
              : '#2a3c66';
        const fill = highlightFn
          ? '#331524'
          : isDiag
            ? '#103128'
            : highlightRow || highlightCol
              ? '#1a2748'
              : '#0e162a';
        nodes.push(
          rect(cellW - 14, cellH - 14, {
            fill,
            stroke,
            width: isDiag || highlightFn ? 3 : 2,
            radius: 10,
          })
            .at(x, y)
            .opacity(alpha),
          txt(val.toFixed(2), x, y, 32, isDiag ? ROLE.ok : COSMOS.ink, 'mono', 'center').opacity(
            alpha,
          ),
        );
      }
    }

    // Right readout column
    const rowLoss = loss(logits);
    const colLoss = loss(logits[0].map((_, i) => logits.map((r) => r[i])));
    const rx = 50;
    nodes.push(
      txt('SYMMETRIC CROSS-ENTROPY', rx, -175, 26, ROLE.pos, 'mono', 'left').opacity(alpha),
      txt(
        `Row softmax (I -> T):  ${rowLoss.toFixed(3)}`,
        rx,
        -95,
        30,
        m >= 1 ? ROLE.patch : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (m >= 1 ? 1 : 0.4)),
      txt(
        `Col softmax (T -> I):  ${colLoss.toFixed(3)}`,
        rx,
        -25,
        30,
        m >= 2 ? ROLE.pos : COSMOS.muted,
        'mono',
        'left',
      ).opacity(alpha * (m >= 2 ? 1 : 0.4)),
      txt(`Mean CLIP Loss:  ${clip.toFixed(3)}`, rx, 60, 36, ROLE.ok, 'mono', 'left')
        .glow(m >= 3 ? 10 : 0, ROLE.ok)
        .opacity(alpha * (m >= 3 ? 1 : 0.35)),
      txt(
        m === 5
          ? 'Cross-pair can be a false negative if two captions fit!'
          : 'Diagonal = matched pairs; off-diagonal = batch competitors',
        rx,
        165,
        28,
        m === 5 ? ROLE.warn : COSMOS.muted,
        'sans',
        'left',
      ).opacity(alpha),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, eq, layer);
  playCue(s, c, 'alignment-image-caption-comparison-b1-1', (d) =>
    s.play(mode.to(0, { duration: d })),
  );
  playCue(s, c, 'alignment-symmetric-contrastive-objective-b2-1', (d) =>
    s.play(mode.to(1, { duration: d })),
  );
  playCue(s, c, 'alignment-column', (d) => s.play(mode.to(2, { duration: d })));
  playCue(s, c, 'alignment-objective', (d) => s.play(mode.to(3, { duration: d })));
  playCue(s, c, 'alignment-computed', (d) => s.play(mode.to(4, { duration: d })));
  playCue(s, c, 'alignment-image-caption-comparison-b3-1', (d) =>
    s.play(mode.to(5, { duration: d })),
  );
}
