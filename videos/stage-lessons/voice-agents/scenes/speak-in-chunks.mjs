// Scene 10: speak-in-chunks - What can the hotline say while it looks?
// Shared playhead sweeping across 4 lanes (LLM, TTS, Client Playout, Read-Only Lookup)
// with STRICT prediction withholding at 380 ms before revealing "I'll check that." vs factual 955 ms!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  speechChunks,
  toolTrace,
  txt,
} from '../parts.mjs';

export default function speakInChunks(s, c) {
  const phase = s.value(0);
  const playhead = s.value(60); // ms on call clock: 60 -> 380 -> 640 -> 955
  const askOn = s.value(0);
  const ackReveal = s.value(0); // STRICT after speech-ack!
  const toolDone = s.value(0);
  const factPlay = s.value(0);

  const header = cinemaHeader(
    'SPEAKING WHILE LOOKING UP',
    'What can the hotline',
    'say at 380 ms?',
    {
      x: -860,
      y: -445,
      accent: ROLE.audio,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const headMs = playhead.value;
      const ask = askOn.value;
      const ack = ackReveal.value;
      const td = toolDone.value;
      const fp = factPlay.value;
      const nodes = [];

      // Call clock: 0 .. 1250 ms across x = [-580 .. +800]
      const x0 = -580;
      const x1 = 800;
      const mapT = (t) => x0 + (t / 1250) * (x1 - x0);

      const yLlm = -140;
      const yTts = -50;
      const yPlay = 40;
      const yTool = 140;

      nodes.push(
        txt('LLM WORDS', -840, yLlm, 26, ROLE.policy, 'mono', 'left'),
        txt('TTS SYNTH', -840, yTts, 26, ROLE.focus, 'mono', 'left'),
        txt('SPEAKER', -840, yPlay, 26, ROLE.ok, 'mono', 'left'),
        txt('LOOKUP', -840, yTool, 26, ROLE.tool, 'mono', 'left'),
      );

      // Draw each of the 3 speech chunks (ack, neutral continuation, factual reply)
      speechChunks.forEach((ch, idx) => {
        const showChunk = idx === 0 ? 1 : idx === 1 ? 0.2 + ack * 0.8 : 0.15 + td * 0.85;
        const col = idx === 2 ? ROLE.ok : idx === 1 ? ROLE.audio : ROLE.policy;
        const lA = mapT(ch.llm[0]);
        const lB = mapT(ch.llm[1]);
        const tA = mapT(ch.tts[0]);
        const tB = mapT(ch.tts[1]);
        const pA = mapT(ch.play[0]);
        const pB = mapT(ch.play[1]);

        nodes.push(
          rect(Math.max(10, lB - lA), 34, { fill: col, stroke: '#ffffff', width: 1.2, radius: 5 })
            .at((lA + lB) * 0.5, yLlm)
            .opacity(showChunk * 0.85),
          rect(Math.max(10, tB - tA), 34, {
            fill: ROLE.focus,
            stroke: '#ffffff',
            width: 1.2,
            radius: 5,
          })
            .at((tA + tB) * 0.5, yTts)
            .opacity(showChunk * 0.82),
          rect(Math.max(10, pB - pA), 34, {
            fill: idx === 2 ? ROLE.ok : ROLE.audio,
            stroke: '#ffffff',
            width: 1.4,
            radius: 5,
          })
            .at((pA + pB) * 0.5, yPlay)
            .glow(idx === 2 && fp > 0.4 ? 9 : 4, idx === 2 ? ROLE.ok : ROLE.audio)
            .opacity(showChunk * 0.9),
        );
      });

      // Read-only incident lookup bar (60 -> 640 ms)
      const tlA = mapT(toolTrace.started);
      const tlB = mapT(toolTrace.completed);
      nodes.push(
        rect(tlB - tlA, 38, {
          fill: td > 0.5 ? ROLE.ok : ROLE.tool,
          stroke: '#ffffff',
          width: 1.5,
          radius: 6,
        })
          .at((tlA + tlB) * 0.5, yTool)
          .glow(8, td > 0.5 ? ROLE.ok : ROLE.tool)
          .opacity(0.9),
        txt(
          td > 0.5 ? 'LOOKUP DONE: OPEN (640 ms)' : 'LOOKUP RUNNING (60 -> 640 ms)',
          (tlA + tlB) * 0.5,
          yTool,
          26,
          '#070910',
          'mono',
          'center',
        ),
      );

      // Moving playhead vertical beam (stops cleanly above LOOKUP text bar!)
      const xHead = mapT(headMs);
      nodes.push(
        line([xHead, -195], [xHead, 106], { stroke: '#ffffff', width: 3.5 }).glow(8, ROLE.audio),
        txt(`t = ${Math.round(headMs)} ms`, xHead, -225, 26, '#ffffff', 'mono', 'center'),
      );

      // Shared ms ticks
      const axisY = 225;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 3 }));
      for (const t of [0, 380, 640, 955, 1195]) {
        const tx = mapT(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#4d6496', width: 2 }),
          txt(
            `${t}`,
            tx,
            axisY + 42,
            26,
            t === 955 && fp > 0.4 ? ROLE.ok : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Top-right evidence rule
      nodes.push(
        txt('EVIDENCE-GATED SPEECH', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          fp > 0.4 ? 'Factual audio starts at 955 ms' : 'First sound at 380 ms · tool at 640 ms',
          480,
          -378,
          26,
          fp > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom prediction prompt -> strict withholding until speech-ack!
      const botY = 345;
      if (fp > 0.4) {
        nodes.push(
          txt(
            'FACTUAL REPLY STARTS AT 955 ms · TRACK EACH HANDOFF SEPARATELY',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
        );
      } else if (ack > 0.4) {
        nodes.push(
          txt(
            td > 0.4
              ? 'LOOKUP RETURNED OPEN -> START VERIFIED FACTUAL REPLY'
              : 'SPEAK "I’ll check that." NOW (LOOKUP STILL IN FLIGHT)',
            0,
            botY,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(7, ROLE.ok),
        );
      } else if (ask > 0.35) {
        nodes.push(
          txt(
            'At 380 ms: can Alex hear "I’ll check that" or "Incident is open"?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else {
        nodes.push(
          txt(
            'Read-only lookup runs in parallel while the model writes its first phrase',
            0,
            botY,
            26,
            COSMOS.muted,
            'sans',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.audio,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('speech-first', () => {
    s.play(playhead.to(380, { duration: clampDur(c, c.cue('speech-first').start, 0.5) }));
  });
  c.on('speech-choose', () => {
    s.play(askOn.to(1, { duration: clampDur(c, c.cue('speech-choose').start, 0.35) }));
  });
  c.after('speech-ack', () => {
    s.play(ackReveal.to(1, { duration: clampDur(c, c.cue('speech-ack').end, 0.35) }));
  });
  c.on('speech-return', () => {
    const t = c.cue('speech-return').start;
    s.play(playhead.to(640, { duration: clampDur(c, t, 0.45) }));
    s.play(toolDone.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('speech-play-fact', () => {
    const t = c.cue('speech-play-fact').start;
    s.play(playhead.to(955, { duration: clampDur(c, t, 0.5) }));
    s.play(factPlay.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
