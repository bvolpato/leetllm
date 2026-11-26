// Scene 09: overlap-timeline - Overlap work on one shared clock
// Multi-lane Gantt waterfall proving sequential 510 ms compresses to 380 ms (320 ms commit->audio)
// by overlapping STT, LLM first clause, TTS synthesis, and playback buffer.
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
  sequential,
  trace,
  txt,
} from '../parts.mjs';

export default function overlapTimeline(s, c) {
  const phase = s.value(0);
  const sttOn = s.value(0);
  const llmOn = s.value(0);
  const ttsOn = s.value(0);
  const bufOn = s.value(0);
  const seqOn = s.value(0);
  const critOn = s.value(0);

  const header = cinemaHeader('OVERLAPPED VOICE PIPELINE', 'Overlap work on', 'one shared clock', {
    x: -860,
    y: -445,
    accent: ROLE.ok,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#6ee7b71a', '#5ce1e618');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const st = sttOn.value;
      const lm = llmOn.value;
      const ts = ttsOn.value;
      const bf = bufOn.value;
      const sq = seqOn.value;
      const cr = critOn.value;
      const nodes = [];

      // Shared ruler 0 .. 550 ms across x = [-560 .. +780]
      const x0 = -560;
      const x1 = 780;
      const mapT = (t) => x0 + (t / 550) * (x1 - x0);

      const lanes = [
        { name: 'COMMIT', a: 0, b: trace.commit, y: -150, col: ROLE.net, vis: 1 },
        { name: 'STT', a: 0, b: trace.sttDone, y: -75, col: ROLE.audio, vis: 0.45 + st * 0.55 },
        {
          name: 'LLM CLAUSE',
          a: trace.clauseStart,
          b: trace.clauseDone,
          y: 0,
          col: ROLE.policy,
          vis: 0.35 + lm * 0.65,
        },
        {
          name: 'TTS SYNTH',
          a: trace.synthesisStart,
          b: trace.synthesisDone,
          y: 75,
          col: ROLE.focus,
          vis: 0.35 + ts * 0.65,
        },
        {
          name: 'PLAYOUT',
          a: trace.playoutStart,
          b: trace.firstAudio,
          y: 150,
          col: ROLE.ok,
          vis: 0.35 + bf * 0.65,
        },
      ];

      lanes.forEach((ln, idx) => {
        const xa = mapT(ln.a);
        const xb = mapT(ln.b);
        const w = Math.max(12, xb - xa);
        const putLeft = idx >= 3;
        nodes.push(
          txt(ln.name, -840, ln.y, 26, ln.col, 'mono', 'left').opacity(ln.vis),
          rect(w, 40, { fill: ln.col, stroke: '#ffffff', width: 1.5, radius: 6 })
            .at(xa + w * 0.5, ln.y)
            .glow(7, ln.col)
            .opacity(ln.vis * 0.9),
          txt(
            `${ln.a}-${ln.b} ms`,
            putLeft ? xa - 20 : xb + 20,
            ln.y,
            26,
            ln.col,
            'mono',
            putLeft ? 'right' : 'left',
          ).opacity(ln.vis),
        );
      });

      // Vertical markers: 380 ms overlapped vs 510 ms sequential
      const x380 = mapT(firstAudioLatency);
      const x510 = mapT(sequential);
      const axisY = 225;

      nodes.push(line([x0, axisY], [x1, axisY], { stroke: '#344770', width: 3 }));
      for (const t of [0, 100, 200, 300, 380, 510]) {
        const tx = mapT(t);
        nodes.push(
          line([tx, axisY - 10], [tx, axisY + 10], { stroke: '#4d6496', width: 2 }),
          txt(
            `${t}`,
            tx,
            axisY + 42,
            26,
            t === 380 ? ROLE.ok : t === 510 ? ROLE.fail : COSMOS.dim,
            'mono',
            'center',
          ),
        );
      }

      if (sq > 0.1) {
        nodes.push(
          line([x510, -185], [x510, axisY - 12], { stroke: ROLE.fail, width: 3.5, dash: [10, 8] })
            .glow(7, ROLE.fail)
            .opacity(sq),
          txt(`SEQ ${sequential} ms`, x510, -218, 26, ROLE.fail, 'mono', 'center').opacity(sq),
        );
      }

      if (cr > 0.1) {
        nodes.push(
          line([x380, -185], [x380, axisY - 12], { stroke: ROLE.ok, width: 4 })
            .glow(9, ROLE.ok)
            .opacity(cr),
          txt(`OVERLAP ${firstAudioLatency} ms`, x380, -218, 26, ROLE.ok, 'mono', 'center').opacity(
            cr,
          ),
        );
      }

      // Top-right compression ratio
      nodes.push(
        txt('CRITICAL PATH GAIN', 480, -425, 26, ROLE.focus, 'mono', 'center'),
        txt(`Sequential sum: ${sequential} ms`, 480, -378, 26, ROLE.fail, 'mono', 'center'),
        txt(
          `Overlapped: ${firstAudioLatency} ms  (commit: ${commitToAudio} ms)`,
          480,
          -334,
          26,
          ROLE.ok,
          'mono',
          'center',
        ),
      );

      nodes.push(
        txt(
          cr > 0.4
            ? `Overlap saves ${sequential - firstAudioLatency} ms before first speaker sound!`
            : 'Start LLM before STT finishes; start TTS while LLM keeps writing',
          0,
          355,
          28,
          cr > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
        glowDot(-780 + ((p * 110) % 220), 435, {
          radius: 4.5,
          color: ROLE.ok,
          glow: 8,
          opacity: 0.7,
        }),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.4);

  c.on('overlap-recognition-spoken', () => {
    s.play(sttOn.to(1, { duration: clampDur(c, c.cue('overlap-recognition-spoken').start, 0.35) }));
  });
  c.on('overlap-generation-spoken', () => {
    s.play(llmOn.to(1, { duration: clampDur(c, c.cue('overlap-generation-spoken').start, 0.35) }));
  });
  c.on('overlap-synthesis-spoken', () => {
    s.play(ttsOn.to(1, { duration: clampDur(c, c.cue('overlap-synthesis-spoken').start, 0.35) }));
  });
  c.on('overlap-buffer-spoken', () => {
    s.play(bufOn.to(1, { duration: clampDur(c, c.cue('overlap-buffer-spoken').start, 0.35) }));
  });
  c.on('overlap-sequential-spoken', () => {
    s.play(seqOn.to(1, { duration: clampDur(c, c.cue('overlap-sequential-spoken').start, 0.35) }));
  });
  c.on('overlap-total-spoken', () => {
    s.play(critOn.to(1, { duration: clampDur(c, c.cue('overlap-total-spoken').start, 0.4) }));
  });
}
