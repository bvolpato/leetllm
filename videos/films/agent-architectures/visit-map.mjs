import { clock } from './arithmetic.mjs';
import { VISIT_HOURS } from './fixtures.mjs';

// Each branch ends at the station named on the journey receipt.
const origin = [250, 545];
const art = [
  [390, 545],
  [620, 315],
  [1240, 315],
];
const history = [
  [515, 545],
  [730, 760],
  [1240, 760],
];
const bus = [
  [405, 545],
  [675, 815],
  [1170, 815],
  [1225, 760],
  [1240, 760],
];

function trace(ctx, api, points, amount, color, width, marker = false) {
  if (amount <= 0 && marker !== 'train') return;
  const lengths = points
    .slice(1)
    .map(([x, y], i) => Math.hypot(x - points[i][0], y - points[i][1]));
  let remaining = lengths.reduce((sum, n) => sum + n, 0) * amount;
  for (const [i, len] of lengths.entries()) {
    const [x, y] = points[i];
    const fraction = Math.min(1, remaining / len);
    const tipX = x + (points[i + 1][0] - x) * fraction;
    const tipY = y + (points[i + 1][1] - y) * fraction;
    if (fraction > 0) api.line(ctx, x, y, tipX, tipY, color, width);
    remaining -= len;
    if (remaining <= 0.001) {
      if (marker === 'train') {
        api.rect(ctx, tipX - 43, tipY - 54, 86, 35, color, undefined, 8);
        for (const dx of [-29, -5, 19]) {
          api.rect(ctx, tipX + dx, tipY - 46, 13, 12, api.C.bg, undefined, 2);
        }
        for (const dx of [-24, 24]) api.circle(ctx, tipX + dx, tipY - 16, 7, color);
      } else if (marker && amount < 1) api.circle(ctx, tipX, tipY, 14, color);
      break;
    }
  }
}

function station(ctx, api, x, y, color) {
  api.circle(ctx, x, y, 22, api.C.bg, color, 7);
  api.circle(ctx, x, y, 7, color);
}

export function visitMap(
  ctx,
  api,
  {
    artAmount = 1,
    artTrain,
    showTask = true,
    artClosed = true,
    artQuiet = true,
    artLabel = 'Train to Art',
    historyShown = true,
    hoursKnown = false,
    historyNote = '',
    trainAmount = 0,
    busAmount = 0,
    busLabel = '',
    cancelled = false,
    retainHours = false,
    routeLabel = '',
    question = '',
    questionColor = api.C.ink,
  },
) {
  const { C } = api;
  const artColor = artQuiet ? C.muted : C.blue;
  api.focus.target('task', () => {
    if (!showTask) return;
    api.text(ctx, 'Today’s visit', 140, 236, 29, C.muted);
    api.text(ctx, '90 minutes inside   /   Finish by 17:00', 390, 236, 35, C.yellow);
  });
  api.focus.target('art-route', () => {
    trace(ctx, api, [origin, ...art], artAmount, artColor, 9, true);
    if (artTrain !== undefined) trace(ctx, api, [origin, ...art], artTrain, artColor, 9, 'train');
    if (artAmount > 0) api.text(ctx, artLabel, 890, 377, 32, artColor, 'center');
  });
  api.focus.target('art-stop', () => {
    station(ctx, api, 1240, 315, artClosed ? C.pink : artColor);
    api.text(ctx, 'Art Museum', 1300, 330, 44, C.ink);
    if (artClosed) api.text(ctx, 'Gallery closed today', 1300, 386, 32, C.pink);
  });
  api.focus.target('history-route', () => {
    if (historyShown) {
      // A different destination has no route until transit returns one.
      api.line(ctx, 1100, 760, 1207, 760, C.muted, 3);
      if (routeLabel)
        api.text(ctx, routeLabel, 910, 689, 33, cancelled ? C.pink : C.cyan, 'center');
    }
    if (trainAmount > 0) {
      trace(ctx, api, [origin, ...history], trainAmount, cancelled ? C.muted : C.cyan, 10, true);
      if (cancelled) {
        api.rect(ctx, 944, 744, 42, 32, C.bg, undefined, 0);
        api.line(ctx, 944, 742, 982, 778, C.pink, 7);
        api.line(ctx, 944, 778, 982, 742, C.pink, 7);
      }
    }
    if (busAmount > 0) trace(ctx, api, [origin, ...bus], busAmount, C.blue, 9, true);
    if (busLabel) api.text(ctx, busLabel, 910, 875, 32, C.blue, 'center');
  });
  api.focus.target('history-stop', () => {
    if (historyShown) {
      station(ctx, api, 1240, 760, retainHours ? C.green : C.ink);
      api.text(ctx, 'History Museum', 1300, 772, 44, C.ink);
      if (hoursKnown) {
        api.text(
          ctx,
          clock(VISIT_HOURS.opens) + ' to ' + clock(VISIT_HOURS.closes),
          1300,
          828,
          35,
          retainHours ? C.green : C.ink,
        );
        api.text(ctx, VISIT_HOURS.id + '  /  today', 1300, 874, 26, C.muted);
      } else if (historyNote) api.text(ctx, historyNote, 1300, 829, 31, C.yellow);
    }
  });
  station(ctx, api, ...origin, C.ink);
  api.text(ctx, 'Station', 250, 480, 38, C.ink, 'center');
  api.focus.target('map-question', () => {
    if (question) api.text(ctx, question, 960, 996, 39, questionColor, 'center');
  });
}
