import { column, dot, dynamic, line, place, rect } from 'vizmatic/stage';
import { area, label, mono, namedBox, note } from '../kit-narrated.mjs';
import { evidenceValue, gamma, REWARD, returns } from './parts.mjs';

export function sign(value) {
  return value < 0 ? '−' + Math.abs(value) : '+' + value;
}

// Keep the same two rows under the request as rewards arrive and are discounted.
export function routeSlip() {
  const [header, assumptions, columns, ask, review, rule, foot] = area.rows(
    [1.05, 0.8, 0.7, 1.6, 1.6, 0.9, 0.9],
    15,
  );
  const [identity, status] = header.columns([1, 1], 'wide');
  const id = place(mono('09:00   REQ-10234', { color: 'cyan' }), identity, 'left');
  const field = place(
    namedBox('Verified evidence  [ empty ]', {
      width: 655,
      height: 92,
      color: 'yellow',
    }),
    status,
    'right',
  );
  const headings = ['First move', 'Cost now', 'One step later', 'Return at the desk'];
  const cells = (region) => region.columns([1.1, 0.85, 1.25, 1.45], 'normal');
  const headers = cells(columns).map((cell, i) => place(note(headings[i]), cell));
  const rows = [ask, review].map((region, i) => {
    const [action, now, later, total] = cells(region);
    const cost = [REWARD.ask, REWARD.reviewCost][i];
    const next = [REWARD.evidence, REWARD.review][i];
    const color = i ? 'blue' : 'green';
    const divider = line([region.left, region.top], [region.right, region.top], {
      stroke: 'faint',
      width: 2,
    });
    const name = place(label(['Ask for proof', 'Human review'][i], { color }), action);
    const paid = place(mono(sign(cost), { size: 60, color }), now);
    const reward = place(
      column(
        [mono(sign(next), { size: 60, color }), note(['Verified proof', 'Reviewer verifies'][i])],
        { gap: 'tight' },
      ),
      later,
    );
    const open = place(mono('?', { size: 58, color: 'dim' }), total);
    return { divider, name, paid, reward, open, later, total, color, cost, next };
  });
  const certain = place(
    label('Every requester supplies valid proof when asked.', { color: 'green' }),
    assumptions,
  );
  const discount = place(
    mono('One step later × ' + gamma + '     ·     Synthetic reward points'),
    rule,
  );
  const question = place(
    label('Which first move earns the larger return?', { color: 'yellow' }),
    foot,
  );
  const skeleton = [id, field, ...headers, ...rows.map((row) => row.divider)];
  const filled = [
    certain,
    discount,
    ...rows.flatMap((row) => [row.name, row.paid, row.reward, row.open]),
  ];
  return {
    skeleton,
    filled,
    id,
    field,
    rows,
    certain,
    discount,
    question,
    assumptions,
    rule,
    foot,
  };
}

// The array represents probability mass, not observed tickets. A partial mark
// at the exact break-even probability is the corresponding fraction of one percent.
export function probabilityTray(region) {
  const cells = region.rows(10, 9).flatMap((row) => row.columns(10, 10));
  const slips = cells.map((cell) =>
    place(
      rect(cell.width, cell.height, {
        radius: 5,
        fill: 'green',
        stroke: null,
      }),
      cell,
    ),
  );
  function lostMass(percent) {
    return cells.slice(0, Math.ceil(percent)).map((cell, i) => {
      const width = cell.width * Math.min(1, percent - i);
      return rect(width, cell.height, { radius: 5, fill: 'pink', stroke: null }).moveTo([
        cell.left + width / 2,
        cell.cy,
      ]);
    });
  }
  return { slips, cells, lostMass };
}

export function modelMix(percent) {
  const replyShare = (100 - percent) / 100;
  const leaveShare = percent / 100;
  return `${Number(replyShare.toFixed(4))} × ${returns.evidence} + ${Number(leaveShare.toFixed(4))} × (−54)`;
}

// The review tick spans the two lanes. A verdict or a question can change
// without moving that benchmark. The evidence mark always has its own lane.
export function returnRuler(region, min, max, ticks) {
  const left = region.left + 82;
  const right = region.right - 82;
  const x = (value) => left + ((right - left) * (value - min)) / (max - min);
  const y = region.cy;
  const axis = line([left, y], [right, y], { stroke: 'faint', width: 5 });
  const ticksAndLabels = ticks.flatMap((value) => [
    line([x(value), y], [x(value), y + 10], { stroke: 'dim', width: 3 }),
    mono(String(value), { size: 30, color: 'dim' }).moveTo([x(value), y + 36]),
  ]);
  const boundary = line([x(returns.review), y - 65], [x(returns.review), y + 9], {
    stroke: 'blue',
    width: 4,
    dash: [9, 6],
  });
  const review = label('Review  ' + returns.review, { color: 'blue', size: 37 }).moveTo([
    x(returns.review),
    y + 86,
  ]);
  return {
    nodes: [axis, ...ticksAndLabels],
    fixed: [boundary, review],
    point: (value) => [x(value), y - 17],
  };
}

export function riskDesk(s, { initial, min, max, ticks }) {
  const [body, foot] = area.rows([7, 1], 'wide');
  const [traySide, scores] = body.columns([4, 5], 'loose');
  const [trayTitle, trayArea, legend] = traySide.rows([1, 5.7, 1.2], 'normal');
  const [scaleTitle, arithmetic, scaleArea] = scores.rows([1, 2.6, 3.9], 'normal');
  const tray = probabilityTray(trayArea.inset(16));
  const p = s.value(initial);
  const lost = dynamic(() => tray.lostMass(p.value));
  const formatShare = (value) => Number(value.toFixed(2)) + '%';
  const shares = dynamic(
    () =>
      place(
        column(
          [
            label(formatShare(100 - p.value) + ' verified reply', { color: 'green', size: 38 }),
            label(formatShare(p.value) + ' leave', { color: 'pink', size: 38 }),
          ],
          { gap: 'tight' },
        ),
        legend,
      ).nodes,
  );
  const trayLabel = place(label('Chance after asking for proof'), trayTitle);
  const scaleLabel = place(label('Expected return at the desk'), scaleTitle);
  const ruler = returnRuler(scaleArea, min, max, ticks);
  const marker = dynamic(() => {
    const value = evidenceValue(p.value / 100);
    const [x, y] = ruler.point(value);
    return [
      dot(14, 'green').moveTo([x, y]),
      mono('Ask  ' + Number(value.toFixed(2)), { color: 'green', size: 40 }).moveTo([x, y - 80]),
    ];
  });
  return {
    p,
    tray,
    arithmetic,
    foot,
    marker,
    ruler,
    fixed: ruler.fixed,
    shares,
    nodes: [tray.slips, lost, shares, trayLabel, scaleLabel, ruler.nodes],
  };
}
