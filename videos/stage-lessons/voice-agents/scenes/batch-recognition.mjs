// Scene 08: batch-recognition - Measure the recognizer after the endpoint
// 1200ms utterance + 300ms endpoint wait + 450ms batch STT = 1950ms (750ms post-speech delay)
// contrasted with streaming recognition overlapping speech.
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
  txt,
} from '../parts.mjs';

export default function batchRecognition(s, c) {
  const phase = s.value(0);
  const batchOn = s.value(0);
  const postOn = s.value(0);
  const downOn = s.value(0);
  const streamOn = s.value(0);

  const header = cinemaHeader(
    'BATCH VS STREAMING STT',
    'Measure the recognizer',
    'after the endpoint',
    {
      x: -860,
      y: -445,
      accent: ROLE.warn,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#f59e0b1a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const bt = batchOn.value;
      const ps = postOn.value;
      const dn = downOn.value;
      const st = streamOn.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 2200 ms across x in [-780 .. +780]
      const x0 = -780;
      const x1 = 780;
      const mapT = (t) => x0 + (t / 2200) * (x1 - x0);
      const yBatch = -80;
      const yStream = 125;

      // Batch STT row
      const xSpEnd = mapT(1200);
      const xEndPt = mapT(1500);
      const xTrans = mapT(1950);

      nodes.push(
        txt(
          'BATCH RECOGNITION (STARTS AFTER ENDPOINT)',
          x0,
          yBatch - 76,
          26,
          ROLE.warn,
          'mono',
          'left',
        ),
        rect(xSpEnd - x0, 46, { fill: ROLE.audio, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xSpEnd) * 0.5, yBatch)
          .opacity(0.85),
        txt('SPEECH 1,200 ms', (x0 + xSpEnd) * 0.5, yBatch, 26, '#070910', 'mono', 'center'),
        rect(xEndPt - xSpEnd, 46, { fill: ROLE.net, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((xSpEnd + xEndPt) * 0.5, yBatch)
          .opacity(0.5 + bt * 0.4),
        txt('300', (xSpEnd + xEndPt) * 0.5, yBatch, 26, '#070910', 'mono', 'center'),
        rect(xTrans - xEndPt, 46, { fill: ROLE.warn, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((xEndPt + xTrans) * 0.5, yBatch)
          .glow(8, ROLE.warn)
          .opacity(0.45 + bt * 0.5),
        txt('STT 450 ms', (xEndPt + xTrans) * 0.5, yBatch, 26, '#070910', 'mono', 'center'),
      );

      // Post-speech delay bracket (750 ms = 300 + 450)
      if (ps > 0.1) {
        const bY = yBatch + 58;
        nodes.push(
          line([xSpEnd, bY], [xTrans, bY], { stroke: ROLE.fail, width: 4 })
            .glow(8, ROLE.fail)
            .opacity(ps),
          txt(
            '750 ms POST-SPEECH DELAY (t = 1,950 ms)',
            (xSpEnd + xTrans) * 0.5,
            bY + 38,
            26,
            ROLE.fail,
            'mono',
            'center',
          ).opacity(ps),
        );
      }

      // Downstream tail after 1950 ms
      if (dn > 0.1) {
        nodes.push(
          rect(x1 - xTrans, 46, { fill: ROLE.policy, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at((xTrans + x1) * 0.5, yBatch)
            .opacity(0.85 * dn),
          txt(
            'LLM+TTS',
            (xTrans + x1) * 0.5,
            yBatch - 48,
            26,
            ROLE.policy,
            'mono',
            'center',
          ).opacity(dn),
        );
      }

      // Streaming STT row for comparison
      const xStDone = mapT(1300); // finishes 100ms after speech end!
      const stAlpha = 0.4 + st * 0.6;
      nodes.push(
        txt(
          'STREAMING RECOGNITION (OVERLAPS SPEECH)',
          x0,
          yStream - 56,
          26,
          ROLE.ok,
          'mono',
          'left',
        ).opacity(stAlpha),
        rect(xStDone - x0, 42, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at((x0 + xStDone) * 0.5, yStream)
          .glow(8, ROLE.ok)
          .opacity(stAlpha * 0.85),
        txt(
          'RECOGNIZES DURING SPEECH (+100 ms TAIL)',
          (x0 + xStDone) * 0.5,
          yStream,
          26,
          '#070910',
          'mono',
          'center',
        ).opacity(stAlpha),
      );

      // Shared ms ticks along bottom
      const tickY = 225;
      nodes.push(line([x0, tickY], [x1, tickY], { stroke: '#344770', width: 3 }));
      for (const t of [0, 600, 1200, 1500, 1950]) {
        const tx = mapT(t);
        nodes.push(
          line([tx, tickY - 10], [tx, tickY + 10], { stroke: '#4d6496', width: 2 }),
          txt(`${t} ms`, tx, tickY + 42, 26, COSMOS.dim, 'mono', 'center'),
        );
      }

      // Top-right rule summary
      nodes.push(
        txt('BATCH TRACE TOTALS', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt('1200 + 300 + 450 = 1,950 ms', 480, -378, 26, COSMOS.ink, 'mono', 'center'),
        txt('LLM, TTS & transport still follow', 480, -334, 26, COSMOS.muted, 'mono', 'center'),
      );

      nodes.push(
        txt(
          st > 0.5
            ? 'Streaming pays work during speech, adding revision & commit-boundary logic'
            : 'Batch STT fits recordings or prototypes whose budget allows 750+ ms delay',
          0,
          355,
          26,
          st > 0.5 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.warn,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('va-batch-recognition-0-1', () => {
    s.play(batchOn.to(1, { duration: clampDur(c, c.cue('va-batch-recognition-0-1').start, 0.4) }));
  });
  c.on('va-batch-recognition-0-2', () => {
    s.play(postOn.to(1, { duration: clampDur(c, c.cue('va-batch-recognition-0-2').start, 0.4) }));
  });
  c.on('va-batch-recognition-1-1', () => {
    s.play(downOn.to(1, { duration: clampDur(c, c.cue('va-batch-recognition-1-1').start, 0.4) }));
  });
  c.on('va-batch-recognition-1-3', () => {
    s.play(
      streamOn.to(1, { duration: clampDur(c, c.cue('va-batch-recognition-1-3').start, 0.45) }),
    );
  });
}
