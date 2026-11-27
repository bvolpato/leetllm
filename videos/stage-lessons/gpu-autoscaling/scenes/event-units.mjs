// Scene 03: event-units - Two timestamps for four tokens
// Bundled SSE event oscilloscope: Event 1 (300ms, 1 tok) -> Event 2 (340ms, 3 bundled toks).
// Strict prediction withholding: beat 0 asks how many gaps were timed; reveals strictly AFTER event-gap & bundle-mean.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  DATA,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  clampDur,
  glowDot,
  glowTex,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function eventUnits(s, c) {
  const step = s.value(0); // 1=second-packet (prediction!), 2=event-gap(AFTER), 3=bundle-mean(AFTER), 4=collector beat 2

  const header = cinemaHeader(
    'INSTRUMENTATION & SSE BUNDLING',
    'Two timestamps',
    'for four tokens',
    {
      x: -860,
      y: -420,
      accent: ROLE.focus,
      size: 52,
    },
  );

  const bgAura = aura(200, 10, 620, '#ffd16620', '#5ce1e618');

  const bundleEq = glowTex(String.raw`\frac{40\;\text{ms}}{4 - 1} = 13.3\;\text{ms/tok}`, {
    x: 470,
    y: -315,
    size: 40,
    color: ROLE.active,
    glow: 7,
  });

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const yPacket = -20;
      const nodes = [];

      // Event 1 capsule @ 300ms (1 token)
      nodes.push(
        txt('EVENT 1  ·  300 ms', -520, yPacket - 110, 28, ROLE.active, 'mono'),
        rect(220, 108, { fill: '#0f2238', stroke: ROLE.active, width: 2.8, radius: 18 })
          .at(-520, yPacket)
          .glow(8, ROLE.active),
        glowDot(-520, yPacket, { radius: 16, color: ROLE.active, glow: 14 }),
        txt('1 token', -520, yPacket + 92, 28, COSMOS.ink, 'mono'),
      );

      // Event 2 capsule @ 340ms (3 bundled tokens)
      if (st >= 0.4) {
        const e2A = Math.min(1, st * 1.6);
        nodes.push(
          txt('EVENT 2  ·  340 ms', 290, yPacket - 110, 28, ROLE.decode, 'mono').opacity(e2A),
          rect(420, 108, { fill: '#1b1433', stroke: ROLE.decode, width: 2.8, radius: 18 })
            .at(290, yPacket)
            .glow(8, ROLE.decode)
            .opacity(e2A),
          glowDot(180, yPacket, { radius: 15, color: ROLE.decode, glow: 12, opacity: e2A }),
          glowDot(290, yPacket, { radius: 15, color: ROLE.decode, glow: 12, opacity: e2A }),
          glowDot(400, yPacket, { radius: 15, color: ROLE.decode, glow: 12, opacity: e2A }),
          txt(
            '3 bundled tokens (internal gaps unknown)',
            290,
            yPacket + 92,
            26,
            ROLE.decode,
            'mono',
          ).opacity(e2A),
        );
      }

      // Prediction prompt during beat 0 hold
      if (st >= 0.4 && st < 1.5) {
        nodes.push(
          txt(
            'PREDICT: How many gaps did the recorder time?',
            -860,
            200,
            32,
            ROLE.predict,
            'sans',
            'left',
          )
            .glow(8, ROLE.predict)
            .opacity(1),
          txt(
            '4 tokens on screen  ·  2 stamped events',
            -860,
            264,
            28,
            COSMOS.muted,
            'mono',
            'left',
          ),
        );
      }

      // Reveal 1: Single 40 ms gap between events (STRICTLY AFTER event-gap)
      if (st >= 1.5) {
        nodes.push(
          beamWithPhotons(
            [
              [-395, yPacket],
              [65, yPacket],
            ],
            ROLE.focus,
            0,
            { width: 4.5, glow: 11, photonCount: 2 },
          ),
          txt(
            `1 MEASURED GAP: ${DATA.bundleGapMs} ms`,
            -165,
            yPacket - 42,
            28,
            ROLE.focus,
            'mono',
          ).glow(8, ROLE.focus),
        );
      }

      // Reveal 2: Mean TPOT = 13.3 ms (STRICTLY AFTER bundle-mean)
      if (st >= 2.5 && st < 3.5) {
        nodes.push(
          txt(
            'Request TPOT = 40 / (4 - 1) = 13.3 ms/tok',
            -860,
            210,
            32,
            ROLE.active,
            'mono',
            'left',
          ).glow(7, ROLE.active),
          txt(
            'Draft verification or network buffering creates bundles',
            -860,
            274,
            28,
            COSMOS.muted,
            'sans',
            'left',
          ),
        );
      }

      // Beat 2: Collector semantics (vLLM Prometheus vs bench serve + 0.85 gauge check)
      if (st >= 3.5) {
        nodes.push(
          txt('vLLM COLLECTOR RULES', -860, 170, 26, ROLE.focus, 'mono', 'left'),
          txt(
            'Inter-event histogram: 1 entry per output event gap',
            -860,
            224,
            26,
            COSMOS.ink,
            'sans',
            'left',
          ),
          txt(
            'Pacing TPOT: Prometheus logs 0s for <=1 tok; bench excludes them',
            -860,
            278,
            26,
            ROLE.active,
            'sans',
            'left',
          ),
          txt(
            'Cache gauge unit:  0.85  =  85% usage (fraction 0..1)',
            -860,
            338,
            28,
            ROLE.warm,
            'mono',
            'left',
          ).glow(6, ROLE.warm),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  // Beat 0: setup + question (NO reveal!)
  tweenOn(s, c, 'second-packet', step, 1, 0.35);

  // Beat 1: strict AFTER reveals
  tweenOn(s, c, 'event-gap', step, 2, 0.3, { after: true });
  c.show('bundle-mean', bundleEq, { after: true });
  tweenOn(s, c, 'bundle-mean', step, 3, 0.3, { after: true });

  // Beat 2: collector contract
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(step.to(4, { duration: clampDur(c, t, 0.35) }));
  });
}
