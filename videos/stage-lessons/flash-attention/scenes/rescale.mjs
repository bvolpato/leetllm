// Scene 10: Put both tiles on one scale: Online softmax rescaling morph + ghost contraction + exact 32.405.
import { arrow } from 'vizmatic/stage';
import { rescaledFirstTile } from '../../../films/flash-attention/model.mjs';
import {
  COSMOS,
  DENSE_OUTPUT,
  MERGED_ALL,
  TILE_A,
  TILE_A_OUTPUT,
  aura,
  glassCell,
  glowTex,
  group,
  guardedDynamic,
  heroTitle,
  line,
  rect,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function rescale(s, c) {
  const phase = s.value(0);
  const rescaleProg = s.value(0);
  const showFactor = s.value(0);
  const showRatioSame = s.value(0);
  const addW = s.value(0);
  const addV = s.value(0);
  const showFinal = s.value(0);

  const bgAura = aura(120, 40, 560, '#ffd16622', '#5ce1e616');
  const title = heroTitle(['Rescale', 'to One Scale'], {
    x: -855,
    y: -410,
    size: 58,
    lineHeight: 68,
    accent: COSMOS.gold,
    eyebrow: 'ONLINE SOFTMAX · EXACT MERGE',
  });

  const eqScale = glowTex(
    String.raw`\ell' = e^{m - m_{\text{new}}}\ell,\quad N' = e^{m - m_{\text{new}}}N`,
    {
      x: 245,
      y: -365,
      size: 38,
      color: COSMOS.gold,
    },
  );

  const trackX0 = -240;
  const trackMaxW = 980;
  const wScale = trackMaxW / 1.7;
  const vScale = trackMaxW / 54;

  const live = guardedDynamic(1, () => {
    const rp = rescaleProg.value;
    const sf = showFactor.value;
    const sr = showRatioSame.value;
    const aw = addW.value;
    const av = addV.value;
    const fin = showFinal.value;

    const scaled = rescaledFirstTile(rp);
    const oldWPx = TILE_A.l * wScale;
    const curWPx = scaled.l * wScale;
    const addWPx = 1.0 * aw * wScale;

    const oldVPx = TILE_A.u * vScale;
    const curVPx = scaled.u * vScale;
    const addVPx = 40.0 * av * vScale;

    const totalW = scaled.l + 1.0 * aw;
    const totalV = scaled.u + 40.0 * av;

    const nodes = [
      // Left state summary
      glassCell(-595, -130, 500, 126, COSMOS.gold, { fill: '#1c1812', glow: 9 }),
      txt('ACTIVE REFERENCE', -595, -166, 26, COSMOS.muted, 'mono'),
      txt(`m = ${scaled.reference.toFixed(2)}`, -595, -112, 44, COSMOS.gold, 'mono').glow(
        8,
        COSMOS.gold,
      ),

      glassCell(-595, 30, 500, 114, COSMOS.amber, {
        fill: '#1b1414',
        glow: sf > 0.3 ? 9 : 3,
        opacity: Math.max(0.35, sf),
      }),
      txt('RESCALE FACTOR', -595, -4, 26, COSMOS.muted, 'mono').opacity(Math.max(0.35, sf)),
      txt(`exp(2 − 3) = e⁻¹ ≈ ${Math.exp(-1).toFixed(3)}`, -595, 48, 30, COSMOS.amber, 'mono')
        .glow(6, COSMOS.amber)
        .opacity(Math.max(0.35, sf)),

      // Upper track: Weight ℓ
      txt('TOTAL WEIGHT  ℓ', trackX0, -238, 26, COSMOS.cyan, 'mono', 'left'),
      line([trackX0, -125], [trackX0 + trackMaxW, -125], { stroke: '#273557', width: 2.2 }),
      // Translucent ghost outline of original Tile 1 weight
      rect(oldWPx, 66, { fill: COSMOS.blue, stroke: null, radius: 6 })
        .at(trackX0 + oldWPx * 0.5, -164)
        .opacity(0.14),
      rect(oldWPx, 66, { fill: null, stroke: COSMOS.blue, width: 2, dash: [8, 5], radius: 6 })
        .at(trackX0 + oldWPx * 0.5, -164)
        .opacity(0.7),
      // Contracting solid Tile 1 weight bar
      rect(curWPx, 66, { fill: COSMOS.cyan, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(trackX0 + curWPx * 0.5, -164)
        .glow(8, COSMOS.cyan)
        .opacity(0.92),

      // Lower track: Weighted value N
      txt('WEIGHTED VALUE  N', trackX0, 42, 26, COSMOS.emerald, 'mono', 'left'),
      line([trackX0, 155], [trackX0 + trackMaxW, 155], { stroke: '#273557', width: 2.2 }),
      // Ghost outline of original Tile 1 weighted value
      rect(oldVPx, 66, { fill: COSMOS.blue, stroke: null, radius: 6 })
        .at(trackX0 + oldVPx * 0.5, 116)
        .opacity(0.14),
      rect(oldVPx, 66, { fill: null, stroke: COSMOS.blue, width: 2, dash: [8, 5], radius: 6 })
        .at(trackX0 + oldVPx * 0.5, 116)
        .opacity(0.7),
      // Contracting solid Tile 1 weighted value bar
      rect(curVPx, 66, { fill: COSMOS.emerald, stroke: '#ffffff', width: 1.2, radius: 6 })
        .at(trackX0 + curVPx * 0.5, 116)
        .glow(8, COSMOS.emerald)
        .opacity(0.92),
    ];

    // Contraction arrows while shrinking
    if (rp > 0.15 && aw < 0.1) {
      nodes.push(
        arrow([trackX0 + oldWPx - 8, -164], [trackX0 + curWPx + 12, -164], {
          stroke: COSMOS.amber,
          width: 3.4,
          tip: 12,
        }).glow(8, COSMOS.amber),
        arrow([trackX0 + oldVPx - 8, 116], [trackX0 + curVPx + 12, 116], {
          stroke: COSMOS.amber,
          width: 3.4,
          tip: 12,
        }).glow(8, COSMOS.amber),
      );
    }

    // Tile 2 ("test": w=1, v=40) appended segments
    if (addWPx > 2) {
      nodes.push(
        rect(addWPx, 66, { fill: COSMOS.gold, stroke: '#ffffff', width: 1.4, radius: 6 })
          .at(trackX0 + curWPx + addWPx * 0.5, -164)
          .glow(10, COSMOS.gold)
          .opacity(0.94),
      );
    }
    if (addVPx > 2) {
      nodes.push(
        rect(addVPx, 66, { fill: COSMOS.gold, stroke: '#ffffff', width: 1.4, radius: 6 })
          .at(trackX0 + curVPx + addVPx * 0.5, 116)
          .glow(10, COSMOS.gold)
          .opacity(0.94),
      );
    }

    // Live totals clearly below each track baseline so nothing collides
    nodes.push(
      txt(`ℓ = ${totalW.toFixed(3)}`, trackX0, -84, 30, COSMOS.cyan, 'mono', 'left').glow(
        6,
        COSMOS.cyan,
      ),
      txt(`N = ${totalV.toFixed(3)}`, trackX0, 198, 30, COSMOS.emerald, 'mono', 'left').glow(
        6,
        COSMOS.emerald,
      ),
    );

    if (sr > 0.02 && fin < 0.5) {
      nodes.push(
        glassCell(-595, 220, 500, 122, COSMOS.cyan, { fill: '#0e1b2c', glow: 8, opacity: sr }),
        txt('RATIO INVARIANT', -595, 186, 26, COSMOS.muted, 'mono').opacity(sr),
        txt(`N' / ℓ' = ${TILE_A_OUTPUT.toFixed(2)}`, -595, 238, 36, COSMOS.cyan, 'mono')
          .glow(6, COSMOS.cyan)
          .opacity(sr),
      );
    }

    if (fin > 0.02) {
      nodes.push(
        glassCell(245, 345, 920, 116, COSMOS.emerald, { fill: '#0d2626', glow: 12, opacity: fin }),
        txt(
          `N / ℓ = ${MERGED_ALL.u.toFixed(3)} / ${MERGED_ALL.l.toFixed(3)} = ${DENSE_OUTPUT.toFixed(3)}  (exact match)`,
          245,
          345,
          32,
          COSMOS.emerald,
          'mono',
        )
          .glow(8, COSMOS.emerald)
          .opacity(fin),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, eqScale, live);
  runPhase(s, c, phase, 10);

  c.on('reference-three', () => s.play(rescaleProg.to(0.35, { duration: 0.45 })));
  c.on('common-factor', () => s.play(showFactor.to(1, { duration: 0.45 })));
  c.on('new-reference', () => s.play(rescaleProg.to(1, { duration: 1.0 })));
  c.on('same-mean', () => s.play(showRatioSame.to(1, { duration: 0.45 })));
  c.on('add-weight', () => s.play(addW.to(1, { duration: 0.5 })));
  c.on('add-value', () => s.play(addV.to(1, { duration: 0.5 })));
  c.after('merge-output', () =>
    s.play(showFinal.to(1, { duration: remainDuration(c, 'merge-output', 0.45) })),
  );
}
