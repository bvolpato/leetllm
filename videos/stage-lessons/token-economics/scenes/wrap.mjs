// Scene 15: wrap - Which reply costs less per accepted task?
// Mode 0 (beats 0-2): 3 concise attempts (C-A1 accept, C-B1 fail, C-B2 accept = $0.01371) grouped into Tasks A & B
// beside Verbose baseline ($0.01184). Prediction withheld on beat 2.
// Mode 1 (beat 3 `payoff-compare`): Stacked horizontal dollar race where pink C-B1 failure pushes Concise
// ($0.006855/task) past Verbose ($0.005920/task).
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  WRAP_ATTEMPTS,
  WRAP_BASELINE,
  WRAP_CONCISE,
  aura,
  cinemaHeader,
  clampDur,
  conciseMicro,
  dashedRule,
  driftValue,
  fadeInHalf,
  fadeOutHalf,
  guardedDynamic,
  txt,
  usd,
  verboseMicro,
} from '../parts.mjs';

export default function wrap(s, c) {
  const pulseT = s.value(0);
  const mode = s.value(0); // 0 = receipts & task grouping (beats 0..2), 1 = comparison bar race (beat 3)
  const showRec = s.value(0); // `payoff-receipts`
  const groupTasks = s.value(0); // `payoff-group-tasks`
  const showVerbosePrompt = s.value(0); // beat 2
  const compareProg = s.value(0); // `payoff-compare`

  const header = cinemaHeader('COST PER ACCEPTED TASK', 'Three concise calls,', 'or two verbose?', {
    x: -860,
    y: -415,
    accent: ROLE.output,
    size: 52,
  });

  const sceneAura = aura(0, 50, 720, '#6ee7b71e', '#ff6b8b20');

  // Mode 0: Three concise receipts -> grouped into Task A & Task B + Beat 2 question
  const mode0 = guardedDynamic(
    () => fadeOutHalf(mode.value),
    (a) => {
      const sr = showRec.value;
      const gt = groupTasks.value;
      const vp = showVerbosePrompt.value;
      const count = Math.min(3, Math.floor(sr * 3 + 0.05));

      const nodes = [];

      if (vp > 0.1) {
        nodes.push(
          txt(
            `Verbose baseline: 2 accepts x ${usd(verboseMicro, 5)} = ${usd(WRAP_BASELINE.spend, 5)}`,
            840,
            -355,
            28,
            ROLE.verbose,
            'mono',
            'right',
          )
            .glow(6, ROLE.verbose)
            .opacity(vp * a),
        );
      }

      // Three attempt slots (glide smoothly horizontally into Task A vs Task B with zero crossing)
      const positions = [
        { x: -560, y: -45 },
        { x: 0, y: -45 },
        { x: 560, y: -45 },
      ];
      const groupedPos = [
        { x: -610, y: -45 },
        { x: 140, y: -45 },
        { x: 610, y: -45 },
      ];

      WRAP_ATTEMPTS.forEach((att, idx) => {
        const arrived = idx < count;
        const px = positions[idx].x + (groupedPos[idx].x - positions[idx].x) * gt;
        const py = positions[idx].y + (groupedPos[idx].y - positions[idx].y) * gt;
        const col = !arrived ? '#415175' : att.accepted ? ROLE.ok : ROLE.fail;
        const fill = !arrived ? '#101628' : att.accepted ? '#0d2620' : '#351324';

        nodes.push(
          rect(410, 126, { fill, stroke: col, width: 2.6, radius: 14 })
            .at(px, py)
            .glow(arrived ? 8 : 0, col)
            .opacity(a),
          txt(
            `${att.id}  ·  ${arrived ? (att.accepted ? 'ACCEPT' : 'FAIL') : 'pending'}`,
            px,
            py - 22,
            28,
            col,
            'mono',
          ).opacity(a),
          txt(arrived ? usd(att.costMicro, 5) : '...', px, py + 28, 34, COSMOS.ink, 'mono').opacity(
            a,
          ),
        );
      });

      if (gt > 0.25) {
        nodes.push(
          txt('TASK A  ·  1 ACCEPTED', -610, -155, 26, ROLE.ok, 'mono').opacity(gt * a),
          txt('TASK B  ·  1 ACCEPTED (2 ATTEMPTS)', 375, -155, 26, ROLE.cached, 'mono').opacity(
            gt * a,
          ),
        );
      }

      // Cumulative spend strip across bottom
      const stripY = 235;
      for (let i = 0; i < count; i++) {
        const col = i === 1 ? ROLE.fail : ROLE.ok;
        nodes.push(
          rect(370, 50, {
            fill: i === 1 ? '#3b1528' : '#0f2d25',
            stroke: col,
            width: 2.4,
            radius: 10,
          })
            .at(-400 + i * 400, stripY)
            .glow(7, col)
            .opacity(a),
          txt(WRAP_ATTEMPTS[i].id, -400 + i * 400, stripY, 26, col, 'mono').opacity(a),
        );
      }

      nodes.push(
        txt(
          vp > 0.3
            ? 'Which format cost less per accepted task?'
            : `All ${count} receipt(s) in numerator: ${usd(count * conciseMicro, 5)}`,
          0,
          355,
          36,
          vp > 0.3 ? ROLE.cached : ROLE.cached,
          vp > 0.3 ? 'serif' : 'mono',
        )
          .glow(7, ROLE.cached)
          .opacity(a),
      );

      return group(...nodes);
    },
  );

  // Mode 1: Horizontal dollar comparison race (Verbose $0.01184 vs Concise $0.01371)
  const mode1 = guardedDynamic(
    () => fadeInHalf(mode.value),
    (a) => {
      const cp = compareProg.value;
      const barLeft = -560;
      const fullW = 1320; // corresponds to WRAP_CONCISE.spend = 13710
      const scale = fullW / WRAP_CONCISE.spend;
      const verbEnd = barLeft + WRAP_BASELINE.spend * scale;

      const nodes = [
        txt(
          'SPEND FOR THE SAME TWO ACCEPTED TASKS',
          -860,
          -195,
          28,
          COSMOS.muted,
          'mono',
          'left',
        ).opacity(a),

        // Vertical blue benchmark line at Verbose total ($0.01184)
        dashedRule(verbEnd, -135, verbEnd, 200, ROLE.verbose, { width: 2.8, opacity: a }),
        txt(
          `Verbose total: ${usd(WRAP_BASELINE.spend, 5)}`,
          verbEnd,
          -155,
          26,
          ROLE.verbose,
          'mono',
        ).opacity(a),

        // Row 1: Verbose (V-A1 + V-B1)
        txt('VERBOSE', -860, -45, 32, ROLE.verbose, 'mono', 'left').opacity(a),
      ];

      WRAP_BASELINE.receipts.forEach((rec, i) => {
        const w = rec.costMicro * scale;
        const cx = barLeft + i * w + w * 0.5;
        nodes.push(
          rect(w - 8, 86, { fill: '#112545', stroke: ROLE.verbose, width: 2.6, radius: 10 })
            .at(cx, -45)
            .glow(8, ROLE.verbose)
            .opacity(a),
          txt(`${rec.id} accept`, cx, -45, 28, ROLE.verbose, 'mono').opacity(a),
        );
      });

      // Row 2: Concise (C-A1 + C-B2 accepted, then pink C-B1 failure slides in past Verbose!)
      nodes.push(txt('CONCISE', -860, 118, 32, ROLE.ok, 'mono', 'left').opacity(a));

      const ordered = [WRAP_ATTEMPTS[0], WRAP_ATTEMPTS[2], WRAP_ATTEMPTS[1]];
      ordered.forEach((rec, i) => {
        const w = rec.costMicro * scale;
        const frac = i === 2 ? cp : 1;
        if (frac > 0.02) {
          const drawW = (w - 8) * frac;
          const col = rec.accepted ? ROLE.ok : ROLE.fail;
          const fill = rec.accepted ? '#0d2620' : '#3a1326';
          nodes.push(
            rect(drawW, 86, { fill, stroke: col, width: 2.8, radius: 10 })
              .at(barLeft + i * w + drawW * 0.5, 118)
              .glow(i === 2 ? 12 : 8, col)
              .opacity(a),
          );
          if (frac > 0.7) {
            nodes.push(
              txt(
                `${rec.id} ${rec.accepted ? 'accept' : 'FAIL'}`,
                barLeft + i * w + w * 0.5,
                118,
                28,
                col,
                'mono',
              ).opacity(a),
            );
          }
        }
      });

      // Per-accepted-task division readouts (no brief transient placeholder string)
      if (cp > 0.25) {
        nodes.push(
          txt(
            `Concise: ${usd(WRAP_CONCISE.spend, 5)} / 2 = ${usd(WRAP_CONCISE.costPerAccepted, 6)} per accepted task`,
            -860,
            292,
            34,
            ROLE.fail,
            'mono',
            'left',
          )
            .glow(7, ROLE.fail)
            .opacity(cp * a),
        );
      }
      nodes.push(
        txt(
          `Verbose: ${usd(WRAP_BASELINE.spend, 5)} / 2 = ${usd(WRAP_BASELINE.costPerAccepted, 6)} per accepted task  (WINS)`,
          -860,
          365,
          32,
          ROLE.verbose,
          'mono',
          'left',
        )
          .glow(6, ROLE.verbose)
          .opacity(Math.max(0.25, cp) * a),
      );

      return group(...nodes);
    },
  );

  s.add(sceneAura, header, mode0, mode1);
  driftValue(s, c, pulseT, 4.0, { startOffset: 0.1, endMargin: 0.5 });

  c.on('payoff-receipts', () => {
    const t = c.cue('payoff-receipts').start;
    s.play(showRec.to(1, { duration: clampDur(c, t, 0.7) }));
  });
  c.on('payoff-group-tasks', () => {
    const t = c.cue('payoff-group-tasks').start;
    s.play(groupTasks.to(1, { duration: clampDur(c, t, 0.6) }));
  });
  c.onBeat(2, () => {
    const t = c.beats[2].start;
    s.play(showVerbosePrompt.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.onBeat(3, () => {
    const t = c.beats[3].start;
    s.play(mode.to(1, { duration: clampDur(c, t, 0.35) }));
  });
  c.on('payoff-compare', () => {
    const t = c.cue('payoff-compare').start;
    s.play(compareProg.to(1, { duration: clampDur(c, t, 0.65) }));
  });
}
