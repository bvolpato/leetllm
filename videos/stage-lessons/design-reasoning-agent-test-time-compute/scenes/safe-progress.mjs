import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  dotItem,
  glowDot,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export function buildSafeProgress(s, c) {
  s.add(aura(-460, -40, 560, ROLE.agent, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.ok, COSMOS.bg));

  s.add(
    cinemaHeader('LATENCY & PUBLIC STREAM', 'A quick status event is not', 'final-answer latency', {
      x: -860,
      y: -445,
      accent: ROLE.agent,
      size: 46,
    }),
  );

  const privOn = s.value(0);
  c.on('ra-safe-progress-1-0', () =>
    s.play(privOn.to(1, { duration: clampDur(c, c.cue('ra-safe-progress-1-0').start, 0.55) })),
  );

  // Request clock: 0.0 s .. 3.0 s across [-760 .. +760]
  const x0 = -760;
  const x1 = 760;
  const mapS = (sec) => x0 + (sec / 3.0) * (x1 - x0);

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const pr = privOn.value;
        const nodes = [];

        const yClk = -105;
        nodes.push(
          txt(
            'SINGLE REQUEST CLOCK (0.0 s .. 3.0 s)',
            -760,
            yClk - 115,
            26,
            ROLE.focus,
            'mono',
            'left',
          ),
          line([x0, yClk], [x1, yClk], { stroke: '#344770', width: 4 }),
        );

        const milestones = [
          { t: 0.1, label: '0.1 s', desc: 'GATEWAY STATUS', col: ROLE.agent, yOff: -56 },
          { t: 0.8, label: '0.8 s', desc: 'FIRST MODEL TOKEN', col: ROLE.focus, yOff: 62 },
          { t: 2.5, label: '2.5 s', desc: 'CHECKED FINAL ADVICE', col: ROLE.ok, yOff: -56 },
        ];
        milestones.forEach((m) => {
          const mx = mapS(m.t);
          nodes.push(
            glowDot(mx, yClk, { radius: 11, color: m.col, glow: 12 }),
            txt(`${m.label}  ${m.desc}`, mx, yClk + m.yOff, 26, m.col, 'mono', 'center'),
          );
        });

        nodes.push(
          txt(
            'RECORD TIME TO EACH EVENT + GENERATOR & VERIFIER WORK (EARLY UPDATES CANNOT HIDE COST)',
            0,
            yClk + 132,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ),
        );

        // Bottom: Public stream fields vs Private internal state
        nodes.push(line([-860, 82], [840, 82], { stroke: '#233152', width: 2 }));
        const pAlpha = 0.35 + 0.65 * pr;

        nodes.push(
          txt('SAFE PUBLIC STREAM', -840, 146, 28, ROLE.ok, 'mono', 'left').opacity(pAlpha),
          dotItem(-825, 214, 'ACTIVE STRATEGY & TOKENS SPENT', ROLE.ok, { opacity: pAlpha }),
          dotItem(-825, 278, 'VERIFIED EVIDENCE MILESTONES', ROLE.agent, { opacity: pAlpha }),
          dotItem(-825, 342, 'FINAL ADVICE ONLY AFTER CHECKS PASS', ROLE.focus, {
            opacity: pAlpha,
          }),
        );

        nodes.push(line([20, 132], [20, 385], { stroke: '#233152', width: 2 }).opacity(pAlpha));

        nodes.push(
          txt('KEEP PRIVATE / INTERNAL', 70, 146, 28, ROLE.fail, 'mono', 'left').opacity(pAlpha),
          dotItem(85, 214, 'HIDDEN SCRATCHPADS & RAW TRACES', ROLE.fail, { opacity: pAlpha }),
          dotItem(85, 278, 'INTERNAL PROXY SCORES', ROLE.warn, { opacity: pAlpha }),
          dotItem(85, 342, 'UNVERIFIED MODEL SELF-CLAIMS', ROLE.fail, { opacity: pAlpha }),
        );

        return group(...nodes);
      },
    ),
  );
}
