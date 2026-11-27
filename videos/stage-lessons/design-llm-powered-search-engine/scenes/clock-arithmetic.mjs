// Scene 20: clock-arithmetic - Calculate the complete checked-answer path
// Exact dependency waterfall using `checkedClocks`:
// Independent overlap -> max(40,260)+90+20+430 = 800ms draft, +180 = 980ms checked.
// Dependent rewrite -> shifts every downstream stage right by +40ms -> 840ms draft, 1020ms checked!
import { group, line, rect } from 'vizmatic/stage';
import {
  CLOCK_DEPENDENT,
  CLOCK_OVERLAP,
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  guardedDynamic,
  txt,
} from '../parts.mjs';

export default function clockArithmetic(s, c) {
  const stageReveal = s.value(0);
  const overlapOn = s.value(0);
  const clockReach = s.value(260);
  const draftOn = s.value(0);
  const checkedOn = s.value(0);
  const depShift = s.value(0); // 0 = overlap (800/980), 1 = dependent (+40ms -> 840/1020)
  const beat2On = s.value(0);

  const header = cinemaHeader(
    'DEPENDENCY ARITHMETIC',
    'Overlap independent work,',
    'serialize dependencies',
    {
      accent: ROLE.clock,
      size: 46,
    },
  );

  const stageAura = aura(100, 40, 700, '#ffd16618', '#5ce1e61a');

  const view = guardedDynamic(
    () => 1,
    () => {
      const sh = depShift.value;
      const reach = clockReach.value;
      const dr = draftOn.value > 0.5;
      const ch = checkedOn.value > 0.5;
      const b2 = beat2On.value > 0.5;

      const shiftMs = 40 * sh;
      const ops = [
        { name: 'Plan (40)', s: 0, e: 40, col: ROLE.policy },
        { name: 'Retrieve (260)', s: shiftMs, e: shiftMs + 260, col: ROLE.query },
        { name: 'Rerank (90)', s: shiftMs + 260, e: shiftMs + 350, col: ROLE.rewrite },
        { name: 'Pack (20)', s: shiftMs + 350, e: shiftMs + 370, col: ROLE.focus },
        { name: 'First token (430)', s: shiftMs + 370, e: shiftMs + 800, col: ROLE.query },
        { name: 'Claim (100)', s: shiftMs + 800, e: shiftMs + 900, col: ROLE.policy },
        { name: 'Check (80)', s: shiftMs + 900, e: shiftMs + 980, col: ROLE.ok },
      ];

      const x0 = -500;
      const x1 = 830;
      const mapMs = (ms) => x0 + (ms / 1060) * (x1 - x0);
      const nodes = [];

      nodes.push(
        txt(
          sh > 0.5
            ? 'DEPENDENT REWRITE: plan 40 + retrieve 260 -> +40 ms shift'
            : 'INDEPENDENT OVERLAP: max(40, 260) = 260 ms',
          830,
          -395,
          28,
          sh > 0.5 ? ROLE.caution : ROLE.query,
          'mono',
          'right',
        ).opacity(0.6 + 0.4 * overlapOn.value),
      );

      for (const tick of [0, 260, 400, 600, 800, 980, 1020]) {
        const tx = mapMs(tick);
        nodes.push(line([tx, -245], [tx, 245], { stroke: '#1c2845', width: 1.8 }));
      }

      ops.forEach((op, i) => {
        const y = -205 + i * 70;
        nodes.push(
          txt(op.name, -855, y, 26, COSMOS.ink, 'mono', 'left'),
          line([x0, y + 22], [x1, y + 22], { stroke: '#233252', width: 1.5 }),
        );
        const curEnd = Math.min(op.e, reach + shiftMs);
        if (curEnd > op.s + 1) {
          const bx = mapMs(op.s);
          const bw = Math.max(8, mapMs(curEnd) - bx);
          nodes.push(
            rect(bw, 40, { fill: op.col, stroke: '#ffffff', width: 1, radius: 6 })
              .at(bx + bw * 0.5, y)
              .glow(6, op.col)
              .opacity(0.65 + 0.3 * stageReveal.value),
          );
        }
      });

      const curDraft = sh > 0.5 ? CLOCK_DEPENDENT.draft : CLOCK_OVERLAP.draft;
      const curChecked = sh > 0.5 ? CLOCK_DEPENDENT.checked : CLOCK_OVERLAP.checked;

      if (dr || ch || b2) {
        nodes.push(
          txt(`DRAFT TOKEN: ${curDraft} ms`, -855, 308, 34, ROLE.query, 'mono', 'left').glow(
            7,
            ROLE.query,
          ),
        );
      }
      if (ch || b2) {
        nodes.push(
          txt(`CHECKED CLAIM: ${curChecked} ms`, 80, 308, 34, ROLE.ok, 'mono', 'left').glow(
            8,
            ROLE.ok,
          ),
        );
      }

      nodes.push(
        txt(
          b2
            ? 'Model delay -> PagedAttention & speculative decoding; slow fetch -> optimize retrieval.'
            : sh > 0.5
              ? 'Waiting for the rewrite shifts draft (840 ms) AND checked claim (1,020 ms) by +40 ms.'
              : '260 + 90 + 20 + 430 = 800 ms draft; + 100 + 80 = 980 ms checked claim.',
          -855,
          388,
          28,
          b2 ? ROLE.focus : COSMOS.muted,
          'sans',
          'left',
        ),
      );

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view);
  c.on('se-clock-arithmetic-0', () => {
    s.play(stageReveal.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-0').start, 0.5) }));
  });
  c.on('se-clock-arithmetic-overlap', () => {
    s.play(
      overlapOn.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-overlap').start, 0.35) }),
    );
  });
  c.on('se-clock-arithmetic-1', () => {
    s.play(
      clockReach.to(800, { duration: clampDur(c, c.cue('se-clock-arithmetic-1').start, 0.9) }),
    );
  });
  c.on('se-clock-arithmetic-draft', () => {
    s.play(draftOn.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-draft').start, 0.3) }));
  });
  c.on('se-clock-arithmetic-checked', () => {
    s.play(
      clockReach.to(980, {
        duration: clampDur(c, c.cue('se-clock-arithmetic-checked').start, 0.5),
      }),
    );
    s.play(
      checkedOn.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-checked').start, 0.3) }),
    );
  });
  c.on('se-clock-arithmetic-dependent', () => {
    s.play(
      depShift.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-dependent').start, 0.65) }),
    );
  });
  c.on('se-clock-arithmetic-2', () => {
    s.play(beat2On.to(1, { duration: clampDur(c, c.cue('se-clock-arithmetic-2').start, 0.35) }));
  });
}
