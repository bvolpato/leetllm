// Scene 10: Which version of the addition did the cache return? Header scale 1 -> 2, strict prediction hold before stale 9 -> miss -> rebuilt 18!
import {
  COSMOS,
  ROLE,
  SPEC_REBUILT,
  SPEC_STALE,
  aura,
  glassCell,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function identity(s, c) {
  const revOrig = s.value(0);
  const saved = s.value(0);
  const hdrChanged = s.value(0);
  const revStale = s.value(0);
  const keyWithHdr = s.value(0);
  const revMiss = s.value(0);
  const compiling = s.value(0);
  const revRebuilt = s.value(0);

  const bgAura = aura(0, 20, 640, '#ffd1661c', '#6ee7b718');
  const title = heroTitle(['Which Version Did', 'the Cache Return?'], {
    x: -855,
    y: -415,
    size: 54,
    lineHeight: 64,
    accent: COSMOS.gold,
    eyebrow: 'COMPILATION IDENTITY · TRANSITIVE HEADERS',
  });

  const live = guardedDynamic(1, () => {
    const ro = revOrig.value;
    const sv = saved.value;
    const hc = hdrChanged.value;
    const rs = revStale.value;
    const kh = keyWithHdr.value;
    const rm = revMiss.value;
    const cm = compiling.value;
    const rb = revRebuilt.value;

    const nodes = [
      // Left: Source + Header input
      glassCell(-630, -110, 410, 118, ROLE.host, { fill: '#101f3b', glow: 6 }),
      txt('MAIN FILE (unchanged)', -630, -138, 26, ROLE.host, 'mono'),
      txt('(4 + 5) * HEADER_SCALE', -630, -86, 28, COSMOS.ink, 'mono'),

      glassCell(-630, 88, 410, 118, hc > 0.5 ? COSMOS.gold : ROLE.cubin, {
        fill: hc > 0.5 ? '#2b2210' : '#0e2624',
        glow: hc > 0.5 ? 11 : 6,
      }),
      txt('INCLUDED HEADER', -630, 60, 26, hc > 0.5 ? COSMOS.gold : ROLE.cubin, 'mono'),
      txt(
        hc > 0.5 ? 'HEADER_SCALE = 2 (NEW)' : 'HEADER_SCALE = 1',
        -630,
        112,
        28,
        hc > 0.5 ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),

      // Top-right: Main-only cache key path (stale hit -> 9!)
      glassCell(240, -110, 740, 148, rs > 0.5 ? ROLE.fail : sv > 0.5 ? ROLE.ir : COSMOS.dim, {
        fill: rs > 0.5 ? '#2d101c' : '#0e1c32',
        glow: rs > 0.5 ? 11 : 5,
      }),
      txt('LOOKUP A: KEY = MAIN FILE ONLY', 240, -152, 26, COSMOS.muted, 'mono'),
      txt(
        rs > 0.5
          ? `STALE HIT → writes ${SPEC_STALE.cached} (wrong!)`
          : hc > 0.5
            ? 'Predict: what will this cache return?'
            : ro > 0.5
              ? `Scale 1 cached → stores ${SPEC_STALE.cached}`
              : '4 + 5 = 9',
        240,
        -92,
        30,
        rs > 0.5 ? ROLE.fail : COSMOS.gold,
        'mono',
      ),

      // Bottom-right: Full key (main + header bytes) -> MISS -> Recompile -> 18!
      glassCell(
        240,
        108,
        740,
        168,
        rb > 0.5 ? ROLE.cubin : rm > 0.5 ? COSMOS.gold : kh > 0.5 ? ROLE.ir : COSMOS.dim,
        {
          fill: rb > 0.5 ? '#0d2924' : '#0e192b',
          glow: rb > 0.5 ? 12 : rm > 0.5 ? 9 : 2,
        },
      ),
      txt('LOOKUP B: KEY = MAIN + HEADER BYTES', 240, 56, 26, COSMOS.muted, 'mono'),
      txt(
        rb > 0.5
          ? `REBUILT → writes ${SPEC_REBUILT.current} (EXACT!)`
          : cm > 0.5
            ? 'Compiling scale = 2...'
            : rm > 0.5
              ? 'CACHE MISS (header bytes differ)'
              : kh > 0.5
                ? 'Hashing header bytes into key...'
                : 'waiting for full key',
        240,
        112,
        30,
        rb > 0.5 ? ROLE.cubin : rm > 0.5 ? COSMOS.gold : COSMOS.muted,
        'mono',
      ),
      txt(
        rb > 0.5
          ? 'Verify artifact digest + device compat before load'
          : 'Every code-gen dependency belongs in key',
        240,
        162,
        26,
        COSMOS.muted,
        'sans',
      ),

      glowingArc([-420, -110], [-134, -110], -20, { color: ROLE.host, width: 3.4, opacity: 0.85 }),
      glowingArc([-420, 88], [-134, 108], 20, {
        color: kh > 0.5 ? ROLE.cubin : COSMOS.dim,
        width: 3.4,
        opacity: kh > 0.5 ? 0.9 : 0.35,
      }),
    ];

    nodes.push(
      txt(
        rb > 0.5
          ? 'Main-only key served stale 9 · full recipe key rebuilt 18'
          : hc > 0.5 && rs < 0.5
            ? 'Main file is identical, only header changed to 2'
            : 'Cache key must capture every included header byte',
        0,
        384,
        28,
        rb > 0.5 ? ROLE.cubin : COSMOS.gold,
        'sans',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.after('cache-original', () =>
    s.play(revOrig.to(1, { duration: remainDuration(c, 'cache-original', 0.4) })),
  );
  c.on('cache-save', () => s.play(saved.to(1, { duration: remainDuration(c, 'cache-save', 0.4) })));
  c.on('cache-header', () =>
    s.play(hdrChanged.to(1, { duration: remainDuration(c, 'cache-header', 0.45) })),
  );
  c.after('stale-result', () =>
    s.play(revStale.to(1, { duration: remainDuration(c, 'stale-result', 0.4) })),
  );
  c.on('lookup-header', () =>
    s.play(keyWithHdr.to(1, { duration: remainDuration(c, 'lookup-header', 0.4) })),
  );
  c.after('header-miss', () =>
    s.play(revMiss.to(1, { duration: remainDuration(c, 'header-miss', 0.4) })),
  );
  c.on('compile-header', () =>
    s.play(compiling.to(1, { duration: remainDuration(c, 'compile-header', 0.4) })),
  );
  c.after('rebuilt-result', () =>
    s.play(revRebuilt.to(1, { duration: remainDuration(c, 'rebuilt-result', 0.45) })),
  );
}
