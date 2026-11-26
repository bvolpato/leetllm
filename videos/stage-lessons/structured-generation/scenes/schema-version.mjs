// Scene 23: schema-version - Let application code select the contract
// Host-owned version stamping conduit: App selects RunStatusUpdate v2 -> validates payload ->
// attaches schema_version: "2" in code -> Consumer v1 hits compatibility barrier ->
// schema/adapter edits require rechecking compiled grammar cache identity (24h cache != KV cache).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  driftValue,
  fsmNode,
  guardedDynamic,
  opticalRail,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function schemaVersion(s, c) {
  const pulse = s.value(0);
  const b0Hi = s.value(0);
  const codeTagged = s.value(0);
  const b1Hi = s.value(0);
  const v1Blocked = s.value(0);
  const b2Hi = s.value(0);
  const artifactRecheck = s.value(0);

  const header = cinemaHeader(
    'HOST-OWNED SCHEMA VERSIONING',
    'Let application code',
    'select the contract',
    { accent: ROLE.prefix, size: 48 },
  );

  const stageAura = aura(200, 40, 640, '#ffd1661b', '#60a5fa18');

  const stageView = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const b0 = b0Hi.value;
      const ct = codeTagged.value;
      const b1 = b1Hi.value;
      const v1 = v1Blocked.value;
      const b2 = b2Hi.value;
      const ar = artifactRecheck.value;
      const nodes = [];

      // Top conduit: App Validator v2 -> Validated Payload
      const topY = -125;
      nodes.push(
        opticalRail(-840, topY - 58, topY + 58, ROLE.schema),
        txt('APP-SELECTED VALIDATOR', -805, topY - 40, 26, ROLE.schema, 'mono', 'left'),
        txt('RunStatusUpdate  v2', -805, topY + 12, 34, COSMOS.ink, 'mono', 'left').glow(
          b0 > 0.3 ? 6 : 0,
          ROLE.schema,
        ),
        txt('run_id · status · failing_job', -805, topY + 54, 26, COSMOS.muted, 'mono', 'left'),

        beamWithPhotons(quadArcPts([-140, topY + 10], [110, topY + 10], -24), ROLE.legal, p * 1.1, {
          width: 3.4,
        }),

        opticalRail(140, topY - 58, topY + 58, ROLE.legal),
        txt('VALIDATED PAYLOAD', 175, topY - 40, 26, ROLE.legal, 'mono', 'left'),
        txt('RUN-842 / failed / unit-tests', 175, topY + 12, 32, ROLE.legal, 'mono', 'left'),
        txt('Verified locally before stamping', 175, topY + 54, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Middle row: Code-owned envelope (left) -> Compatibility check for Consumer v1 (right)
      const midY = 105;
      nodes.push(
        opticalRail(-840, midY - 60, midY + 60, ct > 0.3 ? ROLE.prefix : COSMOS.dim),
        txt('CODE-OWNED ENVELOPE', -805, midY - 42, 26, ROLE.prefix, 'mono', 'left'),
        txt(
          ct > 0.3 ? 'schema_version: "2"  (HOST STAMP)' : 'awaiting host tag...',
          -805,
          midY + 10,
          32,
          ct > 0.3 ? ROLE.prefix : COSMOS.dim,
          'mono',
          'left',
        ).glow(ct > 0.3 ? 8 : 0, ROLE.prefix),
        txt(
          'Never let the model pick its own validator',
          -805,
          midY + 56,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Right consumer compatibility gate
      const cCol = v1 > 0.3 ? ROLE.prune : b1 > 0.3 ? ROLE.schema : COSMOS.dim;
      nodes.push(
        beamWithPhotons(quadArcPts([-120, midY + 10], [110, midY + 10], 24), cCol, p * 1.1 + 0.5, {
          alpha: 0.35 + 0.65 * Math.max(ct, b1),
          width: 3.2,
          photonCount: v1 > 0.3 ? 0 : 1,
        }),
        fsmNode(210, midY + 10, 62, v1 > 0.3 ? '!=' : 'v1', {
          color: cCol,
          size: 32,
        }),
        txt('LEGACY CONSUMER (v1)', 310, midY - 34, 26, cCol, 'mono', 'left'),
        txt(
          v1 > 0.3 ? 'INCOMPATIBLE · MISSING FIELD' : 'check version compatibility',
          310,
          midY + 16,
          28,
          v1 > 0.3 ? ROLE.prune : COSMOS.muted,
          'mono',
          'left',
        ).glow(v1 > 0.3 ? 8 : 0, ROLE.prune),
        txt('Cannot assume failing_job exists', 310, midY + 58, 26, COSMOS.muted, 'sans', 'left'),
      );

      // Bottom band: Compiled grammar cache identity (24h compiled rules != prompt KV cache)
      nodes.push(
        line([-840, 240], [840, 240], { stroke: '#25355a', width: 2 }),
        txt(
          ar > 0.35
            ? 'SCHEMA CHANGED -> RECHECK GRAMMAR ID'
            : b2 > 0.35
              ? 'Test payloads & refusals at boundaries'
              : 'Code selects the validator and version',
          -840,
          312,
          30,
          ar > 0.35 ? ROLE.prune : COSMOS.ink,
          ar > 0.35 ? 'mono' : 'serif',
          'left',
        ).glow(ar > 0.35 ? 8 : 0, ROLE.prune),
        txt(
          ar > 0.35 ? '24h grammar cache != prompt KV cache' : '',
          -840,
          368,
          26,
          ROLE.fsm,
          'mono',
          'left',
        ).opacity(ar),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, stageView);
  driftValue(s, c, pulse, 5.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('sg-schema-version-0', () => {
    s.play(b0Hi.to(1, { duration: clampDur(c, c.cue('sg-schema-version-0').start, 0.35) }));
  });
  c.on('sg-code-version', () => {
    s.play(codeTagged.to(1, { duration: clampDur(c, c.cue('sg-code-version').start, 0.4) }));
  });
  c.on('sg-schema-version-1', () => {
    s.play(b1Hi.to(1, { duration: clampDur(c, c.cue('sg-schema-version-1').start, 0.35) }));
  });
  c.on('sg-version-consumer', () => {
    s.play(v1Blocked.to(1, { duration: clampDur(c, c.cue('sg-version-consumer').start, 0.4) }));
  });
  c.on('sg-schema-version-2', () => {
    s.play(b2Hi.to(1, { duration: clampDur(c, c.cue('sg-schema-version-2').start, 0.35) }));
  });
  c.on('sg-version-artifact', () => {
    s.play(
      artifactRecheck.to(1, { duration: clampDur(c, c.cue('sg-version-artifact').start, 0.45) }),
    );
  });
}
