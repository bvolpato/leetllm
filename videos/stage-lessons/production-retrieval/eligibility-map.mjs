import { axes, dot, line, place, polygon, to } from 'vizmatic/stage';
import { note } from '../kit-narrated.mjs';
import { RULE } from './parts.mjs';

// Magnify the corner of the policy window so a one-day or one-hour change is visible.
export function eligibilityMap(room, days, hours) {
  const [verticalTitle, plotRoom, horizontalTitle] = room.rows([1, 7, 1], 'tight');
  const chart = place(axes({
    x: [9, 17], y: [45, 51], xStep: 1, yStep: 1,
    width: plotRoom.width - 118, height: plotRoom.height - 66,
    labelSize: 32, grid: true, tips: false,
  }), plotRoom);
  const signalLabel = place(note('Risk signal age (hours)', { color: 'ink' }), verticalTitle, 'left');
  const ageLabel = place(note('Time since key became stale (days)', { color: 'ink' }), horizontalTitle);
  const [left] = chart.xRange;
  const [bottom] = chart.yRange;
  const corner = chart.world(RULE.days, RULE.hours);
  const lowerEdge = chart.world(RULE.days, bottom);
  const leftEdge = chart.world(left, RULE.hours);
  const edgeStyle = { stroke: 'cyan', width: 6 };
  const dayEdge = line(lowerEdge, corner, edgeStyle);
  const hourEdge = line(leftEdge, corner, edgeStyle);
  const area = polygon([chart.world(left, bottom), lowerEdge, corner, leftEdge], { fill: 'cyan', stroke: null }).opacity(0.17);
  const point = dot(15, 'yellow').stroke('ink', 3).moveTo(chart.world(days, hours)).zIndex(1);

  return {
    axes: [chart, signalLabel, ageLabel],
    limits: [area, dayEdge, hourEdge],
    point,
    move(staleDays, signalHours) {
      return to(point, (node) => node.moveTo(chart.world(staleDays, signalHours)), { duration: 0.7 });
    },
  };
}
