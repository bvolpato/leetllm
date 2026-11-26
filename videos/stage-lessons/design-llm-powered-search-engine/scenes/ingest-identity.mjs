// Scene 3: ingest-identity - Publish a source representation with defined offsets
// Signature orbiting 3D Immutable Revision Slab showing bound metadata facets, normalized-vs-HTML
// byte offset shift, current-revision registry gating, and 4 distinct source clocks.
import { gridPlane3d, group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SEARCH_TEXT,
  addArc3D,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  driftValue,
  guardedDynamic,
  orbitScene,
  sourceDigest,
  txt,
  wireframeSlab3d,
} from '../parts.mjs';

export default function ingestIdentity(s, c) {
  const pulse = s.value(0);
  const fieldsOn = s.value(0);
  const offsetOn = s.value(0);
  const denyOn = s.value(0);
  const regAdvance = s.value(0);
  const clocksOn = s.value(0);
  const clockSweep = s.value(0);

  const digestShort = sourceDigest(SEARCH_TEXT.policy).slice(0, 12);
  const rawByte12 = Buffer.byteLength('<p>' + SEARCH_TEXT.policy.slice(0, 12));

  const header = cinemaHeader(
    'INGESTION & IDENTITY',
    'Bind immutable source',
    'revision and offsets',
    {
      accent: ROLE.policy,
      size: 46,
    },
  );

  const stageAura = aura(420, 10, 560, '#60a5fa22', '#5ce1e618');

  // Orbiting 3D Immutable Revision Slab on right half
  const slab3d = cinematic3d({
    theta: -0.76,
    phi: 1.02,
    distance: 15.6,
    unit: 108,
    focus: [0, 0, 0.7],
  }).at(430, 10);

  slab3d.add(
    gridPlane3d({
      x: [-3.2, 3.2],
      y: [-2.6, 2.6],
      z: 0,
      step: 1.1,
      color: '#223357',
      width: 1.2,
      opacity: 0.48,
    }),
  );

  // Core immutable snapshot slab + wireframe guard cage
  addBox3D(slab3d, -1.5, -1.0, 0.15, 3.0, 2.0, 0.7, ROLE.policy, ROLE.query, {
    faceOpacity: 0.76,
    edgeGlow: 8,
  });
  addBox3D(slab3d, -1.3, -0.8, 1.05, 2.6, 1.6, 0.42, ROLE.exception, ROLE.exception, {
    faceOpacity: 0.72,
    edgeGlow: 7,
  });
  slab3d.add(
    ...wireframeSlab3d([0, 0, 1.95], 1.4, 0.9, 0.28, {
      color: ROLE.focus,
      width: 2.5,
      glow: 9,
    }),
  );

  addArc3D(slab3d, [-2.4, -1.6, 0.1], [-1.3, -0.8, 1.3], ROLE.query, {
    lift: 0.55,
    pulseVal: pulse,
    phaseOffset: 0.0,
  });
  addArc3D(slab3d, [2.4, 1.5, 0.1], [1.3, 0.8, 1.9], ROLE.focus, {
    lift: 0.55,
    pulseVal: pulse,
    phaseOffset: 0.5,
  });

  const overlay = guardedDynamic(
    () => 1,
    () => {
      const f = fieldsOn.value;
      const off = offsetOn.value;
      const dn = denyOn.value;
      const adv = regAdvance.value > 0.5;
      const clk = clocksOn.value;
      const sw = clockSweep.value;

      const nodes = [
        txt('IMMUTABLE REVISION SLAB (policy@2)', 430, -430, 26, ROLE.query, 'mono', 'center'),
        txt(
          'BLUE: SNAPSHOT  ·  GREEN: ACL + HASH  ·  GOLD: REGISTRY',
          430,
          435,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      ];

      // Left column: 6 core bound fields (clean floating rows, no cramped cards)
      const rows = [
        [
          'DOC / REV',
          adv ? 'indexed@2 vs current@3' : 'policy@2 (current@2)',
          adv ? ROLE.deny : ROLE.policy,
        ],
        ['TENANT / ACL', 'workspace-a  ·  engineering grant', ROLE.exception],
        ['OFFSETS', `[0, ${SEARCH_TEXT.policy.length}) normalized-text-v1`, ROLE.focus],
        ['DIGEST', `sha256 ${digestShort}...`, ROLE.query],
        ['CLOCKS', 'published / effective / ingested / indexed', COSMOS.muted],
      ];

      const visibleCount = Math.max(
        1,
        Math.min(rows.length, Math.ceil(Math.max(0.2, f) * rows.length)),
      );
      rows.slice(0, visibleCount).forEach(([k, v, col], i) => {
        const y = -225 + i * 74;
        nodes.push(
          txt(k, -855, y, 26, COSMOS.muted, 'mono', 'left'),
          txt(v, -610, y, 27, col, 'mono', 'left'),
        );
      });

      // Bottom-left teaching strip transitions cleanly by beat
      if (clk > 0.5) {
        // Beat 2: 4 distinct clocks
        const names = ['published', 'effective', 'ingested', 'indexed'];
        nodes.push(
          txt('FOUR DISTINCT SOURCE CLOCKS', -855, 195, 26, ROLE.focus, 'mono', 'left'),
          line([-855, 255], [-60, 255], { stroke: '#334873', width: 3 }),
        );
        names.forEach((name, i) => {
          const x = -790 + i * 235;
          const active = sw >= i * 0.22;
          const col = active ? ROLE.query : COSMOS.dim;
          nodes.push(
            line([x, 240], [x, 270], { stroke: col, width: 3.5 }),
            txt(name, x, 305, 26, col, 'mono', 'center'),
          );
        });
        nodes.push(
          txt(
            'Newly crawled old revision is still old policy',
            -855,
            375,
            28,
            ROLE.caution,
            'sans',
            'left',
          ),
        );
      } else if (dn > 0.5) {
        // Beat 1: Deny path & current-revision registry
        const col = adv ? ROLE.deny : ROLE.focus;
        nodes.push(
          rect(820, 148, { fill: '#101526', stroke: col, width: 2.8, radius: 12 })
            .at(-445, 290)
            .glow(8, col),
          txt(
            adv ? 'REGISTRY GATE: REJECT STALE CANDIDATE' : 'DENY PATH ACTIVE BEFORE REBUILD',
            -825,
            252,
            26,
            col,
            'mono',
            'left',
          ),
          txt(
            adv
              ? 'current@3 != indexed@2 -> block stale policy@2'
              : 'Revocations and deletions act before embeddings finish',
            -825,
            318,
            28,
            COSMOS.ink,
            'sans',
            'left',
          ),
        );
      } else if (off > 0.5) {
        // Beat 0 offset contrast
        nodes.push(
          rect(820, 140, { fill: '#101627', stroke: ROLE.focus, width: 2.6, radius: 12 })
            .at(-445, 290)
            .glow(7, ROLE.focus),
          txt('OFFSET REPRESENTATION MISMATCH', -825, 254, 26, ROLE.focus, 'mono', 'left'),
          txt(
            `<p> wrapper: char 12 -> raw byte ${rawByte12}`,
            -825,
            316,
            27,
            COSMOS.ink,
            'mono',
            'left',
          ),
        );
      } else {
        nodes.push(
          txt(
            'Retain snapshot, normalized offsets, and normalization version.',
            -855,
            290,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, slab3d, header, overlay);
  orbitScene(s, c, slab3d, { theta: -0.18, phi: 0.88 }, { startOffset: 0.1, endMargin: 0.5 });
  driftValue(s, c, pulse, 4.6, { startOffset: 0.1, endMargin: 0.5 });

  c.on('se-ingest-identity-0', () => {
    s.play(fieldsOn.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-0').start, 1.2) }));
  });
  c.on('se-ingest-identity-offset', () => {
    s.play(
      offsetOn.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-offset').start, 0.3) }),
    );
  });
  c.on('se-ingest-identity-1', () => {
    s.play(denyOn.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-1').start, 0.3) }));
  });
  c.on('se-ingest-identity-registry', () => {
    s.play(
      regAdvance.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-registry').start, 0.3) }),
    );
  });
  c.on('se-ingest-identity-2', () => {
    s.play(clocksOn.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-2').start, 0.3) }));
  });
  c.on('se-ingest-identity-clocks', () => {
    s.play(
      clockSweep.to(1, { duration: clampDur(c, c.cue('se-ingest-identity-clocks').start, 0.9) }),
    );
  });
}
