// Scene 6: repeatability - Which task passes every time?
// Orbiting 3D Task x Trial Reliability Matrix (`cinematic3d` + `addBox3D` + `orbitScene`)
// on the right showing all 9 independent runs across 3 tasks, paired with per-row
// tallies on the left that strictly withhold 7/9 until `run-rate` and 1/3 until `group-fraction`.
import { group, line, line3d } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  TRIALS,
  addBox3D,
  aura,
  cinemaHeader,
  cinematic3d,
  clampDur,
  glowDot,
  glowMeter,
  guardedDynamic,
  orbitScene,
  txt,
} from '../parts.mjs';

export default function repeatability(s, c) {
  const pulse = s.value(0);
  const catOn = s.value(0);
  const otherOn = s.value(0);
  const runRateOn = s.value(0);
  const askAll = s.value(0);
  const groupMarks = s.value(0);
  const groupFrac = s.value(0);
  const equalWt = s.value(0);

  const header = cinemaHeader('REPEATABILITY MATRIX', 'Which task passes', 'every time?', {
    accent: ROLE.pass,
    size: 50,
  });

  const stageAura = aura(320, 40, 620, '#6ee7b71c', '#5ce1e614');

  // Orbiting 3D 3x3 Task-by-Trial outcome reliability pillars (right side)
  const view3d = cinematic3d({
    theta: -0.78,
    phi: 1.02,
    distance: 13.8,
    unit: 118,
    focus: [0, 0, 0.7],
  }).at(380, 40);

  // Subtle glowing base grid lines for 3 tasks (y) x 3 trials (x)
  for (let i = 0; i <= 3; i++) {
    const pos = -2.25 + i * 1.5;
    view3d.add(
      line3d([-2.25, pos, 0], [2.25, pos, 0], { color: '#334672', width: 1.8, opacity: 0.7 }),
      line3d([pos, -2.25, 0], [pos, 2.25, 0], { color: '#334672', width: 1.8, opacity: 0.7 }),
    );
  }

  // 3D pillars representing the 9 trial outcomes from TRIALS
  TRIALS.forEach((task, rowIdx) => {
    task.pass.forEach((passed, trialIdx) => {
      const x0 = -2.05 + trialIdx * 1.5;
      const y0 = -2.05 + rowIdx * 1.5;
      const h = passed ? 2.15 : 0.68;
      const col = passed ? ROLE.pass : ROLE.fail;
      addBox3D(view3d, x0, y0, 0, 1.1, 1.1, h, col, col, {
        faceOpacity: passed ? 0.76 : 0.86,
        edgeWidth: 2.2,
        edgeGlow: passed ? 8 : 10,
      });
    });
  });

  // Left-side structured task-by-trial ledger (zero boxed cards)
  const leftView = guardedDynamic(
    () => 1,
    () => {
      const co = catOn.value;
      const oo = otherOn.value;
      const rr = runRateOn.value;
      const aa = askAll.value;
      const gm = groupMarks.value;
      const gf = groupFrac.value;
      const ew = equalWt.value;
      const nodes = [];

      nodes.push(
        txt('TASK (3 CLEAN RUNS EACH)', -850, -185, 26, COSMOS.muted, 'mono', 'left'),
        txt('T1', -430, -185, 26, COSMOS.dim, 'mono', 'center'),
        txt('T2', -350, -185, 26, COSMOS.dim, 'mono', 'center'),
        txt('T3', -270, -185, 26, COSMOS.dim, 'mono', 'center'),
        txt(
          gm > 0.35 ? 'ALL-3' : 'ROW',
          -155,
          -185,
          26,
          gm > 0.35 ? ROLE.pass : COSMOS.dim,
          'mono',
          'center',
        ),
        line([-850, -155], [-95, -155], { stroke: '#29385f', width: 2 }),
      );

      TRIALS.forEach((task, idx) => {
        const y = -98 + idx * 92;
        const allPass = task.pass.every(Boolean);
        const rowVis = idx === 0 ? Math.max(0.35, co) : Math.max(0.35, oo);
        const hiRow = gm > 0.35 && allPass;

        nodes.push(
          txt(task.task, -850, y, 30, hiRow ? ROLE.pass : COSMOS.ink, 'sans', 'left')
            .glow(hiRow ? 8 : 0, ROLE.pass)
            .opacity(rowVis),
        );

        task.pass.forEach((ok, j) => {
          const cx = -430 + j * 80;
          const dotCol = ok ? ROLE.pass : ROLE.fail;
          nodes.push(
            glowDot(cx, y, {
              radius: 22,
              color: dotCol,
              glow: ok ? 8 : 11,
              opacity: rowVis,
            }),
            txt(ok ? 'P' : 'F', cx, y, 26, '#070910', 'mono', 'center').opacity(rowVis),
          );
        });

        // Withhold row-level all-3 verdict until `group-checks`!
        if (gm > 0.1) {
          nodes.push(
            txt(
              allPass ? 'PASS' : 'FAIL',
              -155,
              y,
              28,
              allPass ? ROLE.pass : ROLE.fail,
              'mono',
              'center',
            )
              .glow(allPass ? 9 : 6, allPass ? ROLE.pass : ROLE.fail)
              .opacity(gm),
          );
        } else if (aa > 0.2) {
          nodes.push(txt('?', -155, y, 30, ROLE.focus, 'mono', 'center').opacity(aa));
        }
      });

      // Individual run pass rate meter (strictly after `run-rate`)
      if (rr > 0.05) {
        nodes.push(
          txt(
            'INDIVIDUAL RUNS: 7 / 9 PASS (77.8%)',
            -850,
            178,
            28,
            ROLE.read,
            'mono',
            'left',
          ).opacity(rr),
          glowMeter(-850, 218, 690, 22, 7 / 9, { fill: ROLE.read, opacity: rr }),
        );
      }

      // Grouped task-level all-3 meter (strictly after `group-fraction`)
      if (gf > 0.05) {
        nodes.push(
          txt(
            'ALL-3 BY TASK: 1 / 3 EARN THE MARK (33.3%)',
            -850,
            282,
            28,
            ROLE.pass,
            'mono',
            'left',
          )
            .glow(8, ROLE.pass)
            .opacity(gf),
          glowMeter(-850, 322, 690, 22, 1 / 3, { fill: ROLE.pass, opacity: gf }),
        );
      }

      // Equal-weight grouping rule note
      if (ew > 0.1) {
        nodes.push(
          txt(
            'Equal task weight: extra repeats on 1 task still cast 1 vote',
            -850,
            394,
            26,
            ROLE.focus,
            'mono',
            'left',
          ).opacity(ew),
        );
      } else {
        nodes.push(
          txt(
            aa > 0.2 && gm < 0.2
              ? 'Read across each row: which task passed all 3 times?'
              : '3D height: emerald = pass · rose = fail',
            380,
            394,
            26,
            aa > 0.2 && gm < 0.2 ? ROLE.focus : COSMOS.muted,
            'mono',
            'center',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(stageAura, header, view3d, leftView);
  orbitScene(s, c, view3d, { theta: -0.26, phi: 0.94 });

  c.on('repeated-runs', () => {
    s.play(catOn.to(0.6, { duration: clampDur(c, c.cue('repeated-runs').start, 0.35) }));
  });
  c.on('catalog-trials', () => {
    s.play(catOn.to(1, { duration: clampDur(c, c.cue('catalog-trials').start, 0.35) }));
  });
  c.on('other-trials', () => {
    s.play(otherOn.to(1, { duration: clampDur(c, c.cue('other-trials').start, 0.35) }));
  });
  c.after('run-rate', () => {
    s.play(runRateOn.to(1, { duration: clampDur(c, c.cue('run-rate').end, 0.35) }));
  });
  c.on('all-repetitions', () => {
    s.play(askAll.to(1, { duration: clampDur(c, c.cue('all-repetitions').start, 0.35) }));
  });
  c.on('group-checks', () => {
    s.play(groupMarks.to(1, { duration: clampDur(c, c.cue('group-checks').start, 0.4) }));
  });
  c.after('group-fraction', () => {
    s.play(groupFrac.to(1, { duration: clampDur(c, c.cue('group-fraction').end, 0.35) }));
  });
  c.on('task-grouping', () => {
    s.play(equalWt.to(1, { duration: clampDur(c, c.cue('task-grouping').start, 0.4) }));
  });
}
