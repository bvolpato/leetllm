// Scene 30: changing-schedule: Old cached keys vs new schedule query -> inverse+re-rotate repair -> multilayer feature dependency.
import { arrow, dynamic, group, line, rect } from 'vizmatic/stage';
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
  'rp-changing-schedule-0-0',
  'rp-changing-schedule-0-1',
  'rp-changing-schedule-0-2',
  'rp-changing-schedule-0-3',
  'rp-changing-schedule-0-4',
  'rp-changing-schedule-1-0',
  'rp-changing-schedule-1-1',
  'rp-changing-schedule-1-2',
  'rp-changing-schedule-1-3',
  'rp-changing-schedule-1-4',
];

export default function changingSchedule(s, c) {
  const step = s.value(0);
  const stars = cinemaStars(125, 30, ROLE.shift);
  const stageAura = cinemaAura(0, 20, 700, '#ff6b8b1a', '#6ee7b716');

  const title = heroTitle(['A new schedule changes', 'cached computation'], {
    x: -860,
    y: -435,
    size: 54,
    lineHeight: 62,
    accent: ROLE.shift,
    eyebrow: 'SCHEDULE SWITCHING & MULTILAYER CACHES',
  });

  const live = dynamic(() => {
    const st = step.value;
    const repaired = st >= 3.0;
    const showMulti = st >= 5.2;
    const nodes = [];

    // Upper comparison: Mixed schedules (MISMATCH!) vs Inverse-old + New-rotate repair (EXACT 1-layer match!)
    const lx = -855;
    const stripX = -150;
    const stripW = 940;

    nodes.push(
      txt(
        'Old cached keys: [1, 0.01]   ·   New query 802: [1, 0.005]',
        lx,
        -210,
        28,
        COSMOS.gold,
        'mono',
        'left',
      ),
      txt('Mixed schedules (BUG)', lx, -110, 28, ROLE.danger, 'mono', 'left'),
      shareStrip({
        x: stripX,
        y: -110,
        width: stripW,
        height: 52,
        shares: FIX.mixed,
        colors: [COSMOS.blue, COSMOS.violet, ROLE.danger],
        labels: FIX.mixed.map((w, j) => `${CACHE_POSITIONS[j]}: ${(w * 100).toFixed(1)}%`),
      }),
      txt(
        'R_new · R_old⁻¹ repair (1-layer)',
        lx,
        15,
        28,
        repaired ? ROLE.score : COSMOS.dim,
        'mono',
        'left',
      ),
      shareStrip({
        x: stripX,
        y: 15,
        width: stripW,
        height: 52,
        shares: FIX.repaired,
        colors: [COSMOS.blue, COSMOS.violet, ROLE.score],
        labels: FIX.repaired.map((w, j) => `${CACHE_POSITIONS[j]}: ${(w * 100).toFixed(1)}%`),
      }).opacity(repaired ? 1 : 0.3),
    );

    // Lower: Multilayer feature dependency diagram (Layer 1 attention changes Layer 2 K/V features!)
    const my = 215;
    const mOp = showMulti ? 1 : 0.35;
    nodes.push(
      line([-855, 115], [855, 115], { stroke: '#29375a', width: 1.6 }),
      txt('Multilayer decoder dependency:', lx, 155, 28, ROLE.shift, 'mono', 'left').opacity(mOp),
      rect(340, 80, { fill: '#111a2e', stroke: ROLE.query, width: 2.4, radius: 12 })
        .at(-685, my + 48)
        .opacity(mOp),
      txt('Layer 1 new RoPE', -685, my + 48, 28, ROLE.query, 'mono').opacity(mOp),
      arrow([-505, my + 48], [-325, my + 48], { stroke: ROLE.shift, width: 3.0, tip: 14 }).opacity(
        mOp,
      ),
      rect(390, 80, { fill: '#221830', stroke: ROLE.danger, width: 2.6, radius: 12 })
        .at(-120, my + 48)
        .opacity(mOp),
      txt('Layer 2 K, V shift', -120, my + 48, 27, ROLE.danger, 'mono').opacity(mOp),
      arrow([85, my + 48], [265, my + 48], { stroke: ROLE.score, width: 3.0, tip: 14 }).opacity(
        mOp,
      ),
      rect(520, 80, { fill: '#102424', stroke: ROLE.score, width: 2.6, radius: 12 })
        .at(535, my + 48)
        .opacity(mOp),
      txt('Cache unrotated K or recompute', 535, my + 48, 27, ROLE.score, 'mono').opacity(mOp),
      txt(
        'Rotating an old deep-layer key fixes its angle, not its stale upstream features',
        lx,
        375,
        27,
        showMulti ? COSMOS.ink : COSMOS.dim,
        'sans',
        'left',
      ),
    );

    return group(...nodes);
  });

  s.add(stars, stageAura, title, live);
  bindStepCues(s, c, step, ALL_CUES, 0.55);
}
