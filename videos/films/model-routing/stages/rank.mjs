import { sampleModel } from '../construction.mjs';
import { after } from '../timing.mjs';
import { text } from '../defaults.mjs';

export function drawRank(ctx, scene, state, api) {
  const { C, focus } = api;
  const { byCost, ordered, preference } = sampleModel('rank', state);
  const ask = preference === 'latency';
  const answered = after(state, 'choose-local', 2, 0.17);
  const first = after(state, 'choose-primary', 0, 0.67);
  const chosen = answered ? ordered[0].id : first && !ask ? byCost[0].id : null;
  text(ctx, api, 'Approved lane', 155, 340, 32, C.muted);
  text(ctx, api, 'Estimated cost', 650, 340, 32, ask ? C.muted : C.yellow);
  focus.target('latencies', () =>
    text(ctx, api, 'Expected answer time', 1070, 340, 32, ask ? C.yellow : C.muted),
  );
  byCost.forEach((lane, i) => {
    const y = 460 + i * 145;
    const color = lane.id === chosen ? C.green : C.ink;
    focus.target('choices', () => {
      api.circle(ctx, 165, y - 11, 13, lane.id === chosen ? color : C.panel, color);
      text(ctx, api, lane.id + '   ' + lane.name, 210, y, 37, color);
    });
    focus.target('prices', () =>
      text(ctx, api, '$' + (lane.cost / 1e6).toFixed(5), 660, y, 37, C.ink),
    );
    focus.target('latencies', () => {
      const width = (lane.latency / 1300) * 470;
      api.rect(ctx, 1070, y - 32, width, 31, lane.id === chosen ? C.green : C.blue);
      text(ctx, api, lane.latency.toLocaleString('en-US') + ' ms', 1580, y, 34, C.ink);
    });
  });
  focus.target('choices', () =>
    text(
      ctx,
      api,
      answered
        ? 'D is first by time'
        : ask
          ? 'Which approved lane would you send first for speed?'
          : first
            ? 'C is first by cost'
            : 'Choose on cost',
      960,
      944,
      42,
      ask && !answered ? C.yellow : C.cyan,
      'center',
    ),
  );
}
export default {
  id: 'rank',
  draw: drawRank,
  cues: ['choose-primary', 'measure-local', 'prefer-time', 'choose-local'],
};
