// Scene 17: Depth splitting moves activations between stages (GPipe vs 1F1B 2-stage pipeline, then 2 vs 4 microbatches shrinking bubble share).
import { group } from 'vizmatic/stage';
import {
  COSMOS,
  PIPE_2_1F1B,
  PIPE_2_FWD,
  PIPE_2_GPIPE,
  PIPE_4_FWD,
  ROLE,
  aura,
  glassCell,
  guardedDynamic,
  heroTitle,
  rect,
  remainDuration,
  txt,
} from '../parts.mjs';

export default function pipelineSchedule(s, c) {
  const mode = s.value(0); // 0=2mb forward, 1=GPipe vs 1F1B compare, 2=2mb bubble, 3=4mb smaller bubble

  const bgAura = aura(0, 20, 620, '#a78bfa1e', '#5ce1e618');
  const title = heroTitle(['Depth Splitting Moves', 'Activations Across Stages'], {
    x: -855,
    y: -415,
    size: 52,
    lineHeight: 62,
    accent: ROLE.grad,
    eyebrow: 'TORCH.DISTRIBUTED.PIPELINING · GPIPE VS 1F1B',
  });

  const live = guardedDynamic(1, () => {
    const m = Math.round(mode.value);
    const nodes = [];

    const drawGrid = (sched, x0, y0, cellW, cellH, label, labelCol) => {
      nodes.push(txt(label, x0 + sched.ticks * cellW * 0.5, y0 - 46, 26, labelCol, 'mono'));
      for (let st = 0; st < 2; st++) {
        const cy = y0 + st * (cellH + 14) + cellH * 0.5;
        nodes.push(txt(`S${st}`, x0 - 44, cy, 26, COSMOS.muted, 'mono'));
        for (let t = 0; t < sched.ticks; t++) {
          const cx = x0 + t * cellW + cellW * 0.5;
          nodes.push(
            rect(cellW - 8, cellH, {
              fill: '#0a101d',
              stroke: COSMOS.dim,
              width: 1.5,
              radius: 8,
              dash: [6, 6],
            }).at(cx, cy),
          );
        }
      }
      sched.work.forEach((w) => {
        const cx = x0 + w.start * cellW + cellW * 0.5;
        const cy = y0 + w.stage * (cellH + 14) + cellH * 0.5;
        const isB = w.kind === 'B';
        const col = isB ? ROLE.bad : ROLE.orig;
        nodes.push(
          rect(cellW - 8, cellH, {
            fill: isB ? '#2d1226' : '#112545',
            stroke: col,
            width: 2.6,
            radius: 8,
          })
            .at(cx, cy)
            .glow(6, col),
          txt(`${w.kind}${w.mb}`, cx, cy, 26, COSMOS.ink, 'mono'),
        );
      });
    };

    if (m === 1) {
      // Compare GPipe vs 1F1B side by side
      drawGrid(PIPE_2_GPIPE, -760, -125, 118, 72, 'GPIPE (all Fwd before Bwd)', ROLE.trans);
      drawGrid(PIPE_2_1F1B, 90, -125, 118, 72, '1F1B (alternates ready Bwd)', ROLE.good);
    } else if (m >= 2) {
      // Compare 2 microbatches vs 4 microbatches forward bubble share
      drawGrid(
        PIPE_2_FWD,
        -730,
        -125,
        190,
        78,
        `2 MICROBATCHES: ${PIPE_2_FWD.idle}/${PIPE_2_FWD.total} idle (33%)`,
        ROLE.bad,
      );
      drawGrid(
        PIPE_4_FWD,
        60,
        -125,
        145,
        78,
        `4 MICROBATCHES: ${PIPE_4_FWD.idle}/${PIPE_4_FWD.total} idle (20%)`,
        m >= 3 ? ROLE.good : COSMOS.dim,
      );
    } else {
      // Beat 0: 2 stages streaming forward activations
      drawGrid(
        PIPE_2_FWD,
        -340,
        -125,
        230,
        86,
        '2 PIPELINE STAGES · FORWARD MICROBATCH STREAM',
        ROLE.orig,
      );
    }

    nodes.push(
      glassCell(0, 170, 1520, 148, m >= 3 ? ROLE.good : ROLE.grad, { fill: '#10182b', glow: 7 }),
      txt(
        m === 1
          ? 'Interleaved & looped schedules cut bubbles further · torch.distributed.pipelining is alpha in 2.14'
          : m >= 3
            ? 'More microbatches shrink idle bubble share (33% -> 20%), trading activation memory & scheduling'
            : 'Stage 0 runs microbatch 1 while Stage 1 runs microbatch 0; activations go fwd, grads go bwd',
        0,
        142,
        26,
        COSMOS.ink,
        'sans',
      ),
      txt(
        'Pipeline inter-stage hops are separate from intra-stage tensor-parallel collectives',
        0,
        202,
        26,
        COSMOS.gold,
        'mono',
      ),
    );

    return group(...nodes);
  });

  s.add(bgAura, title, live);

  c.on('pt-pipeline-schedule-0', () => s.play(mode.to(0, { duration: 0.25 })));
  c.on('pt-pipeline-schedule-1', () =>
    s.play(mode.to(1, { duration: remainDuration(c, 'pt-pipeline-schedule-1', 0.45) })),
  );
  c.on('pt-pipeline-schedule-2', () =>
    s.play(mode.to(2, { duration: remainDuration(c, 'pt-pipeline-schedule-2', 0.45) })),
  );
  c.on('four-batches', () =>
    s.play(mode.to(3, { duration: remainDuration(c, 'four-batches', 0.45) })),
  );
}
