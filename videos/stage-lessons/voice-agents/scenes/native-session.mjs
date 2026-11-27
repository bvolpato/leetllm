// Scene 17: native-session - Account for received audio and confirmed playback separately
// Event replay: 160 ms received & acked + 220 ms received = 380 ms received vs 160 ms confirmed
// (220 ms unconfirmed gap), separate transcript & tool-proposal lanes, multipart Gemini Live events.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowMeter,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function nativeSession(s, c) {
  const countersOn = s.value(0);
  const diffOn = s.value(0);
  const partsOn = s.value(0);
  const multiOn = s.value(0);

  const header = cinemaHeader(
    'NATIVE SESSION ACCOUNTING',
    'Received audio vs',
    'confirmed playback',
    {
      x: -860,
      y: -445,
      accent: ROLE.native,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#a78bfa1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const cnt = countersOn.value;
      const dif = diffOn.value;
      const prt = partsOn.value;
      const mlt = multiOn.value;
      const nodes = [];

      // Left-center: Dual Audio Counters (380 ms received vs 160 ms confirmed -> 220 ms unconfirmed)
      const lx = -820;
      const wBar = 740;
      nodes.push(
        txt('RECEIVED AUDIO: 160 + 220 = 380 ms', lx, -175, 26, ROLE.audio, 'mono', 'left'),
        glowMeter(lx, -125, wBar, 30, 1.0, { fill: ROLE.audio, glow: 8 }),
        txt('CONFIRMED PLAYOUT: 160 ms', lx, -50, 26, ROLE.ok, 'mono', 'left'),
        glowMeter(lx, 0, wBar, 30, 160 / 380, { fill: ROLE.ok, glow: 8 }),
        txt(
          dif > 0.4
            ? 'UNCONFIRMED IN-FLIGHT GAP: 380 - 160 = 220 ms'
            : 'TRACK BOTH COUNTERS SEPARATELY',
          lx,
          70,
          26,
          dif > 0.4 ? ROLE.warn : COSMOS.muted,
          'mono',
          'left',
        ).glow(dif > 0.4 ? 7 : 0, ROLE.warn),
      );

      // Right column: Separate Side-Channels (Transcript vs Tool Proposal vs Multipart Parsing)
      const rx = 120;
      nodes.push(
        line([65, -210], [65, 195], { stroke: '#2c3d66', width: 2.5 }),
        txt('SEPARATE SESSION RECORDS', rx, -175, 26, ROLE.focus, 'mono', 'left'),
        txt(
          'Transcript: "Incident is still open"',
          rx,
          -110,
          26,
          prt > 0.4 ? ROLE.audio : COSMOS.muted,
          'mono',
          'left',
        ),
        txt('  (NOT confirmed shared speech!)', rx, -64, 26, ROLE.warn, 'mono', 'left'),
        txt(
          'Tool event: proposes name ONLY',
          rx,
          8,
          26,
          prt > 0.4 ? ROLE.tool : COSMOS.muted,
          'mono',
          'left',
        ),
        txt('  (authorizes ZERO actions!)', rx, 54, 26, ROLE.fail, 'mono', 'left'),
        txt(
          'Multipart event: process EVERY part',
          rx,
          126,
          26,
          mlt > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'left',
        ),
        txt('  (never stop at if-else audio!)', rx, 172, 26, COSMOS.muted, 'mono', 'left'),
      );

      // Top-right model scheduling note
      nodes.push(
        txt('PROVIDER CAPABILITIES', 480, -425, 26, ROLE.native, 'mono', 'center'),
        txt(
          mlt > 0.4 ? '3.8 Live: nonblocking tool calls' : 'Map session, response, item & part IDs',
          480,
          -378,
          26,
          COSMOS.ink,
          'mono',
          'center',
        ),
        txt(
          mlt > 0.4 ? '3.1 Flash Live: waits for tool reply' : 'Handle duplicates & cancellation',
          480,
          -334,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom summary
      nodes.push(
        line([-840, 255], [840, 255], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          cnt > 0.4
            ? 'Client playback ack is an application contract; bind it to provider response & item IDs'
            : 'Keep transcript, received audio, confirmed playout & tool proposals distinct',
          0,
          325,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-native-session-0-2', () => {
    s.play(countersOn.to(1, { duration: clampDur(c, c.cue('va-native-session-0-2').start, 0.35) }));
  });
  c.on('va-native-session-0-3', () => {
    s.play(diffOn.to(1, { duration: clampDur(c, c.cue('va-native-session-0-3').start, 0.35) }));
  });
  c.on('va-native-session-1-0', () => {
    s.play(partsOn.to(1, { duration: clampDur(c, c.cue('va-native-session-1-0').start, 0.35) }));
  });
  c.on('va-native-session-2-1', () => {
    s.play(multiOn.to(1, { duration: clampDur(c, c.cue('va-native-session-2-1').start, 0.4) }));
  });
}
