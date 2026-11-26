// Scene 2: workload-freeze - Which questions arrive together?
// Luminous 6-request workload spectrometer with glowing token energy bars, shared prefix laser
// thread, strict prediction withholding on the r03/r04 60 ms pair, and trace-hash provenance.
import { group, line } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  SERVING_COHORT,
  aura,
  cinemaHeader,
  clampDur,
  dashedRule,
  driftValue,
  glowBar,
  glowDot,
  glowingTrail,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function workloadFreeze(s, c) {
  const phase = s.value(0);
  const lenProg = s.value(0.18); // bars visible from frame 0, grow to 1 at workload-lengths
  const revealPair = s.value(0); // strictly AFTER workload-neighbors
  const capFocus = s.value(0); // workload-cap
  const fileFocus = s.value(0); // workload-file

  const header = cinemaHeader('FROZEN WORKLOAD TRACE', 'Which questions', 'arrive together?', {
    x: -860,
    y: -435,
    accent: ROLE.open,
    size: 50,
  });

  const stageAura = aura(120, 20, 660, '#5ce1e61e', '#ffd16614');

  const longest = Math.max(...SERVING_COHORT.map((r) => r.prompt));
  const gapMs = SERVING_COHORT[3].scheduled - SERVING_COHORT[2].scheduled;

  const specView = guardedDynamic(
    () => 1,
    () => {
      const lp = lenProg.value;
      const pairRev = revealPair.value;
      const capF = capFocus.value;
      const fileF = fileFocus.value;
      const pulse = 0.72 + 0.28 * Math.sin(phase.value * 4.5);

      const topY = -160;
      const rowStep = 82;
      const colId = -840;
      const colDue = -665;
      const barLeft = -480;
      const barMaxW = 400;
      const colTok = 85;
      const colCap = 265;
      const colPref = 405;
      const colCls = 860;

      const nodes = [
        // Floating column labels (no boxes, no divider bars!)
        txt('ID', colId, topY - 62, 26, COSMOS.muted, 'mono', 'left'),
        txt('DUE (MS)', colDue, topY - 62, 26, COSMOS.muted, 'mono', 'right'),
        txt('PROMPT TOKENS', barLeft, topY - 62, 26, COSMOS.muted, 'mono', 'left'),
        txt('CAP', colCap, topY - 62, 26, capF > 0.2 ? ROLE.focus : COSMOS.muted, 'mono', 'right'),
        txt('PREFIX', colPref, topY - 62, 26, COSMOS.muted, 'mono', 'left'),
        txt('CLASS', colCls, topY - 62, 26, COSMOS.muted, 'mono', 'right'),
      ];

      // Shared runbook A laser filament linking r01 (0), r02 (1), r06 (5)
      const threadX = colPref - 24;
      const r01Y = topY + 0 * rowStep;
      const r02Y = topY + 1 * rowStep;
      const r06Y = topY + 5 * rowStep;
      nodes.push(
        dashedRule(threadX, r01Y, threadX, r06Y, ROLE.open, 0.55, 2.2),
        glowDot(threadX, r01Y, { radius: 5.5, color: ROLE.open, glow: 8 }),
        glowDot(threadX, r02Y, { radius: 5.5, color: ROLE.open, glow: 8 }),
        glowDot(threadX, r06Y, { radius: 5.5, color: ROLE.open, glow: 8 }),
      );

      SERVING_COHORT.forEach((r, i) => {
        const yy = topY + i * rowStep;
        const isPair = i === 2 || i === 3;
        const isBg = r.priority === 'background';
        const hi = pairRev > 0.1 && isPair;
        const barColor = hi ? ROLE.focus : isBg ? ROLE.reply : ROLE.open;

        // Subtle oscilloscope rail
        nodes.push(line([colId, yy + 36], [colCls, yy + 36], { stroke: '#151f36', width: 1.4 }));

        nodes.push(
          txt(r.id, colId, yy, 30, hi ? ROLE.focus : ROLE.open, 'mono', 'left'),
          txt(String(r.scheduled), colDue, yy, 28, hi ? ROLE.focus : COSMOS.ink, 'mono', 'right'),
          glowBar(barLeft, yy, barMaxW, 30, (r.prompt / longest) * lp, {
            fill: barColor,
            glow: hi ? 12 : 6,
            radius: 8,
          }),
          txt(r.prompt.toLocaleString('en-US'), colTok, yy, 28, COSMOS.ink, 'mono', 'right'),
          txt(String(r.cap), colCap, yy, 28, capF > 0.2 ? ROLE.focus : COSMOS.ink, 'mono', 'right'),
          txt(
            r.prefix,
            colPref,
            yy,
            26,
            r.prefix === 'runbook A' ? ROLE.open : isBg ? ROLE.reply : COSMOS.dim,
            'mono',
            'left',
          ),
          txt(r.priority, colCls, yy, 26, isBg ? ROLE.reply : COSMOS.muted, 'mono', 'right'),
        );
      });

      // Glowing 60 ms neighbor connector arc strictly AFTER workload-neighbors
      if (pairRev > 0.05) {
        const y3 = topY + 2 * rowStep;
        const y4 = topY + 3 * rowStep;
        const arcX = colId - 16;
        nodes.push(
          glowingTrail(
            [
              [arcX, y3],
              [arcX - 24, (y3 + y4) * 0.5],
              [arcX, y4],
            ],
            { color: ROLE.focus, width: 4.0, glow: 10, opacity: pairRev },
          ),
        );
      }

      // Bottom contextual insight strip (mutually exclusive states, never overlapping)
      if (fileF > 0.5) {
        nodes.push(
          txt(
            'HASH REALIZED TRACE BYTES  ·  KEEP PROMPTS, CONTEXT & CHAT TEMPLATE',
            0,
            406,
            28,
            ROLE.qualified,
            'mono',
          )
            .glow(6, ROLE.qualified)
            .opacity(fileF),
          txt(
            'Compare tails & bursts against BurstGPT / ServeGen',
            0,
            454,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(fileF),
        );
      } else if (capF > 0.5) {
        nodes.push(
          txt(
            'OUTPUT CAP IS AN UPPER BOUND  ·  SAVE ACTUAL OUTPUT LENGTHS TOO',
            0,
            406,
            28,
            ROLE.focus,
            'mono',
          )
            .glow(6, ROLE.focus)
            .opacity(capF),
          txt(
            'Ignoring EOS forces scheduler-only stress, changing the task',
            0,
            454,
            26,
            COSMOS.muted,
            'sans',
          ).opacity(capF),
        );
      } else if (pairRev > 0.5) {
        nodes.push(
          txt(
            `r04 ARRIVES ${gapMs} MS BEHIND r03 (4,096 TOKENS)  ·  RUNBOOK A SHARED BY r01, r02, r06`,
            0,
            418,
            28,
            ROLE.focus,
            'mono',
          )
            .glow(7, ROLE.focus)
            .opacity(pairRev),
        );
      } else {
        nodes.push(
          txt(
            'PREDICT: Which request arrives right behind the longest prompt?',
            0,
            418,
            30,
            ROLE.focus,
            'mono',
          )
            .glow(6, ROLE.focus)
            .opacity(pulse),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, specView);
  driftValue(s, c, phase, 8, { startOffset: 0.1, endMargin: 0.5 });

  c.on('workload-lengths', () => {
    const t = c.cue('workload-lengths').start;
    s.play(lenProg.to(1, { duration: clampDur(c, t, 0.85) }));
  });
  c.after('workload-neighbors', () => {
    const t = c.cue('workload-neighbors').end;
    s.play(revealPair.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('workload-cap', () => {
    const t = c.cue('workload-cap').start;
    s.play(capFocus.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('workload-file', () => {
    const t = c.cue('workload-file').start;
    s.play(fileFocus.to(1, { duration: clampDur(c, t, 0.35) }));
  });
}
