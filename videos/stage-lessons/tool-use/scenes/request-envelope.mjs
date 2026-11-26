// Scene 3: request-envelope - Make the proposal explicit
// Streaming JSON fragment optical collector with 128-byte cap meter, circuit breaker,
// and endpoint-adapter funnel converting provider envelopes to an internal runtime record.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  circuitBreaker,
  clampDur,
  driftValue,
  energyRail,
  envelopeSnapshot,
  gateNode,
  glowMeter,
  guardedDynamic,
  hexGate,
  quadArcPts,
  txt,
} from '../parts.mjs';

export default function requestEnvelope(s, c) {
  const pulse = s.value(0);
  const fieldsOn = s.value(0);
  const streamProg = s.value(0);
  const adapterOn = s.value(0);

  const header = cinemaHeader(
    'BOUNDED PROPOSAL ENVELOPE',
    'Make the proposal',
    'explicit before run',
    {
      accent: ROLE.proposal,
      size: 48,
    },
  );

  const stageAura = aura(180, 40, 620, '#60a5fa1f', '#5ce1e618');

  const completeSnap = envelopeSnapshot(0, 1);

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = pulse.value;
      const fd = fieldsOn.value;
      const sp = streamProg.value;
      const ad = adapterOn.value;
      const nodes = [];

      // Left column: 3 explicit proposal fields along an optical rail
      nodes.push(
        energyRail(-855, -210, 115, ROLE.proposal),
        txt('EXPLICIT PROPOSAL FIELDS', -825, -195, 26, ROLE.proposal, 'mono', 'left'),
        txt('tool_name : "lookup_book"', -825, -135, 30, COSMOS.ink, 'mono', 'left'),
        txt('book_id   : "B7"', -825, -75, 30, ROLE.runtime, 'mono', 'left'),
        txt('call_id   : "read-7"', -825, -15, 30, ROLE.key, 'mono', 'left').glow(
          fd > 0.3 ? 6 : 0,
          ROLE.key,
        ),
        txt(
          'Inspectable record · never scrape prose delimiters',
          -825,
          55,
          26,
          COSMOS.muted,
          'sans',
          'left',
        ),
      );

      // Center-right: Streaming JSON fragment collector & 128-byte cap meter
      const fragCount = sp < 0.05 ? 3 : sp < 0.35 ? 1 : sp < 0.68 ? 2 : 3;
      const chunks = ['{"book_', 'id":"B7"', '}'];
      const wire = chunks.slice(0, fragCount).join('');
      const complete = fragCount === 3;
      const byteCount = wire.length;

      nodes.push(
        txt('STREAMING COLLECTOR & SIZE CAP', 40, -340, 26, ROLE.runtime, 'mono', 'left'),
        // Three fragment pills along an arrival beam
        gateNode(160, -225, 'FRAG 1', ROLE.proposal, {
          radius: 44,
          sub: '{"book_',
          glow: fragCount >= 1 ? 10 : 3,
        }),
        gateNode(430, -225, 'FRAG 2', fragCount >= 2 ? ROLE.proposal : COSMOS.dim, {
          radius: 44,
          sub: 'id":"B7"',
          glow: fragCount >= 2 ? 10 : 2,
          opacity: fragCount >= 2 ? 1 : 0.45,
        }),
        gateNode(700, -225, 'FRAG 3', complete ? ROLE.ok : COSMOS.dim, {
          radius: 44,
          sub: '}',
          glow: complete ? 12 : 2,
          opacity: complete ? 1 : 0.45,
        }),
        beamWithPhotons(
          [
            [212, -225],
            [378, -225],
          ],
          ROLE.proposal,
          p * 1.1,
          { alpha: fragCount >= 2 ? 0.95 : 0.3, width: 3 },
        ),
        beamWithPhotons(
          [
            [482, -225],
            [648, -225],
          ],
          complete ? ROLE.ok : ROLE.caution,
          p * 1.1 + 0.4,
          { alpha: complete ? 0.95 : 0.3, width: 3 },
        ),
      );

      // Live assembled buffer + circuit breaker
      nodes.push(
        txt(`BUFFER: ${wire}`, 40, -75, 32, complete ? ROLE.ok : ROLE.caution, 'mono', 'left').glow(
          6,
          complete ? ROLE.ok : ROLE.caution,
        ),
        txt(
          `${byteCount} / 128 B`,
          40,
          -18,
          26,
          complete ? ROLE.runtime : ROLE.caution,
          'mono',
          'left',
        ),
        txt(
          'HOLD UNTIL COMPLETE JSON',
          240,
          -18,
          26,
          complete ? ROLE.ok : ROLE.caution,
          'mono',
          'left',
        ),
        glowMeter(40, 32, 540, 26, byteCount / 128, {
          fill: complete ? ROLE.ok : ROLE.caution,
        }),
        circuitBreaker(715, 32, 115, complete ? 0 : 1, ROLE.ok),
        txt(
          complete ? 'DISPATCH READY' : 'GATE OPEN',
          715,
          92,
          26,
          complete ? ROLE.ok : ROLE.fail,
          'mono',
          'center',
        ),
      );

      // Bottom band: Endpoint Adapter Funnel (OpenAI / Claude / Gemini -> Internal Record)
      const fY = 290;
      const adOp = 0.45 + ad * 0.55;
      nodes.push(
        line([-855, 170], [840, 170], { stroke: '#233357', width: 2 }),
        txt(
          'PROVIDER-SPECIFIC ENVELOPES  ->  INTERNAL RUNTIME RECORD',
          -855,
          212,
          26,
          ad > 0.3 ? ROLE.runtime : COSMOS.muted,
          'mono',
          'left',
        ).opacity(adOp),
        txt('Responses API', -730, fY, 26, ROLE.proposal, 'mono', 'center').opacity(adOp),
        txt('Chat Completions', -730, fY + 58, 26, ROLE.proposal, 'mono', 'center').opacity(adOp),
        txt('Claude / Gemini', -730, fY + 116, 26, ROLE.proposal, 'mono', 'center').opacity(adOp),
        beamWithPhotons(quadArcPts([-560, fY], [-80, fY + 58], -20), ROLE.proposal, p * 1.1, {
          alpha: adOp,
          width: 3,
        }),
        beamWithPhotons(
          [
            [-560, fY + 58],
            [-80, fY + 58],
          ],
          ROLE.runtime,
          p * 1.1 + 0.33,
          { alpha: adOp, width: 3 },
        ),
        beamWithPhotons(
          quadArcPts([-560, fY + 116], [-80, fY + 58], 20),
          ROLE.mcp,
          p * 1.1 + 0.66,
          {
            alpha: adOp,
            width: 3,
          },
        ),
        hexGate(10, fY + 58, 68, ROLE.runtime, { label: 'ADAPT', opacity: adOp }),
        beamWithPhotons(
          [
            [92, fY + 58],
            [270, fY + 58],
          ],
          ROLE.ok,
          p * 1.2,
          { alpha: adOp, width: 3.6 },
        ),
        energyRail(290, fY - 10, fY + 125, ROLE.ok, { opacity: adOp }),
        txt('RUNTIME RECORD', 320, fY + 10, 26, ROLE.ok, 'mono', 'left').opacity(adOp),
        txt(
          `validated(${completeSnap.bytes} B) · refusal / malformed handled`,
          320,
          fY + 62,
          26,
          COSMOS.ink,
          'sans',
          'left',
        ).opacity(adOp),
        txt(
          'No fragile <tool_call> regex scraping',
          320,
          fY + 110,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(adOp),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  driftValue(s, c, pulse, 4.8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('request-envelope-beat-1-focus-1', () => {
    s.play(
      fieldsOn.to(1, {
        duration: clampDur(c, c.cue('request-envelope-beat-1-focus-1').start, 0.4),
      }),
    );
  });
  c.on('request-envelope-beat-2-focus-1', () => {
    const t = c.cue('request-envelope-beat-2-focus-1').start;
    s.play(streamProg.to(1, { duration: clampDur(c, t, 3.2) }));
  });
  c.on('request-envelope-beat-3-focus-1', () => {
    s.play(
      adapterOn.to(1, {
        duration: clampDur(c, c.cue('request-envelope-beat-3-focus-1').start, 0.45),
      }),
    );
  });
}
