// Scene 16: Which passages enter the index? (Evidence-backed manifest gate, SHA-256 edit detection, quarantine & scope)
import {
  CHECKSUMS,
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

export default function manifestRelease(s, c) {
  const showManifest = s.value(0);
  const showAdmit = s.value(0);
  const showHash = s.value(0);
  const showScope = s.value(0);

  const bgAura = aura(0, 10, 680, '#12335e26', '#2b1b5216');
  const title = heroTitle(['Which Passages', 'Enter the Index?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.emerald,
    eyebrow: 'INDEX MANIFEST · EVIDENCE REVIEW GATE · SHA-256 VERSIONING · QUARANTINE',
  });

  const live = guardedDynamic(s.value(1), () => {
    const sm = showManifest.value;
    const sa = showAdmit.value;
    const sh = showHash.value;
    const ss = showScope.value;

    const hOrig = CHECKSUMS.originalHash.slice(0, 16);
    const hEdit = CHECKSUMS.editedHash.slice(0, 16);

    const nodes = [
      // Left: Two manifest records sharing plausible metadata, separated by review status
      txt('1. EVIDENCE REVIEW DECIDES ADMISSION', -855, -205, 26, COSMOS.emerald, 'mono', 'left'),

      glassCell(-465, -96, 780, 134, sa > 0.3 ? COSMOS.emerald : COSMOS.muted, {
        fill: '#0e2824',
        glow: sa > 0.3 ? 9 : 3,
      }),
      txt('RECORD A · Complete Rollback Passage', -825, -130, 26, COSMOS.emerald, 'mono', 'left'),
      txt('src + locator + heading + sha256 -> READY', -825, -86, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        'ADMITTED TO INDEX (backed by evidence check)',
        -825,
        -48,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),

      glassCell(-465, 86, 780, 148, sm > 0.3 ? COSMOS.rose : COSMOS.muted, {
        fill: '#26111a',
        glow: sm > 0.3 ? 7 : 2,
      }),
      txt('RECORD B · Broken Deadline Fragment', -825, 46, 26, COSMOS.rose, 'mono', 'left'),
      txt('src + locator + heading + sha256 -> REVIEW', -825, 90, 26, COSMOS.ink, 'mono', 'left'),
      txt(
        'HELD OUT (auto-stamping "ready" skips check)',
        -825,
        128,
        26,
        COSMOS.amber,
        'sans',
        'left',
      ),

      // Right top: SHA-256 edit detection (15 -> 20 minutes)
      txt('2. EDIT DETECTION VIA SHA-256', 110, -205, 26, COSMOS.gold, 'mono', 'left'),

      glassCell(495, -96, 750, 148, sh > 0.3 ? COSMOS.gold : COSMOS.muted, {
        fill: '#231c10',
        glow: sh > 0.3 ? 9 : 2,
      }),
      txt(`15 min -> sha256: ${hOrig}...`, 145, -134, 26, COSMOS.cyan, 'mono', 'left'),
      txt(`20 min -> sha256: ${hEdit}...`, 145, -90, 26, COSMOS.gold, 'mono', 'left'),
      txt('Same byte length, totally different digest!', 145, -46, 26, COSMOS.ink, 'sans', 'left'),

      // Right bottom: Production runbook checklist
      txt('3. PRODUCTION RELEASE CONTRACT', 110, 24, 26, COSMOS.cyan, 'mono', 'left'),

      glassCell(495, 152, 750, 198, ss > 0.3 ? COSMOS.cyan : COSMOS.muted, {
        fill: '#101d35',
        glow: ss > 0.3 ? 8 : 2,
      }),
      txt('· 1 section per heading; keep table headers', 145, 92, 26, COSMOS.ink, 'sans', 'left'),
      txt(
        '· Store doc hash + version + splitter config',
        145,
        132,
        26,
        COSMOS.cyan,
        'sans',
        'left',
      ),
      txt(
        '· Carry trust & auth scope (even on expand)',
        145,
        172,
        26,
        COSMOS.emerald,
        'sans',
        'left',
      ),
      txt(
        '· Quarantine blocks bad source; test failures',
        145,
        212,
        26,
        COSMOS.gold,
        'sans',
        'left',
      ),

      glowDot(-840, 358, { radius: 6, color: COSMOS.emerald }),
      txt(
        'Hashes detect byte edits; evidence checks, versions, quarantine, and permissions govern release',
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

  c.on('manifest-release-0', () => s.play(showManifest.to(1, { duration: 0.4 })));
  c.on('manifest-ready', () => s.play(showAdmit.to(1, { duration: 0.4 })));
  c.on('manifest-release-1', () => s.play(showHash.to(0.5, { duration: 0.35 })));
  c.on('manifest-edit', () => s.play(showHash.to(1, { duration: 0.4 })));
  c.on('manifest-release-2', () =>
    s.play(showScope.to(1, { duration: remainDuration(c, 'manifest-release-2', 0.45) })),
  );
}
