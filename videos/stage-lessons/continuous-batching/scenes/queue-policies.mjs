// Scene 06: queue-policies: FCFS (mean 60) vs SJF (mean 35) on 75-step ruler + starvation / aging / priority convention.
import {
  COSMOS,
  FCFS_RES,
  ROLE,
  SJF_RES,
  aura,
  group,
  guardedDynamic,
  heroTitle,
  playCue,
  rect,
  txt,
} from '../parts.mjs';

export default function queuePolicies(s, c) {
  const showSjf = s.value(0);
  const showTail = s.value(0);
  const showPriority = s.value(0);

  const bgAura = aura(0, 0, 740, '#14335c28', '#2a183422');
  const title = heroTitle(['A Shorter Mean Can', 'Conceal Starvation'], {
    x: -855,
    y: -430,
    size: 52,
    lineHeight: 60,
    accent: ROLE.d,
  });

  const stageVis = s.value(1);
  const layer = guardedDynamic(stageVis, (alpha) => {
    const sjf = showSjf.value;
    const tl = showTail.value;
    const pr = showPriority.value;

    const x0 = -780;
    const totalW = 1280;
    const scale = totalW / 75;

    function drawStrip(y, label, res, op) {
      const items = [txt(label, x0, y - 58, 28, COSMOS.ink, 'mono', 'left').opacity(op)];
      res.rows.forEach((r) => {
        const segW = r.steps * scale;
        const cx = x0 + (r.start + r.steps * 0.5) * scale;
        items.push(
          rect(segW - 6, 62, { fill: '#14233d', stroke: r.color, width: 2.8, radius: 8 })
            .at(cx, y)
            .opacity(op),
          txt(
            r.steps >= 15 ? `${r.id}` : `${r.steps}`,
            cx,
            y,
            26,
            r.color,
            'mono',
            'center',
          ).opacity(op),
          txt(
            `${r.finish}`,
            x0 + r.finish * scale,
            y + 52,
            26,
            COSMOS.muted,
            'mono',
            'center',
          ).opacity(op),
        );
      });
      items.push(
        txt(`Mean = ${res.mean}`, x0 + totalW + 30, y, 32, ROLE.d, 'mono', 'left').opacity(op),
      );
      return items;
    }

    const nodes = [
      ...drawStrip(-130, 'FCFS (ARRIVAL ORDER: 50 -> 5 -> 20)', FCFS_RES, alpha),
      ...drawStrip(80, 'SHORTEST-FIRST (SJF: 5 -> 20 -> 50)', SJF_RES, alpha * (0.3 + 0.7 * sjf)),

      txt(
        pr > 0.3
          ? 'Aging + reserved turns protect older jobs; check priority sign (vLLM: smaller = more urgent)'
          : tl > 0.3
            ? 'Steady stream of short jobs starves long jobs under SJF: always track p99 & max wait!'
            : 'Same total finish (75 steps), but reordering dropped mean finish from 60 to 35',
        0,
        295,
        28,
        pr > 0.3 ? ROLE.ok : tl > 0.3 ? ROLE.warn : ROLE.a,
        'sans',
        'center',
      ).opacity(alpha),
    ];

    return group(...nodes);
  });

  s.add(bgAura, title, layer);
  playCue(s, c, 'queue-policies-b1', (d) => s.play(showSjf.to(0, { duration: d })));
  playCue(s, c, 'queue-fcfs', (d) => s.play(showSjf.to(0, { duration: d })));
  playCue(s, c, 'queue-sjf', (d) => s.play(showSjf.to(1, { duration: d })));
  playCue(s, c, 'queue-policies-b2', (d) => s.play(showTail.to(1, { duration: d })));
  playCue(s, c, 'queue-policies-b3', (d) => s.play(showPriority.to(1, { duration: d })));
}
