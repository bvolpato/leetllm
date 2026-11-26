// Scene 28: cached-layer: KV cache at logical positions 800/801/802 in physical slots 0/1/2: full === incremental vs reset-to-0 bug.
import { dynamic, group, line, rect } from 'vizmatic/stage';
import {
  CACHE_POSITIONS,
  COSMOS,
  ROLE,
  bindStepCues,
  cacheFixture,
  cinemaAura,
  cinemaStars,
  heroTitle,
  shareStrip,
  txt,
} from '../parts.mjs';

const FIX = cacheFixture();
const ALL_CUES = [
  'rp-cached-layer-0-0',
  'rp-cached-layer-0-1',
  'rp-cached-layer-0-2',
  'rp-cached-layer-0-3',
  'rp-cached-layer-0-4',
  'rp-cached-layer-1-0',
  'rp-cached-layer-1-1',
  'rp-cached-layer-1-2',
  'rp-cached-layer-1-3',
  'rp-cached-layer-2-0',
  'rp-cached-layer-2-1',
  'rp-cached-layer-2-2',
  'rp-cached-layer-2-3',
];

export default function cachedLayer(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 28, ROLE.query);
  const stageAura = cinemaAura(0, 20, 700, '#5ce1e61e', '#ff6b8b14');

  const title = heroTitle(['The cached key keeps', 'its logical position'], {
    x: -860,
    y: -435,
    size: 56,
    lineHeight: 64,
    accent: ROLE.query,
    eyebrow: 'KV CACHE: PHYSICAL SLOT VS LOGICAL POSITION',
  });

  const live = dynamic(() => {
    const st = step.value;
    const showReset = st >= 8.2;
    const nodes = [];

    // Upper strip: 3 physical slots holding pre-rotated keys with logical IDs 800, 801, 802
    const slotXs = [-560, 0, 560];
    const slotY = -170;
    nodes.push(
      txt(
        'KV Cache Storage (already rotated at logical ID: do NOT re-rotate!)',
        -855,
        slotY - 82,
        26,
        COSMOS.muted,
        'mono',
        'left',
      ),
    );
    CACHE_POSITIONS.forEach((pos, slot) => {
      const cx = slotXs[slot];
      const col = slot === 2 ? ROLE.query : COSMOS.gold;
      nodes.push(
        rect(480, 96, { fill: '#10182b', stroke: col, width: 2.6, radius: 14 }).at(cx, slotY),
        txt(`slot ${slot}  →  logical pos ${pos}`, cx, slotY - 18, 28, col, 'mono'),
        txt(`K_rot(${pos}) stored`, cx, slotY + 22, 26, COSMOS.muted, 'mono'),
      );
    });

    // Lower comparison: Full causal pass vs Incremental cached (EXACT match!) vs Reset query to pos 0 (BROKEN!)
    const rowXs = -855;
    const stripX = -150;
    const stripW = 940;
    const rows = [
      {
        title: 'Full causal pass (q = 802)',
        weights: FIX.full[2],
        y: 25,
        col: ROLE.score,
        active: true,
      },
      {
        title: 'Incremental cached (q = 802)',
        weights: FIX.incremental[2],
        y: 145,
        col: ROLE.query,
        active: st >= 5.0,
      },
      {
        title: 'BUG: query reset to pos 0',
        weights: FIX.reset,
        y: 270,
        col: ROLE.danger,
        active: showReset,
      },
    ];

    rows.forEach((r) => {
      const op = r.active ? 1 : 0.28;
      nodes.push(
        txt(r.title, rowXs, r.y, 28, r.col, 'mono', 'left').opacity(op),
        shareStrip({
          x: stripX,
          y: r.y,
          width: stripW,
          height: 50,
          shares: r.weights,
          colors: [COSMOS.blue, COSMOS.violet, r.col],
          labels: r.weights.map((w, j) => `${CACHE_POSITIONS[j]}: ${(w * 100).toFixed(1)}%`),
        }).opacity(op),
      );
    });

    nodes.push(
      line([-855, 345], [855, 345], { stroke: '#29375a', width: 1.6 }),
      txt(
        showReset
          ? 'Resetting query 802 → 0 changes every relative angle & breaks the mixture!'
          : 'Full causal pass and token-by-token cached steps agree identically',
        -855,
        395,
        27,
        showReset ? ROLE.danger : ROLE.score,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
