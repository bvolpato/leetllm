// Scene 14: When the ranking rule changes (L2 winner #202 -> unit-circle cosine winner #101 with strict withholding -> delete #101 -> -1 slot)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  glowingTrail,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function metricReplay(s, c) {
  const phase = s.value(0);
  const showRaw = s.value(0);
  const showUnit = s.value(0);
  const showCosine = s.value(0);
  const showDel = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['When the Ranking', 'Rule Changes'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.gold,
    eyebrow: 'METRIC MIGRATION · RAW L2 VS COSINE UNIT SPHERE · REBUILD & DELETE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sr = showRaw.value;
    const su = showUnit.value;
    const sc = showCosine.value;
    const sd = showDel.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Left: Unit circle first-quadrant arc / ray geometry
    const ox = -675;
    const oy = 148;
    const rad = 210;
    const arcPts = Array.from({ length: 28 }, (_, i) => {
      const a = (i / 27) * (Math.PI / 2);
      return [ox + Math.cos(a) * rad, oy - Math.sin(a) * rad];
    });
    // Ray angles: 101 at 0 deg (horizontal), Q at 5.7 deg (cos ~ 0.995!), 202 at 34 deg
    const p101 = [ox + rad, oy];
    const pQ = [ox + Math.cos(0.1) * rad, oy - Math.sin(0.1) * rad];
    const p202 = [ox + Math.cos(0.58) * rad, oy - Math.sin(0.58) * rad];

    const nodes = [
      // Left: Geometric ray contraction to unit circle
      glassCell(-425, 22, 860, 446, su > 0.3 ? COSMOS.gold : COSMOS.cyan, {
        fill: '#0e182e',
        glow: 4,
      }),
      txt(
        su > 0.3 ? 'UNIT CIRCLE: NORMALIZED DIRECTIONS' : 'RAW L2 SPACE: MAGNITUDE DOMINATES',
        -825,
        -166,
        26,
        su > 0.3 ? COSMOS.gold : COSMOS.cyan,
        'mono',
        'left',
      ),

      glowingTrail(arcPts, { color: COSMOS.muted, width: 2.2, glow: 0, opacity: 0.7 }),
      line([ox, oy], [ox + 340, oy], { stroke: COSMOS.muted, width: 1.8 }),
      line([ox, oy], [ox, oy - 245], { stroke: COSMOS.muted, width: 1.8 }),

      // Record 101 ray (horizontal, elongated before normalize)
      line([ox, oy], su > 0.3 ? p101 : [ox + 315, oy], {
        stroke: COSMOS.emerald,
        width: 4.5,
      }).glow(sc > 0.3 ? 10 : 6, COSMOS.emerald),
      glowDot(su > 0.3 ? p101[0] : ox + 315, oy, { radius: 10, color: COSMOS.emerald }),
      txt('101', (su > 0.3 ? p101[0] : ox + 315) + 46, oy + 24, 26, COSMOS.emerald, 'mono'),

      // Query Q ray (almost collinear with 101!)
      line([ox, oy], pQ, { stroke: COSMOS.gold, width: 4.0 }).glow(8, COSMOS.gold),
      glowDot(pQ[0], pQ[1], { radius: 10, color: COSMOS.gold }),
      txt('Q', pQ[0] + 34, pQ[1] - 24, 26, COSMOS.gold, 'mono'),

      // Record 202 ray (wider angle, closer in raw L2)
      line([ox, oy], p202, { stroke: COSMOS.cyan, width: 4.0 }).glow(6, COSMOS.cyan),
      glowDot(p202[0], p202[1], { radius: 10, color: COSMOS.cyan }),
      txt('202', p202[0] + 44, p202[1] - 22, 26, COSMOS.cyan, 'mono'),

      txt('Which ray aligns closest to Q?', -825, 208, 26, COSMOS.gold, 'sans', 'left'),

      // Right: Metric comparison & delete replay (STRICT c.after withholding on cosine-rank!)
      txt('METRIC SWITCH & DELETE REPLAY', 100, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(495, -108, 770, 126, sr > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sr > 0.3 ? 8 : 2,
      }),
      txt('RAW L2 WINNER:  #202 (d^2 = 0.81)', 140, -134, 28, COSMOS.cyan, 'mono', 'left'),
      txt(
        '#101 is stretched farther along x in raw L2',
        140,
        -86,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 42, 770, 134, sc > 0.4 ? COSMOS.emerald : COSMOS.gold, {
        fill: sc > 0.4 ? '#0e2824' : '#231c10',
        glow: sc > 0.4 ? 9 * pulse : 3,
      }),
      txt(
        sc > 0.4 ? 'COSINE WINNER:  #101 (dot ~ 0.995!)' : 'COSINE WINNER (UNIT SPHERE):  ?',
        140,
        12,
        28,
        sc > 0.4 ? COSMOS.emerald : COSMOS.gold,
        'mono',
        'left',
      ),
      txt(
        'IVF migration: normalize ALL + retrain centers + refile',
        140,
        62,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),

      glassCell(495, 200, 770, 138, sd > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sd > 0.3 ? '#26111a' : '#12182b',
        glow: sd > 0.3 ? 9 * pulse : 2,
      }),
      txt(
        sd > 0.3 ? 'DELETE #101 -> TOP-2 = [ 202, -1 ]' : 'POST-DELETE TOP-2:  [ 101, 202 ]',
        140,
        166,
        28,
        sd > 0.3 ? COSMOS.rose : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'Faiss sentinel -1 marks empty slot; propagate deletes',
        140,
        214,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.gold }),
      txt(
        'Changing L2 to cosine changes geometry: normalize, retrain IVF centroids, and refile records',
        -812,
        360,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('raw-distance', () => s.play(showRaw.to(1, { duration: 0.4 })));
  c.on('unit-vectors', () => s.play(showUnit.to(0.6, { duration: 0.35 })));
  c.on('unit-zoom', () => s.play(showUnit.to(1, { duration: 0.35 })));
  c.after('cosine-rank', () => s.play(showCosine.to(1, { duration: 0.4 })));
  c.on('remove-record', () =>
    s.play(showDel.to(1, { duration: remainDuration(c, 'remove-record', 0.45) })),
  );
}
