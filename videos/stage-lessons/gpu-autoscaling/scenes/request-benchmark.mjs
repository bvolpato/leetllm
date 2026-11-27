// Scene 12: request-benchmark - Freeze arrivals, lengths and quality before measuring capacity
// Luminous 60% / 25% / 15% workload spectrum, bounded harness queue gate, and frozen revision lock.
import { group, rect } from 'vizmatic/stage';
import {
  COSMOS,
  ROLE,
  aura,
  beamWithPhotons,
  cinemaHeader,
  glowDot,
  guardedDynamic,
  tweenOn,
  txt,
} from '../parts.mjs';

export default function requestBenchmark(s, c) {
  const step = s.value(0); // 1=60/25/15 mix, 2=warmup+bounded client queue, 3=revision & correctness lock

  const header = cinemaHeader(
    'BENCHMARK REPRODUCIBILITY',
    'Freeze arrivals, lengths',
    '& quality first',
    {
      x: -860,
      y: -420,
      accent: ROLE.active,
      size: 52,
    },
  );

  const bgAura = aura(120, 40, 660, '#5ce1e61c', '#a78bfa1a');

  const dyn = guardedDynamic(
    () => 1,
    () => {
      const st = step.value;
      const nodes = [];

      // Full-bleed luminous segmented workload bar: 60% Interactive / 25% Long Review / 15% Background
      const barY = -125;
      const x0 = -840;
      const totalW = 1680;
      const segs = [
        { name: 'Interactive 60%', share: 0.6, col: ROLE.active },
        { name: 'Long Review 25%', share: 0.25, col: ROLE.cold },
        { name: 'Background 15%', share: 0.15, col: ROLE.decode },
      ];
      let cursor = x0;
      nodes.push(
        txt('REPRESENTATIVE INCIDENT TRACE MIX', -840, barY - 76, 26, ROLE.focus, 'mono', 'left'),
      );
      for (const seg of segs) {
        const w = totalW * seg.share - 10;
        const cx = cursor + w * 0.5;
        nodes.push(
          rect(w, 66, { fill: '#111d36', stroke: seg.col, width: 2.8, radius: 12 })
            .at(cx, barY)
            .glow(8, seg.col),
          txt(seg.name, cx, barY + 62, 26, seg.col, 'mono'),
        );
        cursor += totalW * seg.share;
      }

      // Trace attributes flowing into harness gate
      const flowY = 92;
      const stages = [
        {
          x: -690,
          title: 'Trace Spec',
          sub: 'arrivals · prefixes',
          col: ROLE.active,
          on: st >= 0.4,
        },
        { x: -230, title: 'Warm Engine', sub: 'declared rule', col: ROLE.warmup, on: st >= 1.5 },
        {
          x: 230,
          title: 'Bounded Queue',
          sub: 'send lag · rejects',
          col: ROLE.focus,
          on: st >= 1.5,
        },
        { x: 690, title: 'Quality Gate', sub: 'schema · citations', col: ROLE.warm, on: st >= 2.5 },
      ];
      for (let i = 0; i < stages.length; i++) {
        const sg = stages[i];
        const op = sg.on ? 1 : 0.32;
        if (i < stages.length - 1) {
          nodes.push(
            beamWithPhotons(
              [
                [sg.x + 150, flowY],
                [stages[i + 1].x - 150, flowY],
              ],
              sg.col,
              0,
              { width: 3.2, glow: sg.on ? 8 : 0, photonCount: 1, alpha: op },
            ),
          );
        }
        nodes.push(
          glowDot(sg.x, flowY, { radius: 13, color: sg.col, glow: 14, opacity: op }),
          txt(sg.title, sg.x, flowY - 46, 28, sg.col, 'mono').opacity(op),
          txt(sg.sub, sg.x, flowY + 46, 26, COSMOS.ink, 'sans').opacity(op),
        );
      }

      // Lower bound / revision readout
      if (st >= 2.5) {
        nodes.push(
          txt(
            'Pin GPU topology · engine · model · tokenizer · driver · precision · equal baseline tuning',
            0,
            262,
            26,
            ROLE.warm,
            'mono',
          ).glow(5, ROLE.warm),
          txt(
            'A faster run that breaks schema or citations changed the task',
            0,
            345,
            30,
            ROLE.focus,
            'sans',
          ).glow(6, ROLE.focus),
        );
      } else if (st >= 1.5) {
        nodes.push(
          txt(
            'Unbounded client queues distort later latency tails: retain send lag, 429s & timeouts',
            0,
            290,
            28,
            ROLE.warmup,
            'sans',
          ).glow(5, ROLE.warmup),
        );
      } else {
        nodes.push(
          txt(
            'Identical short prompts hide prefill contention, prefix misses & stream tails',
            0,
            290,
            28,
            COSMOS.muted,
            'sans',
          ),
        );
      }

      return group(...nodes);
    },
  );

  s.add(bgAura, header, dyn);

  tweenOn(s, c, 'ga-request-benchmark-b0', step, 1, 0.35);
  tweenOn(s, c, 'ga-request-benchmark-b1', step, 2, 0.35);
  tweenOn(s, c, 'ga-request-benchmark-b2', step, 3, 0.35);
}
