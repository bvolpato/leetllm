// Scene 04: detect-and-commit - Listening and turn completion are separate
// Live digit-stream speech trace ("incident 4 ... [pause] ... 2 1 9") showing VAD vs Turn Policy
// gate requiring silence + stability + 4-digit semantic completeness.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  driftValue,
  guardedDynamic,
  partialTurns,
  turnComplete,
  txt,
  waveformRibbon,
} from '../parts.mjs';

export default function detectAndCommit(s, c) {
  const phase = s.value(0);
  const policyOn = s.value(0);
  const pauseOn = s.value(0);
  const completeOn = s.value(0);
  const ruleOn = s.value(0);

  const header = cinemaHeader('VAD VS TURN POLICY', 'Listening and commit', 'are separate', {
    x: -860,
    y: -445,
    accent: ROLE.audio,
    size: 46,
  });

  const bgAura = aura(40, 20, 680, '#5ce1e61a', '#6ee7b716');

  const view = guardedDynamic(
    () => 1,
    () => {
      const p = phase.value;
      const pol = policyOn.value;
      const pau = pauseOn.value;
      const cmp = completeOn.value;
      const rul = ruleOn.value;
      const nodes = [];

      // Speech waveform lane across top-mid (y = -110): burst 1 ("incident 4"), pause, burst 2 ("2 1 9")
      const wY = -105;
      nodes.push(
        txt('ACOUSTIC VAD FRAMES', -840, wY - 62, 26, ROLE.audio, 'mono', 'left'),
        waveformRibbon(-820, -210, wY, 34, p * 2.2, { color: ROLE.audio, freq: 5 }),
        line([-200, wY], [110, wY], { stroke: ROLE.warn, width: 3, dash: [10, 8] }),
        txt('80 ms PAUSE', -45, wY - 38, 26, ROLE.warn, 'mono', 'center'),
        waveformRibbon(120, 760, wY, cmp > 0.4 ? 34 : 6, p * 2.2 + 0.5, {
          color: cmp > 0.4 ? ROLE.ok : COSMOS.dim,
          freq: 5.5,
          opacity: 0.35 + cmp * 0.65,
        }),
        txt('"incident 4"', -515, wY + 62, 28, ROLE.audio, 'mono', 'center'),
        txt('"2 1 9"', 440, wY + 62, 28, cmp > 0.4 ? ROLE.ok : COSMOS.dim, 'mono', 'center'),
      );

      // 3-Row Turn-Commit Evaluation Matrix from partialTurns (imported from fixtures!)
      const rowYs = [65, 145, 225];
      nodes.push(
        txt('CANDIDATE', -820, 8, 26, COSMOS.muted, 'mono', 'left'),
        txt('SILENCE', -350, 8, 26, COSMOS.muted, 'mono', 'center'),
        txt('4-DIGIT ID', -20, 8, 26, COSMOS.muted, 'mono', 'center'),
        txt('TURN POLICY', 460, 8, 26, ROLE.focus, 'mono', 'center'),
      );

      partialTurns.forEach((pt, i) => {
        const ok = turnComplete(pt);
        const visible = i === 0 ? 0.5 + pau * 0.5 : i === 1 ? 0.3 + cmp * 0.7 : 0.25 + cmp * 0.75;
        const col = ok ? ROLE.ok : i === 0 && pau > 0.5 ? ROLE.warn : COSMOS.muted;
        const y = rowYs[i];
        nodes.push(
          txt(`"${pt.text}"`, -820, y, 26, col, 'mono', 'left').opacity(visible),
          txt(`${pt.silenceMs} ms`, -350, y, 26, col, 'mono', 'center').opacity(visible),
          txt(
            ok ? 'COMPLETE' : 'INCOMPLETE',
            -20,
            y,
            26,
            ok ? ROLE.ok : ROLE.fail,
            'mono',
            'center',
          ).opacity(visible),
          txt(
            ok ? 'COMMIT -> CALL TOOL' : 'HOLD (DO NOT COMMIT)',
            460,
            y,
            26,
            ok ? ROLE.ok : ROLE.warn,
            'mono',
            'center',
          ).opacity(visible),
        );
      });

      // Top-right rule readout
      nodes.push(
        txt('THREE COMMIT SIGNALS', 480, -430, 26, ROLE.focus, 'mono', 'center'),
        txt('1. silence  ·  2. stability', 480, -384, 26, COSMOS.ink, 'mono', 'center'),
        txt(
          pol > 0.5
            ? '3. semantic completeness (/^incident \\d{4}$/)'
            : 'silence alone cuts off digits!',
          480,
          -338,
          26,
          pol > 0.5 ? ROLE.ok : ROLE.warn,
          'mono',
          'center',
        ),
      );

      // Bottom discipline bar
      nodes.push(
        line([-840, 295], [840, 295], { stroke: '#25355a', width: 2 }).opacity(0.65),
        txt(
          rul > 0.4
            ? 'Reversible prefetch may run early; factual answers & side effects wait for commit'
            : 'VAD detects speech presence; turn policy decides when the caller is done',
          0,
          355,
          26,
          rul > 0.4 ? ROLE.ok : COSMOS.muted,
          'mono',
          'center',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(bgAura, header, view);
  driftValue(s, c, phase, 4.0);

  c.on('detect-turn-policy', () => {
    s.play(policyOn.to(1, { duration: clampDur(c, c.cue('detect-turn-policy').start, 0.35) }));
  });
  c.on('detect-partial-identifier', () => {
    s.play(
      pauseOn.to(1, { duration: clampDur(c, c.cue('detect-partial-identifier').start, 0.35) }),
    );
  });
  c.on('detect-spoken-completion', () => {
    s.play(
      completeOn.to(1, { duration: clampDur(c, c.cue('detect-spoken-completion').start, 0.4) }),
    );
  });
  c.on('detect-commit-rule', () => {
    s.play(ruleOn.to(1, { duration: clampDur(c, c.cue('detect-commit-rule').start, 0.35) }));
  });
}
