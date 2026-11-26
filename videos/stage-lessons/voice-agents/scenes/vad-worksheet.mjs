// Scene 05: vad-worksheet - Count frames before deciding that silence lasted long enough
// Interactive 8-frame 20ms speech-probability oscilloscope (2 pre-roll + 3 speech + 3 silence),
// ceiling rounding 60ms->3 frames vs 61ms->4 frames (80ms), and 5 retained frames = 100ms.
import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WORKSHEET,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function vadWorksheet(s, c) {
  const phase = s.value(0);
  const roundOn = s.value(0);
  const retainOn = s.value(0);
  const trimOn = s.value(0);
  const errorsOn = s.value(0);

  const header = cinemaHeader('FRAME-LEVEL VAD MATH', 'Count 20 ms frames', 'before endpointing', {
    x: -860,
    y: -445,
    accent: ROLE.audio,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#ffd16618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const rnd = roundOn.value;
      const ret = retainOn.value;
      const trm = trimOn.value;
      const err = errorsOn.value;
      const nodes = [];

      // 8-frame probability bar chart (base y = 115, height = 220 -> y in [-105..115])
      const baseY = 115;
      const maxH = 220;
      const threshY = baseY - 0.5 * maxH; // p = 0.50 threshold
      const startX = -700;
      const stepX = 165;
      const probs = WORKSHEET.probabilities; // [0.04, 0.08, 0.66, 0.74, 0.69, 0.22, 0.15, 0.09]

      // Threshold dashed line p >= 0.50
      nodes.push(
        line([startX - 75, threshY], [startX + 7 * stepX + 85, threshY], {
          stroke: ROLE.focus,
          width: 3,
          dash: [10, 8],
        }).glow(6, ROLE.focus),
        txt('p = 0.50', startX - 95, threshY, 26, ROLE.focus, 'mono', 'right'),
        line([startX - 75, baseY], [startX + 7 * stepX + 85, baseY], {
          stroke: '#344770',
          width: 3,
        }),
      );

      probs.forEach((prob, idx) => {
        const cx = startX + idx * stepX;
        const h = Math.max(12, prob * maxH);
        const isPre = idx < 2;
        const isSpeech = idx >= 2 && idx <= 4;
        const isTrail = idx >= 5;

        let col = isSpeech ? ROLE.ok : isPre ? ROLE.audio : COSMOS.dim;
        if (trm > 0.5 && isTrail) col = ROLE.fail;

        const barAlpha = trm > 0.5 && isTrail ? 0.35 : 0.9;
        nodes.push(
          rect(82, h, { fill: col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(cx, baseY - h * 0.5)
            .glow(isSpeech ? 8 : 4, col)
            .opacity(barAlpha),
          txt(prob.toFixed(2), cx, baseY - h - 26, 26, col, 'mono', 'center').opacity(
            trm > 0.5 && isTrail ? 0.5 : 1,
          ),
          txt(`F${idx}`, cx, baseY + 34, 26, COSMOS.ink, 'mono', 'center'),
          txt(
            isPre ? 'pre' : isSpeech ? 'spch' : 'sil',
            cx,
            baseY + 70,
            26,
            isPre ? ROLE.audio : isSpeech ? ROLE.ok : ROLE.warn,
            'mono',
            'center',
          ),
        );
      });

      // Top-right ceiling rounding math (60ms -> 3 frames, 61ms -> 4 frames = 80ms)
      const rx = 470;
      nodes.push(
        txt('CEILING FRAME ROUNDING', rx, -430, 26, ROLE.focus, 'mono', 'center'),
        txt('ceil(60 / 20) = 3 frames (60 ms)', rx, -384, 26, COSMOS.ink, 'mono', 'center'),
        txt(
          `ceil(61 / 20) = ${WORKSHEET.requested61Frames} frames (${WORKSHEET.requested61Frames * 20} ms)`,
          rx,
          -338,
          26,
          rnd > 0.5 ? ROLE.warn : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      // Bottom bracket summary (switches cleanly between retained audio & error taxonomy)
      const botY = 290;
      if (err > 0.4) {
        nodes.push(
          txt('TRACK TWO ERRORS SEPARATELY', 0, botY - 22, 28, ROLE.cut, 'mono', 'center').glow(
            6,
            ROLE.cut,
          ),
          txt(
            'False start -> mutes speaker  |  Early endpoint -> cuts off last digit',
            0,
            botY + 32,
            26,
            COSMOS.ink,
            'mono',
            'center',
          ),
        );
      } else if (trm > 0.4) {
        nodes.push(
          txt(
            `RETAINED: 2 pre-roll + 3 speech = ${WORKSHEET.retainedFrames.length} frames (100 ms)`,
            0,
            botY - 22,
            28,
            ROLE.ok,
            'mono',
            'center',
          ).glow(8, ROLE.ok),
          txt(
            'Trailing 3 silence frames trimmed · 40 ms pre-roll came before speech!',
            0,
            botY + 32,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );
      } else if (ret > 0.4) {
        nodes.push(
          txt(
            'START AT F2 + 40 ms PRE-ROLL (F0, F1) -> ENDPOINT AT F7',
            0,
            botY,
            28,
            ROLE.audio,
            'mono',
            'center',
          ),
        );
      } else {
        nodes.push(
          txt(
            '20 ms frames · speech when p >= 0.50 · round requested silence UP',
            0,
            botY,
            26,
            COSMOS.muted,
            'mono',
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

  c.on('va-vad-worksheet-0-3', () => {
    s.play(roundOn.to(1, { duration: clampDur(c, c.cue('va-vad-worksheet-0-3').start, 0.35) }));
  });
  c.on('va-vad-worksheet-1-1', () => {
    s.play(retainOn.to(1, { duration: clampDur(c, c.cue('va-vad-worksheet-1-1').start, 0.35) }));
  });
  c.on('va-vad-worksheet-2-0', () => {
    s.play(trimOn.to(1, { duration: clampDur(c, c.cue('va-vad-worksheet-2-0').start, 0.4) }));
  });
  c.on('va-vad-worksheet-3-1', () => {
    s.play(errorsOn.to(1, { duration: clampDur(c, c.cue('va-vad-worksheet-3-1').start, 0.4) }));
  });
}
