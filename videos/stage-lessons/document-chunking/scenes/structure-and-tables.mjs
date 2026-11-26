// Scene 5: What belongs with the 14-day window? (Headings, repeating table headers, provenance locator)
import {
  COSMOS,
  aura,
  glassCell,
  glowDot,
  group,
  guardedDynamic,
  headedSection,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function structureAndTables(s, c) {
  const phase = s.value(0);
  const showHeading = s.value(0);
  const showRow = s.value(0);
  const showRepeat = s.value(0);
  const showLoc = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2a1c5216');
  const title = heroTitle(['Headings, Tables &', 'Source Locators'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'STRUCTURE-AWARE CHUNKING · ATTACH HEADINGS · REPEAT TABLE HEADERS',
  });

  const sec = headedSection();

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const sh = showHeading.value;
    const sr = showRow.value;
    const sRep = showRepeat.value;
    const sl = showLoc.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    const nodes = [
      // Left: Heading attachment
      txt('1. ATTACH SECTION HEADING TO SEARCH TEXT', -855, -205, 26, COSMOS.cyan, 'mono', 'left'),
      glassCell(-465, -75, 770, 188, sh > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2624',
        glow: sh > 0.3 ? 9 * pulse : 3,
      }),
      txt(`HEADING:  ## ${sec.heading}`, -825, -130, 27, COSMOS.gold, 'mono', 'left'),
      txt(`BODY:     ${sec.rule}`, -825, -82, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Searchable chunk carries condition + deadline!',
        -825,
        -26,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      // Left bottom: Provenance locator
      txt('3. PRESERVE PROVENANCE LOCATOR', -855, 62, 26, COSMOS.gold, 'mono', 'left'),
      glassCell(-465, 186, 770, 168, sl > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#10203a',
        glow: sl > 0.3 ? 9 * pulse : 3,
      }),
      txt(`LOCATOR: ${sec.locator}`, -825, 142, 26, COSMOS.cyan, 'mono', 'left'),
      txt('Store doc version, page & original row span', -825, 188, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        'Lets engineers check whole-table qualifiers',
        -825,
        228,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      // Right: Detached table row vs Header-repeated row group
      txt(
        '2. TABLE ROW WITHOUT vs WITH COLUMN HEADERS',
        110,
        -205,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),

      glassCell(495, -96, 760, 146, sr > 0.3 && sRep < 0.4 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sr > 0.3 && sRep < 0.4 ? 8 * pulse : 2,
      }),
      txt('DETACHED ROW (AMBIGUOUS!)', 145, -138, 26, COSMOS.rose, 'mono', 'left'),
      txt(
        '| Routine notes | 14 days | release summary |',
        145,
        -90,
        26,
        COSMOS.amber,
        'mono',
        'left',
      ),
      txt(
        'Which column is the window? Which is evidence?',
        145,
        -48,
        26,
        COSMOS.muted,
        'sans',
        'left',
      ),

      glassCell(495, 134, 760, 230, sRep > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: sRep > 0.3 ? '#0e2824' : '#12182b',
        glow: sRep > 0.3 ? 10 * pulse : 2,
      }),
      txt('HEADER REPEATED PER ROW GROUP', 145, 58, 26, COSMOS.emerald, 'mono', 'left'),
      txt('| Policy   | Window  | Required Evidence |', 145, 108, 26, COSMOS.gold, 'mono', 'left'),
      txt('| Rollback | 15 min  | deploy ID         |', 145, 152, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        '| Routine  | 14 days | release summary   |',
        145,
        196,
        26,
        COSMOS.emerald,
        'mono',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Headings and repeated table headers make chunks self-describing; locators verify full source context',
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

  c.on('attach-heading', () => s.play(showHeading.to(1, { duration: 0.45 })));
  c.on('read-row', () => s.play(showRow.to(1, { duration: 0.45 })));
  c.on('table-repeat-header', () => s.play(showRepeat.to(1, { duration: 0.45 })));
  c.on('row-location', () =>
    s.play(showLoc.to(1, { duration: remainDuration(c, 'row-location', 0.45) })),
  );
}
