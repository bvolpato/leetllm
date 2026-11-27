// Scene 12: Where does the paragraph change topic? (Semantic cosine shift 1.0 -> 0.0 & zero-vector review)
import {
  COSMOS,
  aura,
  cosine,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  topicVector,
  txt,
} from '../parts.mjs';

export default function semanticCosine(s, c) {
  const showVecs = s.value(0);
  const showCos = s.value(0);
  const showZero = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Where Does the Paragraph', 'Change Topic?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.cyan,
    eyebrow: 'SEMANTIC BOUNDARY DETECTION · NEIGHBORING COSINE < 0.5 · ZERO-VECTOR GUARD',
  });

  const v1 = topicVector('Rollback failure with deploy.');
  const v2 = topicVector('Page within 15 minutes.');
  const v3 = topicVector('Commander handoff in channel.');
  const v4 = topicVector('No action is required.');
  const c12 = cosine(v1, v2);
  const c23 = cosine(v2, v3);
  const c34 = cosine(v3, v4);

  const live = guardedDynamic(s.value(1), () => {
    const sv = showVecs.value;
    const sc = showCos.value;
    const sz = showZero.value;

    // Left: 2D topic-plane arrows (Rollback axis vs Handoff axis)
    const ox = -755;
    const oy = 215;
    const scale = 125;

    const nodes = [
      txt(
        'TOPIC PLANE: ROLLBACK (x) vs HANDOFF (y)',
        ox + 10,
        -210,
        26,
        COSMOS.cyan,
        'mono',
        'left',
      ),
      line([ox, oy], [ox + 420, oy], { stroke: COSMOS.muted, width: 2.2 }),
      line([ox, oy], [ox, oy - 380], { stroke: COSMOS.muted, width: 2.2 }),
      txt('rollback', ox + 435, oy + 6, 26, COSMOS.cyan, 'mono', 'left'),
      txt('handoff', ox - 12, oy - 408, 26, COSMOS.amber, 'mono', 'left'),

      // S1 = [2, 0] and S2 = [1, 0] along x-axis
      line([ox, oy], [ox + v1[0] * scale, oy], { stroke: COSMOS.emerald, width: 5.0 }).glow(
        sv > 0.3 ? 9 : 4,
        COSMOS.emerald,
      ),
      glowDot(ox + v1[0] * scale, oy, { radius: 9, color: COSMOS.emerald }),
      txt('S1 [2, 0]', ox + v1[0] * scale, oy - 32, 26, COSMOS.emerald, 'mono'),

      glowDot(ox + v2[0] * scale, oy, { radius: 8, color: COSMOS.cyan }),
      txt('S2 [1, 0]', ox + v2[0] * scale, oy + 36, 26, COSMOS.cyan, 'mono'),

      // S3 = [0, 3] along y-axis (right angle!)
      line([ox, oy], [ox, oy - v3[1] * scale], { stroke: COSMOS.amber, width: 5.0 }).glow(
        sc > 0.3 ? 9 : 4,
        COSMOS.amber,
      ),
      glowDot(ox, oy - v3[1] * scale, { radius: 9, color: COSMOS.amber }),
      txt('S3 [0, 3]', ox + 110, oy - v3[1] * scale + 6, 26, COSMOS.amber, 'mono'),

      // Right: Pairwise cosine comparisons & zero-vector edge case
      txt('NEIGHBORING SENTENCE COSINES (CUT < 0.5)', 100, -210, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -108, 770, 118, sc > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sc > 0.3 ? 8 : 2,
      }),
      txt(
        `cos(S1, S2) = ${c12.toFixed(2)}  (SAME DIRECTION)`,
        140,
        -134,
        27,
        COSMOS.emerald,
        'mono',
        'left',
      ),
      txt('Keep S1 and S2 together in the same chunk', 140, -88, 26, COSMOS.ink, 'sans', 'left'),

      glassCell(495, 42, 770, 124, sc > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#231b10',
        glow: sc > 0.3 ? 9 : 2,
      }),
      txt(
        `cos(S2, S3) = ${c23.toFixed(2)}  < 0.5 -> PROPOSE CUT!`,
        140,
        14,
        27,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt('90-degree shift -> place cut before handoff', 140, 62, 26, COSMOS.ink, 'sans', 'left'),

      glassCell(495, 200, 770, 134, sz > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: sz > 0.3 ? '#29111a' : '#12182b',
        glow: sz > 0.3 ? 10 : 2,
      }),
      txt(
        `S4 ("No action..."): v = [${v4.join(', ')}] -> cos = ${String(c34)}`,
        140,
        166,
        26,
        COSMOS.rose,
        'mono',
        'left',
      ),
      txt(
        'Zero length = divide by zero -> send to review!',
        140,
        210,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        'Note: whole-word match avoids "id" inside "incident"',
        140,
        246,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glowDot(-840, 355, { radius: 6, color: COSMOS.gold }),
      txt(
        'Tune semantic thresholds on labeled questions; even real topic shifts can separate exceptions',
        -812,
        357,
        28,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('semantic-cosine-0', () => s.play(showVecs.to(1, { duration: 0.45 })));
  c.on('semantic-cosine-1', () => s.play(showCos.to(0.4, { duration: 0.35 })));
  c.on('cosine-first', () => s.play(showCos.to(0.7, { duration: 0.35 })));
  c.on('cosine-second', () => s.play(showCos.to(1, { duration: 0.4 })));
  c.on('semantic-cosine-2', () => s.play(showZero.to(0.6, { duration: 0.4 })));
  c.on('cosine-undefined', () =>
    s.play(showZero.to(1, { duration: remainDuration(c, 'cosine-undefined', 0.45) })),
  );
}
