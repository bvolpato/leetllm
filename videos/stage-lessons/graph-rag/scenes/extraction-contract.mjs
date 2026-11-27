// Scene 6: Read the words that produced the edge (Incident #1842 host-owned source ID, scoped resolution, FastGraphRAG co-occurrence)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function extractionContract(s, c) {
  const showFields = s.value(0);
  const showHost = s.value(0);
  const showScope = s.value(0);
  const showCooccur = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Read the Words That', 'Produced the Edge'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.cyan,
    eyebrow: 'EXTRACTION CONTRACT · HOST-OWNED SOURCE ID · SCOPED MERGE · CO-OCCURRENCE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sf = showFields.value;
    const sh = showHost.value;
    const ss = showScope.value;
    const sc = showCooccur.value;

    const nodes = [
      // Left top: Record 1842 + Host-attached provenance
      txt('1. INCIDENT NOTE #1842 EXTRACTION', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(
        -465,
        -94,
        780,
        154,
        sh > 0.3 ? COSMOS.emerald : sf > 0.3 ? COSMOS.cyan : COSMOS.muted,
        {
          fill: '#10203a',
          glow: sf > 0.3 ? 8 : 2,
        },
      ),
      txt(
        'Text: "Inference API depends on Redis cache."',
        -825,
        -134,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('Model: Service --[depends_on]--> Datastore', -825, -88, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        'HOST attaches source_id=1842 (host-owned)',
        -825,
        -44,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      // Left bottom: Scoped entity resolution rules
      txt(
        '2. SCOPED RESOLUTION & CONFLICT PRESERVATION',
        -855,
        18,
        26,
        COSMOS.gold,
        'mono',
        'left',
      ),

      glassCell(-465, 146, 780, 198, ss > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt(
        '· Normalize case & spaces; keep dashes (Redis-A != B)',
        -825,
        84,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt(
        '· Match title + type INSIDE same tenant & environment',
        -825,
        128,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),
      txt(
        '· Reject unknown or ambiguous endpoints immediately',
        -825,
        170,
        26,
        COSMOS.rose,
        'sans',
        'left',
      ),
      txt(
        '· Keep BOTH sources & dates if descriptions conflict',
        -825,
        210,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),

      // Right: Co-occurrence vs Causation + Hub Risk (FastGraphRAG)
      txt('3. CO-OCCURRENCE != CAUSATION', 110, -205, 26, COSMOS.amber, 'mono', 'left'),

      glassCell(495, -72, 750, 198, sc > 0.3 ? COSMOS.amber : COSMOS.muted, {
        fill: '#241a10',
        glow: sc > 0.3 ? 9 : 2,
      }),
      txt('Phrase: "cache timeout during migration"', 145, -134, 26, COSMOS.gold, 'mono', 'left'),
      txt(
        'FastGraphRAG links noun phrases in same unit:',
        145,
        -86,
        26,
        COSMOS.ink,
        'sans',
        'left',
      ),
      txt('Gives CO-OCCURRENCE only (NOT causation!)', 145, -42, 26, COSMOS.rose, 'mono', 'left'),
      txt('"might depend on" must preserve uncertainty', 145, 2, 26, COSMOS.muted, 'sans', 'left'),

      glassCell(495, 152, 750, 178, COSMOS.cyan, { fill: '#10182d', glow: 3 }),
      txt('STORAGE & DEGREE HYGIENE', 145, 92, 26, COSMOS.cyan, 'mono', 'left'),
      txt(
        '· Broad extractor -> noisy common-noun hubs',
        145,
        136,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),
      txt('· Narrow type list -> misses real links', 145, 176, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· Artifacts fit in tables (no graph DB required)',
        145,
        214,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.cyan }),
      txt(
        'Validate extracted schemas, attach host-owned source IDs, and check wording against the claim',
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

  c.on('extraction-contract-fields', () => s.play(showFields.to(1, { duration: 0.4 })));
  c.on('extraction-contract-host-source', () => s.play(showHost.to(1, { duration: 0.4 })));
  c.on('extraction-contract-scope', () => s.play(showScope.to(1, { duration: 0.4 })));
  c.on('extraction-contract-cooccur', () =>
    s.play(showCooccur.to(1, { duration: remainDuration(c, 'extraction-contract-cooccur', 0.45) })),
  );
}
