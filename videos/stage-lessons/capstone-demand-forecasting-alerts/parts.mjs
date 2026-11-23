import { assertEqual, dot, group, line, place, rect } from 'vizmatic/stage';
import { area, heading, label, mono } from '../kit-narrated.mjs';
import { actual, baseline, candidate, FIT_ROWS, forecastWeights, fridayFeatures, transferActuals, transferCapacities, transferForecasts } from '../../films/capstone-demand-forecasting-alerts/fixtures.mjs';
import { capacity, capacityBreakdown, featureProducts, forecastComparison, lateLabelMetrics, metrics, peakDiagnostic, signalCounts, validateModel } from '../../films/capstone-demand-forecasting-alerts/model.mjs';

export { actual, area, baseline, candidate, capacity, capacityBreakdown, featureProducts, FIT_ROWS, forecastComparison, forecastWeights, fridayFeatures, lateLabelMetrics, metrics, peakDiagnostic, signalCounts, transferActuals, transferCapacities, transferForecasts };
export const FRIDAY = 4;
export const TOLERANCE = 6;
export const ACCEPTANCE = 0.85;
export const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const residual = i => actual[i] - candidate[i];
validateModel();
assertEqual(featureProducts().forecast.toFixed(3), '163.284', 'Friday point');

export function begin(s, c) {
  const title = heading(c.title);
  s.add(title);
  return title;
}
export const words = (region, value, color = 'ink', size = 42) => place(label(String(value), { color, size }), region);
export const number = (region, value, color = 'cyan', size = 48) => place(mono(String(value), { color, size }), region);
export const stroke = (x1, y1, x2, y2, color, width = 3) => line([x1, y1], [x2, y2], { stroke: color, width });
export const plate = (r, color = 'grid') => rect(r.width, r.height, { fill: 'surface', stroke: color, width: 2 }).moveTo([r.cx, r.cy]);

export function tableRows(region, count, widths) {
  return region.rows(count, 'tight').map(r => r.columns(widths, 'normal'));
}

// The schedule, issued point and later count share one parcel scale.
export function parcelRuler(region, low, high) {
  const [units, plot] = region.rows([1, 6], 'tight');
  const left = plot.left + 120, right = plot.right - 120;
  const x = v => left + (v - low) / (high - low) * (right - left);
  const y = plot.top + plot.height * 0.49;
  const rail = group(
    words(units, 'Requested parcels per day', 'dim', 32),
    stroke(left, y, right, y, 'grid', 5),
    ...[low, high].flatMap(v => [
      stroke(x(v), y - 12, x(v), y + 12, 'dim'),
      mono(String(v), { color: 'dim', size: 28 }).moveTo([x(v), y + 40]),
    ]),
  );
  function pin(value, text, color, side) {
    const stem = side === 'above' ? -1 : 1;
    return group(
      stroke(x(value), y, x(value), y + stem * 65, color),
      dot(10, color).moveTo([x(value), y]),
      label(text, { size: 38, color }).moveTo([x(value), y + stem * 98]),
    );
  }
  const gap = (a, b, color) => stroke(x(a), y, x(b), y, color, 6);
  function band(point, halfWidth) {
    const start = x(Math.max(0, point - halfWidth)), end = x(point + halfWidth);
    return rect(end - start, 32, { fill: 'cyan', stroke: null, opacity: 0.23 }).moveTo([(start + end) / 2, y]);
  }
  return { rail, pin, gap, band, x, y };
}
