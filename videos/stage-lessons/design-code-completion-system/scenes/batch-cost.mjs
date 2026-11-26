import { group, line, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  cinemaHeader,
  clampDur,
  glowDot,
  guardedDynamic,
  metricReadout,
  txt,
} from '../parts.mjs';

export function buildBatchCost(s, c) {
  s.add(aura(-460, -40, 560, ROLE.gpu, COSMOS.bg));
  s.add(aura(460, 120, 560, ROLE.model, COSMOS.bg));

  s.add(
    cinemaHeader(
      'SHARED-GPU SCHEDULING',
      'Continuous batching under',
      'short-lived cancellable edits',
      {
        x: -860,
        y: -445,
        accent: ROLE.gpu,
        size: 46,
      },
    ),
  );

  const admitNext = s.value(0);
  const costPhase = s.value(0);

  c.on('cc-batch-cost-0', () =>
    s.play(admitNext.to(1, { duration: clampDur(c, c.cue('cc-batch-cost-0').start, 0.7) })),
  );
  c.on('cc-batch-cost-1', () =>
    s.play(costPhase.to(1, { duration: clampDur(c, c.cue('cc-batch-cost-1').start, 0.6) })),
  );

  // Shared GPU slots (3 active lanes showing iteration-level join/leave)
  const x0 = -520;
  const fullW = 1220;

  s.add(
    guardedDynamic(
      () => 1,
      () => {
        const a = admitNext.value;
        const cp = costPhase.value;
        const nodes = [];

        // Slot 1: Long multi-line request runs across the batch
        const y1 = -165;
        nodes.push(txt('SLOT 1 (LONG)', -850, y1, 26, ROLE.gpu, 'mono', 'left'));
        nodes.push(
          rect(fullW, 56, { fill: ROLE.gpu, stroke: null, radius: 6 })
            .at(x0 + fullW * 0.5, y1)
            .opacity(0.85),
        );
        nodes.push(
          txt(
            'MULTI-LINE FIM GENERATION  (PAGED KV BLOCKS)',
            x0 + fullW * 0.5,
            y1,
            26,
            '#050811',
            'mono',
            'center',
          ),
        );

        // Slot 2: Short request finishes -> Waiting request joins immediately (no fixed-batch bubble)
        const y2 = -52;
        const shortW = 410;
        const waitW = 790;
        nodes.push(txt('SLOT 2 (CHURN)', -850, y2, 26, ROLE.ok, 'mono', 'left'));
        nodes.push(
          rect(shortW, 56, { fill: ROLE.ed, stroke: null, radius: 6 })
            .at(x0 + shortW * 0.5, y2)
            .opacity(0.88),
        );
        nodes.push(txt('SHORT REQ DONE', x0 + shortW * 0.5, y2, 26, '#050811', 'mono', 'center'));

        const joinW = Math.max(80, waitW * a);
        nodes.push(
          rect(joinW, 56, { fill: ROLE.ok, stroke: null, radius: 6 })
            .at(x0 + shortW + 18 + joinW * 0.5, y2)
            .glow(8, ROLE.ok)
            .opacity(0.25 + 0.7 * a),
        );
        if (a > 0.45) {
          nodes.push(
            txt(
              'WAITING REQ ADMITTED IMMEDIATELY',
              x0 + shortW + 18 + joinW * 0.5,
              y2,
              26,
              '#050811',
              'mono',
              'center',
            ).opacity(a),
          );
        }

        // Slot 3: Cancelled-in-flight request (work already spent still counts in serving cost!)
        const y3 = 62;
        const cancelW = 540;
        nodes.push(txt('SLOT 3 (CANCEL)', -850, y3, 26, ROLE.fail, 'mono', 'left'));
        nodes.push(
          rect(cancelW, 56, { fill: ROLE.fail, stroke: null, radius: 6 })
            .at(x0 + cancelW * 0.5, y3)
            .opacity(0.85),
        );
        nodes.push(
          txt(
            'SPENT GPU WORK -> CANCELLED',
            x0 + cancelW * 0.5,
            y3,
            26,
            '#050811',
            'mono',
            'center',
          ),
        );
        nodes.push(
          rect(fullW - cancelW - 18, 56, {
            fill: '#0b1224',
            stroke: '#2c3d66',
            width: 2,
            radius: 6,
          }).at(x0 + cancelW + 18 + (fullW - cancelW - 18) * 0.5, y3),
        );
        nodes.push(
          txt(
            'FREED KV  (SPENT WORK IN COST)',
            x0 + cancelW + 18 + (fullW - cancelW - 18) * 0.5,
            y3,
            26,
            ROLE.warn,
            'mono',
            'center',
          ),
        );

        // Divider + serving engine comparison & true cost denominator
        nodes.push(line([-860, 168], [840, 168], { stroke: '#233152', width: 2 }));

        const engineAlpha = 0.35 + 0.65 * cp;
        nodes.push(
          txt('SERVING ENGINES TO BENCHMARK', -840, 232, 26, ROLE.model, 'mono', 'left').opacity(
            engineAlpha,
          ),
        );
        nodes.push(
          glowDot(-825, 294, { radius: 8, color: ROLE.ok, glow: 8, opacity: engineAlpha }),
        );
        nodes.push(
          txt(
            'vLLM  &  SGLang  (same traffic + display policy)',
            -798,
            294,
            26,
            COSMOS.ink,
            'mono',
            'left',
          ).opacity(engineAlpha),
        );
        nodes.push(
          glowDot(-825, 350, { radius: 8, color: COSMOS.muted, glow: 4, opacity: engineAlpha }),
        );
        nodes.push(
          txt(
            'TGI listed in maintenance mode',
            -798,
            350,
            26,
            COSMOS.muted,
            'mono',
            'left',
          ).opacity(engineAlpha),
        );

        nodes.push(
          metricReadout('UNIT ECONOMICS DENOMINATOR', 'COST / RETAINED', 450, 298, {
            color: ROLE.focus,
            size: 42,
          }).opacity(engineAlpha),
        );
        nodes.push(
          txt(
            'INCLUDES CANCELLED + IGNORED WORK',
            450,
            378,
            26,
            ROLE.warn,
            'mono',
            'center',
          ).opacity(engineAlpha),
        );

        return group(...nodes);
      },
    ),
  );
}
