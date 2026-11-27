// Scene 19: pcm-contract - Derive duration from actual sample frames
// Visual proof: 480 samples at 24 kHz = 20 ms (960 bytes) stretches by +50% to 30 ms when
// mislabeled at 16 kHz, alongside 320 samples at 16 kHz = 20 ms (640 bytes).
import { group, line, rect } from 'vizmatic/stage';
import { COSMOS, ROLE, aura, cinemaHeader, clampDur, guardedDynamic, txt } from '../parts.mjs';

export default function pcmContract(s, c) {
  const formulaOn = s.value(0);
  const stretchOn = s.value(0); // 0 = 20ms at 24kHz, 1 = 30ms mislabeled at 16kHz!
  const bytesOn = s.value(0);

  const header = cinemaHeader(
    'RAW 16-BIT PCM CONTRACT',
    'Derive duration from',
    'actual sample frames',
    {
      x: -860,
      y: -445,
      accent: ROLE.audio,
      size: 46,
    },
  );

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#f43f5e16');

  const view = guardedDynamic(
    () => 1,
    () => {
      const fm = formulaOn.value;
      const st = stretchOn.value;
      const bt = bytesOn.value;
      const nodes = [];

      // Shared ms ruler: 0 .. 35 ms across x = [-560 .. +680]
      const x0 = -560;
      const x1 = 680;
      const mapMs = (ms) => x0 + (ms / 35) * (x1 - x0);

      // Row 1: 16 kHz mono input -> 320 samples = 20 ms (640 bytes)
      const y1 = -115;
      const w20 = mapMs(20) - x0;
      nodes.push(
        txt('16 kHz IN', -840, y1, 26, ROLE.audio, 'mono', 'left'),
        rect(w20, 48, { fill: ROLE.audio, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at(x0 + w20 * 0.5, y1)
          .glow(7, ROLE.audio)
          .opacity(0.88),
        txt('320 samples = 20 ms', x0 + w20 * 0.5, y1, 26, '#070910', 'mono', 'center'),
        txt(
          bt > 0.4 ? '640 bytes (16-bit mono)' : 'native input rate',
          x0 + w20 + 28,
          y1,
          26,
          ROLE.audio,
          'mono',
          'left',
        ),
      );

      // Row 2: 24 kHz mono output -> 480 samples = 20 ms (960 bytes)
      const y2 = 5;
      nodes.push(
        txt('24 kHz OUT', -840, y2, 26, ROLE.ok, 'mono', 'left'),
        rect(w20, 48, { fill: ROLE.ok, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at(x0 + w20 * 0.5, y2)
          .glow(8, ROLE.ok)
          .opacity(0.9),
        txt('480 samples = 20 ms', x0 + w20 * 0.5, y2, 26, '#070910', 'mono', 'center'),
        txt(
          bt > 0.4 ? '960 bytes (16-bit mono)' : 'native output rate',
          x0 + w20 + 28,
          y2,
          26,
          ROLE.ok,
          'mono',
          'left',
        ),
      );

      // Row 3: SAME 480 samples mislabeled as 16 kHz -> stretches 20 ms -> 30 ms (+50%!)
      const y3 = 125;
      const curMs = 20 + st * 10;
      const wStretch = mapMs(curMs) - x0;
      const stCol = st > 0.4 ? ROLE.fail : ROLE.warn;
      nodes.push(
        txt('MISLABELED', -840, y3, 26, stCol, 'mono', 'left').opacity(0.4 + st * 0.6),
        rect(wStretch, 48, { fill: stCol, stroke: '#ffffff', width: 1.5, radius: 6 })
          .at(x0 + wStretch * 0.5, y3)
          .glow(st > 0.4 ? 10 : 0, stCol)
          .opacity(0.4 + st * 0.55),
        txt(
          `480 @ 16 kHz = ${Math.round(curMs)} ms (+50%!)`,
          x0 + wStretch * 0.5,
          y3,
          26,
          '#070910',
          'mono',
          'center',
        ).opacity(0.4 + st * 0.6),
      );

      // Axis ticks (0, 10, 20, 30 ms)
      const axisY = 210;
      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 3 }));
      for (const t of [0, 10, 20, 30]) {
        const tx = mapMs(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#4d6496', width: 2 }),
          txt(
            `${t} ms`,
            tx,
            axisY + 42,
            26,
            t === 30 && st > 0.4 ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      // Top-right formula readout
      nodes.push(
        txt('PCM DURATION FORMULA', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(
          'ms = (frames * 1000) / sample_rate',
          480,
          -378,
          26,
          fm > 0.4 ? ROLE.focus : COSMOS.ink,
          'mono',
          'center',
        ),
        txt(
          'bytes = samples * 2  (mono 16-bit)',
          480,
          -334,
          26,
          bt > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      nodes.push(
        txt(
          st > 0.4
            ? 'Relabeling is NOT resampling: wrong sample rate corrupts your playout cursor!'
            : 'Decode transport codec before PCM handoff; match rate to real samples',
          0,
          345,
          26,
          st > 0.4 ? ROLE.fail : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  c.on('va-pcm-contract-1-0', () => {
    s.play(formulaOn.to(1, { duration: clampDur(c, c.cue('va-pcm-contract-1-0').start, 0.35) }));
  });
  c.on('va-pcm-contract-1-2', () => {
    s.play(stretchOn.to(1, { duration: clampDur(c, c.cue('va-pcm-contract-1-2').start, 0.5) }));
  });
  c.on('va-pcm-contract-2-0', () => {
    s.play(bytesOn.to(1, { duration: clampDur(c, c.cue('va-pcm-contract-2-0').start, 0.35) }));
  });
}
