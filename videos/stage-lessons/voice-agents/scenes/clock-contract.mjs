// Scene 02: clock-contract - How long did Alex wait?
// Dual clocks (speech-end 380 ms vs commit 320 ms), sliding endpoint wait 60 -> 300 ms
// across the 500 ms caller target -> prediction pause before revealing 620 ms miss!
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  commitToAudio,
  driftValue,
  firstAudioLatency,
  glowDot,
  guardedDynamic,
  trace,
  txt,
} from '../parts.mjs';

export default function clockContract(s, c) {
  const phase = s.value(0);
  const commitOn = s.value(0);
  const playOn = s.value(0);
  const measureOn = s.value(0);
  const shiftOn = s.value(0); // 0 = 60ms commit, 1 = 300ms commit
  const lateReveal = s.value(0); // STRICT after clock-late!
  const ackOn = s.value(0);
  const muteOn = s.value(0);

  const header = cinemaHeader('LATENCY CLOCK CONTRACT', 'How long did', 'Alex wait?', {
    x: -860,
    y: -445,
    accent: ROLE.audio,
    size: 48,
  });

  const bgAura = aura(60, 20, 660, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const cm = commitOn.value;
      const pl = playOn.value;
      const ms = measureOn.value;
      const sh = shiftOn.value;
      const lt = lateReveal.value;
      const ak = ackOn.value;
      const mt = muteOn.value;
      const nodes = [];

      // Millisecond timeline ruler: 0 .. 700 ms across x = [-740 .. +740]
      const x0 = -740;
      const x1 = 740;
      const mapT = (t) => x0 + (t / 700) * (x1 - x0);
      const rY = 20;

      const commitMs = trace.commit + sh * (300 - trace.commit); // 60 -> 300
      const audioMs = commitMs + commitToAudio; // 380 -> 620
      const xSpeech = mapT(0);
      const xCommit = mapT(commitMs);
      const xAudio = mapT(audioMs);
      const xTarget = mapT(500);

      // Axis + ticks (axis line cleanly below the bars at rY + 30 so zero strokes cross bar text!)
      const axisY = rY + 30;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 4 }));
      for (const t of [0, 100, 200, 300, 400, 500, 600, 700]) {
        const tx = mapT(t);
        nodes.push(
          line([tx, axisY - 8], [tx, axisY + 8], { stroke: '#4d6496', width: 2 }),
          txt(`${t}`, tx, axisY + 36, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      // 500 ms P95 caller target line (stops above bars & labels!)
      nodes.push(
        line([xTarget, rY - 145], [xTarget, rY - 32], {
          stroke: ROLE.focus,
          width: 4,
          dash: [10, 8],
        }).glow(9, ROLE.focus),
        txt('500 ms P95 TARGET', xTarget, rY - 175, 26, ROLE.focus, 'mono', 'center'),
      );

      // Endpoint wait span (0 -> commitMs)
      const waitW = Math.max(8, xCommit - xSpeech);
      nodes.push(
        rect(waitW, 44, { fill: ROLE.net, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at(xSpeech + waitW * 0.5, rY)
          .glow(6, ROLE.net)
          .opacity(0.4 + cm * 0.5),
        txt(
          `WAIT ${Math.round(commitMs)} ms`,
          xSpeech + waitW * 0.5,
          rY - 52,
          26,
          ROLE.net,
          'mono',
          'center',
        ).opacity(0.5 + cm * 0.5),
      );

      // Response path span (commitMs -> audioMs): strictly withhold final shifted bar width until lateReveal if sh > 0.5!
      const showFinalPos = sh < 0.35 || lt > 0.35;
      const respCol = lt > 0.35 && sh > 0.5 ? ROLE.fail : ROLE.ok;
      if (pl > 0.05) {
        if (showFinalPos) {
          const respW = Math.max(8, xAudio - xCommit);
          nodes.push(
            rect(respW, 44, { fill: respCol, stroke: '#ffffff', width: 1.5, radius: 6 })
              .at(xCommit + respW * 0.5, rY)
              .glow(8, respCol)
              .opacity(0.9 * pl),
            txt(
              `RESPONSE ${commitToAudio} ms`,
              xCommit + respW * 0.5,
              rY,
              26,
              '#070910',
              'mono',
              'center',
            ).opacity(pl),
          );
        } else {
          // Prediction pause: show fixed 320ms response span starting at 300ms as dashed "?"!
          const respW = Math.max(8, xAudio - xCommit);
          nodes.push(
            rect(respW, 44, { fill: '#121d36', stroke: ROLE.focus, width: 3, radius: 6 })
              .at(xCommit + respW * 0.5, rY)
              .opacity(0.9),
            txt('300 + 320 = ?', xCommit + respW * 0.5, rY, 26, ROLE.focus, 'mono', 'center'),
          );
        }
      }

      // Clock 1 bracket (speech end -> first audio) below axis
      if (ms > 0.1) {
        const brY = rY + 110;
        const endX = showFinalPos ? xAudio : xCommit + (xAudio - xCommit) * 0.5;
        const label = showFinalPos
          ? `SPEECH END -> FIRST AUDIO: ${Math.round(audioMs)} ms`
          : 'SPEECH END -> FIRST AUDIO: ? ms';
        const col = lt > 0.35 && sh > 0.5 ? ROLE.fail : ROLE.audio;
        nodes.push(
          line([xSpeech, brY], [endX, brY], { stroke: col, width: 4 }).glow(8, col).opacity(ms),
          txt(label, (xSpeech + endX) * 0.5, brY + 42, 28, col, 'mono', 'center').opacity(ms),
        );
      }

      // Top-right target scorecard (fills top-right cleanly from t=0)
      const rx = 470;
      nodes.push(
        txt('PROPOSED P95 TARGETS', rx, -430, 26, ROLE.focus, 'mono', 'center'),
        txt('speech end -> first sound: 500 ms', rx, -384, 26, COSMOS.ink, 'mono', 'center'),
        txt('commit -> first sound: 400 ms', rx, -340, 26, ROLE.audio, 'mono', 'center'),
        txt(
          mt > 0.5 ? 'barge-in mute target: 100 ms' : 'stop clock ONLY at first speaker sound',
          rx,
          -296,
          26,
          mt > 0.5 ? ROLE.cut : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom synthesis / prediction prompt (no 0.1s flash gap between lt=0.05 and lt=0.35!)
      const botY = 305;
      if (sh > 0.4 && lt < 0.35) {
        nodes.push(
          txt(
            '300 ms silence wait + 320 ms response path: does it meet 500 ms?',
            0,
            botY,
            32,
            ROLE.focus,
            'serif',
            'center',
          ).glow(6, ROLE.focus),
        );
      } else if (ak > 0.35) {
        nodes.push(
          txt(
            mt > 0.35
              ? 'TIME FIRST SOUND, USEFUL ANSWER & 100 ms MUTE SEPARATELY'
              : '"I’ll check that" starts sound, NOT the factual status!',
            0,
            botY,
            28,
            mt > 0.35 ? ROLE.cut : ROLE.ok,
            'mono',
            'center',
          ).glow(7, mt > 0.35 ? ROLE.cut : ROLE.ok),
        );
      } else if (lt > 0.35) {
        nodes.push(
          txt(
            '620 ms MISSES 500 ms CALLER TARGET (EVEN WHILE 320 ms < 400 ms!)',
            0,
            botY,
            28,
            ROLE.fail,
            'mono',
            'center',
          ).glow(8, ROLE.fail),
        );
      } else {
        nodes.push(
          txt(
            `First sound at ${firstAudioLatency} ms  |  Response path = ${commitToAudio} ms`,
            0,
            botY,
            28,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      nodes.push(
        glowDot(-780 + ((p * 120) % 240), 435, {
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
  driftValue(s, c, phase, 4.6);

  c.on('clock-speech', () => {
    s.play(phase.to(0.25, { duration: clampDur(c, c.cue('clock-speech').start, 0.25) }));
  });
  c.on('clock-commit', () => {
    s.play(commitOn.to(1, { duration: clampDur(c, c.cue('clock-commit').start, 0.35) }));
  });
  c.on('clock-play', () => {
    s.play(playOn.to(1, { duration: clampDur(c, c.cue('clock-play').start, 0.4) }));
  });
  c.on('clock-measure', () => {
    s.play(measureOn.to(1, { duration: clampDur(c, c.cue('clock-measure').start, 0.35) }));
  });
  c.on('clock-subtract', () => {
    s.play(measureOn.to(1, { duration: 0.12 }));
  });
  c.on('clock-shift', () => {
    s.play(shiftOn.to(1, { duration: clampDur(c, c.cue('clock-shift').start, 0.5) }));
  });
  c.on('clock-ask', () => {
    s.play(shiftOn.to(1, { duration: 0.12 }));
  });
  c.after('clock-late', () => {
    s.play(lateReveal.to(1, { duration: clampDur(c, c.cue('clock-late').end, 0.4) }));
  });
  c.on('clock-ack', () => {
    s.play(ackOn.to(1, { duration: clampDur(c, c.cue('clock-ack').start, 0.35) }));
  });
  c.on('clock-mute', () => {
    s.play(muteOn.to(1, { duration: clampDur(c, c.cue('clock-mute').start, 0.35) }));
  });
}
