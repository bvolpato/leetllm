// Scene 18: provider-interruption - Match the provider's actual interruption contract
// Contrasts Gemini Live (retains sent-to-client buffer) vs OpenAI Realtime (WebRTC/SIP auto
// vs WebSocket explicit conversation.item.truncate with item_id, content_index:0, audio_end_ms).
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function providerInterruption(s, c) {
  const phase = s.value(0);
  const geminiOn = s.value(0);
  const openaiOn = s.value(0);
  const errOn = s.value(0);
  const credOn = s.value(0);

  const header = cinemaHeader(
    'PROVIDER INTERRUPTION CONTRACTS',
    'Match the provider’s',
    'actual contract',
    {
      x: -860,
      y: -445,
      accent: ROLE.cut,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f43f5e16', '#a78bfa1a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const gm = geminiOn.value;
      const oa = openaiOn.value;
      const er = errOn.value;
      const cr = credOn.value;
      const nodes = [];

      // Left column: Gemini Live Preview contract
      const lx = -840;
      const gmAlpha = 0.55 + gm * 0.45;
      nodes.push(
        txt('GEMINI LIVE (PREVIEW)', lx, -185, 28, ROLE.audio, 'mono', 'left').opacity(gmAlpha),
        txt('Retains audio SENT to client', lx, -125, 26, COSMOS.ink, 'mono', 'left').opacity(
          gmAlpha,
        ),
        txt('  (includes buffered, unplayed!)', lx, -78, 26, ROLE.warn, 'mono', 'left').opacity(
          gmAlpha,
        ),
        txt('Remote history != app ack prefix', lx, -18, 26, ROLE.cut, 'mono', 'left').opacity(
          gmAlpha,
        ),
        txt('Use documented sync or rebuild', lx, 38, 26, ROLE.ok, 'mono', 'left').opacity(gmAlpha),
      );

      // Right column: OpenAI Realtime contract (WebRTC/SIP auto vs WebSocket truncate)
      const rx = 80;
      const oaAlpha = 0.35 + oa * 0.65;
      nodes.push(
        line([20, -210], [20, 175], { stroke: '#2c3d66', width: 2.5 }),
        txt('OPENAI REALTIME', rx, -185, 28, ROLE.native, 'mono', 'left').opacity(oaAlpha),
        txt('WebRTC / SIP: server auto-truncates', rx, -125, 26, ROLE.ok, 'mono', 'left').opacity(
          oaAlpha,
        ),
        txt('WebSocket: client stops + sends:', rx, -68, 26, COSMOS.ink, 'mono', 'left').opacity(
          oaAlpha,
        ),
        txt('  { item_id, content_index: 0,', rx, -18, 26, ROLE.focus, 'mono', 'left').opacity(
          oaAlpha,
        ),
        txt('    audio_end_ms: playedMs }', rx, 28, 26, ROLE.focus, 'mono', 'left').opacity(
          oaAlpha,
        ),
        txt(
          er > 0.4
            ? 'end > duration -> ERROR! else item.truncated'
            : 'No word-aligned text prefix returned',
          rx,
          92,
          26,
          er > 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'left',
        ).opacity(oaAlpha),
        txt(
          'Input transcript is async guidance only',
          rx,
          140,
          26,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(oaAlpha),
      );

      // Top-right credentials & policy guard
      nodes.push(
        txt('TRUST BOUNDARY', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          cr > 0.4
            ? 'Keep long-lived keys on server'
            : 'Never assume provider history = heard text',
          480,
          -378,
          26,
          cr > 0.4 ? ROLE.ok : COSMOS.ink,
          'mono',
          'center',
        ),
        txt(
          cr > 0.4 ? 'or use short-lived client tokens' : 'Inspect transport & sync semantics',
          480,
          -334,
          26,
          COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom synthesis rail
      nodes.push(
        line([-840, 240], [840, 240], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          cr > 0.4
            ? 'Application STILL owns tool policy, echo tests, transport & inspectable recovery'
            : 'Match each provider’s real truncation and session-history guarantees',
          0,
          312,
          26,
          cr > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.cut,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('va-provider-interruption-0-1', () => {
    s.play(
      geminiOn.to(1, { duration: clampDur(c, c.cue('va-provider-interruption-0-1').start, 0.35) }),
    );
  });
  c.on('va-provider-interruption-1-0', () => {
    s.play(
      openaiOn.to(1, { duration: clampDur(c, c.cue('va-provider-interruption-1-0').start, 0.4) }),
    );
  });
  c.on('va-provider-interruption-2-1', () => {
    s.play(
      errOn.to(1, { duration: clampDur(c, c.cue('va-provider-interruption-2-1').start, 0.35) }),
    );
  });
  c.on('va-provider-interruption-3-0', () => {
    s.play(
      credOn.to(1, { duration: clampDur(c, c.cue('va-provider-interruption-3-0').start, 0.4) }),
    );
  });
}
