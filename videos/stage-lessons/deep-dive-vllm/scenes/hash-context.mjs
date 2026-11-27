// Scene 09: Which cache record follows the adapter? (Chained parent hash + tokens + context; Adapter Finch moves revision-one -> revision-two; HOLD prediction -> reveal v0.28 name-only vs v0.31 tagged + path!).
import {
  COSMOS,
  ROLE,
  aura,
  glassCell,
  group,
  guardedDynamic,
  heroTitle,
  txt,
  wireStepCues,
} from '../parts.mjs';

export default function hashContext(s, c) {
  // step:
  // 0 = hash-parent (chained parent hash + exact tokens + execution context)
  // 1 = hash-revision (manifest path changes revision-one -> revision-two)
  // 2 = hash-ask (PREDICTION HOLD: Which version records the path change?)
  // 3 = hash-name-only (AFTER: v0.28 records adapter name "Finch" only)
  // 4 = hash-tagged (AFTER: v0.31 tags extra fields & includes adapter path!)
  const step = s.value(0);

  const bgAura = aura(0, 20, 620, '#ffd1661a', '#5ce1e61a');
  const title = heroTitle(['Which Cache Record', 'Follows the Adapter?'], {
    x: -855,
    y: -430,
    size: 54,
    lineHeight: 62,
    accent: COSMOS.gold,
    eyebrow: 'CHAINED SHA-256 CACHE IDENTITY · v0.28 VS v0.31',
  });

  const live = guardedDynamic(1, () => {
    const st = Math.round(step.value);
    const pathChanged = st >= 1;
    const nodes = [
      txt(
        'FULL-BLOCK CACHE RECORD (SHA-256 DIGEST INPUT)',
        -855,
        -245,
        26,
        ROLE.kv,
        'mono',
        'left',
      ),
    ];

    // Top row: 3 serialized hash input fields
    const fields = [
      ['1. PARENT HASH', 'History through "sat"', ROLE.kv],
      ['2. EXACT TOKEN IDS', 'on   the   green   branch', ROLE.r0],
      ['3. EXECUTION CONTEXT', 'Adapter: Finch  +  namespace', COSMOS.gold],
    ];
    fields.forEach(([label, val, col], i) => {
      const cx = -575 + i * 575;
      nodes.push(
        glassCell(cx, -145, 535, 130, col, { fill: '#0f1b2e', glow: 8 }),
        txt(label, cx, -178, 26, col, 'mono'),
        txt(val, cx, -122, 26, COSMOS.ink, 'mono'),
      );
    });

    // Middle row: Adapter Manifest (Name stays Finch; Path flips revision-one -> revision-two)
    nodes.push(
      txt('ADAPTER MANIFEST ON DISK', -855, -30, 26, COSMOS.muted, 'mono', 'left'),
      glassCell(-430, 56, 810, 108, ROLE.r0, { fill: '#101f38', glow: 6 }),
      txt('DISPLAY NAME:  Finch   (UNCHANGED)', -430, 56, 28, COSMOS.ink, 'mono'),

      glassCell(430, 56, 810, 108, pathChanged ? COSMOS.gold : ROLE.kv, {
        fill: pathChanged ? '#29200e' : '#0e202c',
        glow: pathChanged ? 11 : 6,
      }),
      txt(
        pathChanged
          ? 'WEIGHT PATH:  /adapters/revision-two  (NEW)'
          : 'WEIGHT PATH:  /adapters/revision-one',
        430,
        56,
        28,
        pathChanged ? COSMOS.gold : COSMOS.ink,
        'mono',
      ),
    );

    // Bottom comparison row: Strictly withheld during beat 0 & beat 1 prediction hold!
    if (st <= 2) {
      nodes.push(
        glassCell(-430, 215, 810, 118, COSMOS.dim, { fill: '#0b101d', glow: 3 }),
        txt('v0.28.0  SERIALIZED INPUT', -430, 188, 26, COSMOS.muted, 'mono'),
        txt(
          st >= 2 ? 'Does it include the path?' : 'Awaiting manifest revision...',
          -430,
          238,
          26,
          COSMOS.gold,
          'mono',
        ),

        glassCell(430, 215, 810, 118, COSMOS.dim, { fill: '#0b101d', glow: 3 }),
        txt('v0.31.0  SERIALIZED INPUT', 430, 188, 26, COSMOS.muted, 'mono'),
        txt(
          st >= 2 ? 'Does it include the path?' : 'Awaiting manifest revision...',
          430,
          238,
          26,
          COSMOS.gold,
          'mono',
        ),
      );
    } else {
      nodes.push(
        glassCell(-430, 215, 810, 118, ROLE.bad, { fill: '#2a1320', glow: 9 }),
        txt('v0.28.0:  NAME ONLY ("Finch")', -430, 188, 26, ROLE.bad, 'mono'),
        txt(
          'Path absent & extra sources implicit -> same hash!',
          -430,
          238,
          26,
          COSMOS.ink,
          'sans',
        ),

        glassCell(430, 215, 810, 118, st >= 4 ? ROLE.good : COSMOS.dim, {
          fill: st >= 4 ? '#0d2a24' : '#0b101d',
          glow: st >= 4 ? 11 : 3,
        }),
        txt(
          st >= 4 ? 'v0.31.0:  TAGGED FIELDS + ADAPTER PATH' : 'v0.31.0  SERIALIZED INPUT',
          430,
          188,
          26,
          st >= 4 ? ROLE.good : COSMOS.muted,
          'mono',
        ),
        txt(
          st >= 4
            ? 'Path changes serialized input -> new SHA-256 digest!'
            : 'Comparing tagged format...',
          430,
          238,
          26,
          COSMOS.ink,
          'sans',
        ),
      );
    }

    const caption =
      st >= 4
        ? 'v0.31 tags extra fields & includes the path; verifying weight bytes remains a deploy check'
        : st === 3
          ? 'v0.28 serializes only the display name "Finch", so its hash input stays unchanged'
          : st >= 1
            ? 'Predict: Display name stayed Finch, path changed. Which version records the path change?'
            : 'A different earlier history changes the parent hash even when all 4 words match';

    nodes.push(txt(caption, 0, 382, 26, st >= 4 ? ROLE.good : COSMOS.gold, 'sans'));
    return group(...nodes);
  });

  s.add(bgAura, title, live);
  wireStepCues(s, c, step, [
    ['hash-parent', 0],
    ['hash-revision', 1],
    ['hash-ask', 2],
    ['hash-name-only', 3, true],
    ['hash-tagged', 4, true],
  ]);
}
