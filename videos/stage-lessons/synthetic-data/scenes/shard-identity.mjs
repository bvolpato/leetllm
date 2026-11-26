// Scene 17: Is this the row we approved? (Exact JSONL bytes + SHA-256 tamper avalanche vs separately stored approval)
import {
  COSMOS,
  SHARD_ORIGINAL_HASH,
  SHARD_TAMPERED_HASH,
  aura,
  glassCell,
  glowDot,
  glowingArc,
  group,
  guardedDynamic,
  heroTitle,
  remainDuration,
  runPhase,
  txt,
} from '../parts.mjs';

export default function shardIdentity(s, c) {
  const phase = s.value(0);
  const sDigest = s.value(0);
  const sHashBytes = s.value(0);
  const sHashLog = s.value(0);
  const sAct2 = s.value(0);
  const sTamper = s.value(0);
  const sMutable = s.value(0);
  const sRef = s.value(0);
  const sFail = s.value(0);
  const sAct3 = s.value(0);
  const sProv = s.value(0);
  const sRights = s.value(0);

  const bgAura = aura(0, 15, 680, '#2a184d2a', '#12385c18');

  const title = heroTitle(['Is This the Row', 'We Approved?'], {
    x: -855,
    y: -415,
    size: 56,
    lineHeight: 66,
    accent: COSMOS.violet,
    eyebrow: 'SHARD IDENTITY · SHA-256 BYTE DIGESTS & SEPARATE APPROVAL',
  });

  const fmtHash = (h) => `${h.slice(0, 32)}  ${h.slice(32)}`;

  const live = guardedDynamic(s.value(1), () => {
    const p = phase.value;
    const pulse = 0.72 + 0.28 * Math.sin(p * 3.8);

    // Act 3: Lineage back to S12 + approved snapshot + source permission record
    if (sAct3.value > 0.5) {
      const pv = sProv.value > 0.3;
      const rg = sRights.value > 0.3;
      const nodes = [
        txt('PROVENANCE & SOURCE RIGHTS CHAIN', 0, -196, 26, COSMOS.blue, 'mono'),

        glassCell(-555, -72, 460, 108, COSMOS.emerald, { fill: '#0e2824', glow: 6 }),
        txt('Approved row', -555, -70, 30, COSMOS.emerald, 'mono'),

        glassCell(0, -72, 340, 108, COSMOS.blue, { fill: '#102446', glow: 7 }),
        txt('Seed S12', 0, -70, 32, COSMOS.blue, 'mono'),

        glassCell(555, -72, 480, 108, COSMOS.cyan, { fill: '#0f2338', glow: 6 }),
        txt('Reviewed task', 555, -70, 30, COSMOS.cyan, 'mono'),

        glowingArc([-320, -72], [-175, -72], 0, { color: COSMOS.cyan, width: 3.6 }),
        glowingArc([175, -72], [310, -72], 0, { color: COSMOS.cyan, width: 3.6 }),

        glassCell(0, 126, 1580, 146, COSMOS.violet, { fill: '#17122b', glow: pv ? 8 : 4 }),
        txt(
          'STORED APPROVED SNAPSHOT & FULL SHA-256 (GENERATORS VARY ON REPLAY)',
          0,
          88,
          26,
          COSMOS.violet,
          'mono',
        ),
        txt(fmtHash(SHARD_ORIGINAL_HASH), 0, 148, 26, COSMOS.ink, 'mono'),

        glassCell(0, 336, 1580, 114, rg ? COSMOS.gold : COSMOS.rule, {
          fill: rg ? '#241b0d' : '#0c1222',
          glow: rg ? 9 * pulse : 2,
        }),
        txt(
          rg
            ? 'SOURCE PERMISSION RECORD ATTACHED  ->  reviewers can audit allowed usage'
            : 'Keep source permission evidence alongside the release manifest',
          0,
          338,
          28,
          rg ? COSMOS.gold : COSMOS.muted,
          'mono',
        ),
      ];
      return group(...nodes);
    }

    // Act 2: Tampered page_size 100 -> 10000 vs Separately Controlled Approval Digest
    if (sAct2.value > 0.5) {
      const tmp = sTamper.value > 0.3;
      const mut = sMutable.value > 0.3;
      const ref = sRef.value > 0.3;
      const fl = sFail.value > 0.5;

      const nodes = [
        glassCell(0, -148, 1580, 96, COSMOS.rose, {
          fill: '#281119',
          glow: tmp ? 9 * pulse : 6,
        }),
        txt(
          'TAMPERED PAYLOAD:  {"seed_id":"S12","page_size":10000} + LF',
          0,
          -146,
          30,
          COSMOS.rose,
          'mono',
        ),

        // Current co-located manifest digest (rewritten to match!)
        glassCell(0, 10, 1580, 134, mut ? COSMOS.amber : COSMOS.rule, {
          fill: mut ? '#241a0d' : '#0c1222',
          glow: mut ? 7 : 2,
        }),
        txt(
          'CO-LOCATED MANIFEST DIGEST (RECOMPUTED FOR TAMPERED FILE -> MATCHES!)',
          0,
          -24,
          26,
          COSMOS.amber,
          'mono',
        ),
        txt(fmtHash(SHARD_TAMPERED_HASH), 0, 32, 26, COSMOS.amber, 'mono'),

        // Separately stored immutable approval digest
        glassCell(0, 192, 1580, 134, ref ? COSMOS.blue : COSMOS.rule, {
          fill: '#0e1d36',
          glow: ref ? 8 : 3,
        }),
        txt(
          'SEPARATELY CONTROLLED APPROVAL DIGEST (IMMUTABLE REFERENCE)',
          0,
          158,
          26,
          COSMOS.blue,
          'mono',
        ),
        txt(fmtHash(SHARD_ORIGINAL_HASH), 0, 214, 26, COSMOS.cyan, 'mono'),

        // Verdict bar
        glassCell(0, 368, 1580, 92, fl ? COSMOS.rose : COSMOS.muted, {
          fill: fl ? '#281119' : '#10182b',
          glow: fl ? 10 * pulse : 2,
        }),
        glowDot(-750, 368, { radius: 7, color: fl ? COSMOS.rose : COSMOS.muted }),
        txt(
          fl
            ? 'DIGEST MISMATCH -> RELEASE CHECK FAILS (keep approval under separate control)'
            : 'Compare current shard hash against separately stored approval...',
          -715,
          370,
          28,
          fl ? COSMOS.rose : COSMOS.muted,
          'mono',
          'left',
        ),
      ];
      return group(...nodes);
    }

    // Act 1: Exact UTF-8 bytes + newline -> SHA-256 digest + manifest metadata
    const hb = Math.max(0.75, sHashBytes.value, sDigest.value);
    const hl = sHashLog.value > 0.3;

    const nodes = [
      txt(
        'ACCEPTED ROW EXACT UTF-8 BYTES (INCLUDING TRAILING NEWLINE)',
        0,
        -196,
        26,
        COSMOS.blue,
        'mono',
      ),
      glassCell(0, -104, 1480, 108, COSMOS.blue, { fill: '#0e1d36', glow: 6 }),
      txt('{"seed_id":"S12","page_size":100}  +  LF (0x0A)', 0, -102, 34, COSMOS.ink, 'mono'),

      glowingArc([0, -44], [0, 30], 0, { color: COSMOS.violet, width: 4.2, opacity: hb }),
      glowDot(0, 30, { radius: 7, color: COSMOS.violet, opacity: hb }),

      glassCell(0, 114, 1580, 144, COSMOS.violet, {
        fill: '#17122b',
        glow: hb > 0.8 ? 8 * pulse : 4,
        opacity: hb,
      }),
      txt('SHA-256 DIGEST STORED IN RELEASE MANIFEST', 0, 78, 26, COSMOS.violet, 'mono'),
      txt(fmtHash(SHARD_ORIGINAL_HASH), 0, 136, 26, COSMOS.cyan, 'mono'),

      glassCell(0, 326, 1580, 128, hl ? COSMOS.cyan : COSMOS.rule, {
        fill: hl ? '#0f2138' : '#0c1222',
        glow: hl ? 7 : 2,
      }),
      txt(
        'MANIFEST BINDS:  seed · model · prompt · filter settings · overlap index · decision log',
        0,
        304,
        26,
        hl ? COSMOS.cyan : COSMOS.muted,
        'mono',
      ),
      txt(
        'Gives every reviewer a complete byte-level trace of why the row was admitted',
        0,
        356,
        26,
        COSMOS.muted,
        'sans',
      ),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, live);
  runPhase(s, c, phase, 14);

  c.on('payload-digest', () => s.play(sDigest.to(1, { duration: 0.4 })));
  c.after('hash-bytes', () => s.play(sHashBytes.to(1, { duration: 0.35 })));
  c.on('hash-log', () => s.play(sHashLog.to(1, { duration: 0.45 })));

  c.on('change-payload', () => {
    s.play(sAct2.to(1, { duration: 0.3 }), sTamper.to(1, { duration: 0.45 }));
  });
  c.on('mutable-matches', () => s.play(sMutable.to(1, { duration: 0.45 })));
  c.on('trusted-reference', () => s.play(sRef.to(1, { duration: 0.45 })));
  c.after('approval-fails', () => s.play(sFail.to(1, { duration: 0.35 })));

  c.on('provenance-limit', () => {
    s.play(sAct3.to(1, { duration: 0.3 }), sProv.to(1, { duration: 0.45 }));
  });
  c.on('rights-evidence', () =>
    s.play(sRights.to(1, { duration: remainDuration(c, 'rights-evidence', 0.45) })),
  );
}
