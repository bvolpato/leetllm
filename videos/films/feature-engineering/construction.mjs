import { cutoff, events, waitTimes } from './fixtures.mjs';
import { quantile } from './arithmetic.mjs';
export const mean = waitTimes.reduce((sum, value) => sum + value, 0) / waitTimes.length;
export const std = Math.sqrt(
  waitTimes.reduce((sum, value) => sum + (value - mean) ** 2, 0) / waitTimes.length,
);
export const median = (waitTimes[3] + waitTimes[4]) / 2;
export const iqr = quantile(0.75) - quantile(0.25);
export const standardFortyTwo = (42 - mean) / std;
export const robustFortyTwo = (42 - median) / iqr;
export const robustOutlier = (12000 - median) / iqr;
export const scaleRows = waitTimes.map((wait, index) => ({
  id: 'J' + (index + 1),
  wait,
  standard: (wait - mean) / std,
  robust: (wait - median) / iqr,
}));
export const smoothed = (1 + 5 * 0.625) / (1 + 5);
export const eligible = events.filter((row) => row.event <= cutoff && row.available <= cutoff);
export const heartbeatAgeHours = (9 * 60 - (8 * 60 + 30)) / 60;
