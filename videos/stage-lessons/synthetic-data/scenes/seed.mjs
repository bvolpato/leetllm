// Scene 02: Keep the search task with its source (Seed S12 contract + split by seed family)
import {
  COSMOS,
  FIXTURE_PAGE_LIMIT,
  FIXTURE_RETRY_LIMIT,
  SEED_METADATA,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  line,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function seed(s, c) {
  const phase = s.value(0);
  const sName = s.value(0);
  const sSource = s.value(0);
  const sCursor = s.value(0);
  const sLimit = s.value(0);
  const sRetry = s.value(0);
  const sSlice = s.value(0);
  const sSplit = s.value(0);
  const sLineage = s.value(0);
  const sPrivate = s.value(0);

  const bgAura = aura(0, 20, 680, '#14335c2a', '#2e1d4a16');

  const title = heroTitle(['Keep the Search Task', 'With Its Source'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.blue,
    eyebrow: 'SEED LINEAGE & SPLIT ISOLATION · S12 CONTRACT',
  });

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.6);
    const nm = Math.max(0.76, sName.value);
    const src = sSource.value;
    const cur = sCursor.value;
    const lim = sLimit.value;
    const ret = sRetry.value;
    const slc = sSlice.value;
    const spl = sSplit.value;
    const lin = sLineage.value;
    const prv = sPrivate.value;

    const nodes = [
      // Top-left: Seed identity card (S12)
      glassCell(-465, -75, 760, 240, COSMOS.blue, {
        fill: '#0e1d36',
        glow: nm > 0.8 ? 8 * pulse : 4,
      }),
      txt('REVIEWED SEED RECORD', -815, -162, 26, COSMOS.blue, 'mono', 'left'),
      txt(SEED_METADATA.id, -815, -96, 62, COSMOS.ink, 'mono', 'left').glow(6, COSMOS.blue),
      txt(
        src > 0.2 ? `Source: ${SEED_METADATA.source}` : 'Source: search API documentation',
        -625,
        -96,
        28,
        src > 0.2 ? COSMOS.cyan : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        `Family: ${SEED_METADATA.family}`,
        -815,
        -22,
        26,
        slc > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),
      txt(
        'Practice: retry, then paginate',
        -815,
        18,
        26,
        slc > 0.2 ? COSMOS.gold : COSMOS.muted,
        'mono',
        'left',
      ),

      // Top-right: Contract rules (3 explicit enforceable checks)
      glassCell(445, -75, 780, 240, COSMOS.cyan, { fill: '#0d192e', glow: 5 }),
      txt('CONTRACT RULES (ATTACHED TO S12)', 85, -162, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '1. Follow every returned cursor until null',
        85,
        -104,
        28,
        cur > 0.2 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        `2. Request at most ${FIXTURE_PAGE_LIMIT} names per page`,
        85,
        -46,
        28,
        lim > 0.2 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),
      txt(
        `3. Retry a 429 on the same cursor up to ${FIXTURE_RETRY_LIMIT} times`,
        85,
        12,
        28,
        ret > 0.2 ? COSMOS.emerald : COSMOS.muted,
        'sans',
        'left',
      ),

      // Bottom-left: Training family lineage tree (S12 -> descendants keeping S12 ID)
      glassCell(-465, 250, 760, 290, spl > 0.2 ? COSMOS.blue : COSMOS.rule, {
        fill: spl > 0.2 ? '#0e1b33' : '#0b101d',
        glow: spl > 0.2 ? 7 : 0,
        opacity: Math.max(0.75, spl),
      }),
      txt('TRAINING SPLIT · SEED FAMILY S12', -815, 138, 26, COSMOS.blue, 'mono', 'left'),
      glassCell(-735, 252, 140, 84, COSMOS.blue, { fill: '#12294d', glow: 6 }),
      txt(SEED_METADATA.id, -735, 254, 34, COSMOS.ink, 'mono'),

      glassCell(-330, 204, 440, 68, lin > 0.2 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#102138',
        opacity: Math.max(0.72, lin),
      }),
      txt('Cursor task · S12', -330, 206, 26, lin > 0.2 ? COSMOS.cyan : COSMOS.dim, 'mono'),
      glassCell(-330, 304, 440, 68, lin > 0.2 ? COSMOS.cyan : COSMOS.rule, {
        fill: '#102138',
        opacity: Math.max(0.72, lin),
      }),
      txt('Retry task  · S12', -330, 306, 26, lin > 0.2 ? COSMOS.cyan : COSMOS.dim, 'mono'),

      // Vertical split barrier between training & reserved families
      line([0, 108], [0, 394], {
        stroke: spl > 0.2 ? COSMOS.gold : COSMOS.rule,
        width: spl > 0.2 ? 4 : 2,
        dash: [12, 8],
      }).glow(spl > 0.2 ? 8 : 0, COSMOS.gold),

      // Bottom-right: Reserved held-out families
      glassCell(445, 250, 780, 290, prv > 0.2 ? COSMOS.gold : COSMOS.rule, {
        fill: prv > 0.2 ? '#211a0e' : '#0b101d',
        dash: prv > 0.2 ? undefined : [10, 8],
        glow: prv > 0.2 ? 8 * pulse : 0,
        opacity: Math.max(0.75, prv),
      }),
      txt('RESERVED FAMILIES · HELD-OUT EVAL', 85, 138, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'Independently authored search tasks',
        85,
        214,
        32,
        prv > 0.2 ? COSMOS.ink : COSMOS.dim,
        'sans',
        'left',
      ),
      txt(
        'Never mixed into generator prompts',
        85,
        276,
        28,
        prv > 0.2 ? COSMOS.gold : COSMOS.dim,
        'sans',
        'left',
      ),
      txt(
        'Screened later for copied wording across families',
        85,
        336,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),
    ];

    if (lin > 0.1) {
      nodes.push(
        glowingArc([-660, 240], [-562, 204], -12, { color: COSMOS.cyan, width: 3.2, opacity: lin }),
        glowingArc([-660, 264], [-562, 304], 12, { color: COSMOS.cyan, width: 3.2, opacity: lin }),
        glowDot(-562, 204, { radius: 5.5, color: COSMOS.cyan, opacity: lin }),
        glowDot(-562, 304, { radius: 5.5, color: COSMOS.cyan, opacity: lin }),
      );
    }

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('seed-name', () => s.play(sName.to(1, { duration: 0.45 })));
  c.on('seed-source', () => s.play(sSource.to(1, { duration: 0.45 })));
  c.on('seed-cursor', () => s.play(sCursor.to(1, { duration: 0.45 })));
  c.on('seed-limit', () => s.play(sLimit.to(1, { duration: 0.45 })));
  c.on('seed-retry', () => s.play(sRetry.to(1, { duration: 0.45 })));
  c.on('seed-slice', () => s.play(sSlice.to(1, { duration: 0.45 })));
  c.on('family-split', () => s.play(sSplit.to(1, { duration: 0.5 })));
  c.on('keep-lineage', () => s.play(sLineage.to(1, { duration: 0.55 })));
  c.on('private-families', () =>
    s.play(sPrivate.to(1, { duration: remainDuration(c, 'private-families', 0.5) })),
  );
}
