import { sentenceCounts } from '../fixtures.mjs';
import {
  constructionCell,
  constructionLine,
  constructionNote,
  constructionText,
} from '../defaults.mjs';
export function drawNetworkControls(ctx, scene, state, api) {
  api.focus.target('pl-network-controls-trace', () => {
    const { C, components: c } = api,
      b = state.beat,
      beatP = state.beatP ?? 0;
    const op = (beat, sentence) => {
      if (
        !sentenceCounts['network-controls'] ||
        sentence < 0 ||
        sentence >= sentenceCounts['network-controls'][beat]
      )
        throw Error('Invalid placement sentence network-controls/' + beat + '/' + sentence);
      if (b > beat) return 1;
      if (b < beat) return 0;
      return state.cues
        ? api.focus.progress(`pl-${'network-controls'}-${beat}-${sentence}`, 0)
        : Math.max(0, Math.min(1, beatP * sentenceCounts['network-controls'][beat] - sentence));
    };
    const done = (beat, sentence) => op(beat, sentence) >= 1;
    {
      if (b === 0) {
        constructionText(ctx, api, 'Restarted no-cloud setting', 150, 285, 34, C.yellow);
        const names = ['Cloud model', 'Web search', 'Registry', 'Tools', 'Logs'];
        names.forEach((v, i) => {
          const x = 150 + i * 330;
          constructionCell(ctx, api, v, x, 440, 280, 100, i < 2 ? C.muted : C.cyan);
          constructionText(
            ctx,
            api,
            i < 2 ? 'disabled' : 'separate policy',
            x + 140,
            660,
            27,
            i < 2 ? C.muted : C.yellow,
            'center',
          );
        });
        constructionNote(ctx, api, 'Authenticate callers and enforce their document permissions.');
      } else if (b === 1) {
        constructionText(ctx, api, 'Actual outbound path to inspect', 150, 285, 34, C.cyan);
        const nodes = [
          ['Assistant', 160, 480],
          ['Internal relay', 760, 480],
          ['External destination', 1360, 480],
        ];
        nodes.forEach(([v, x, y]) =>
          constructionCell(ctx, api, v, x, y, 400, 100, x > 1000 ? C.pink : C.cyan),
        );
        constructionLine(ctx, api, 570, 530, 740, 530, C.yellow);
        if (op(1, 2) > 0) constructionLine(ctx, api, 1170, 530, 1340, 530, C.pink);
        if (done(1, 1)) constructionText(ctx, api, 'Generated curl text', 150, 740, 31, C.muted);
        if (done(1, 1))
          constructionText(
            ctx,
            api,
            'Effect occurs only when a tool runner executes',
            150,
            830,
            32,
            C.yellow,
          );
        constructionNote(ctx, api, 'Check where the relay sends the incident log.');
      } else {
        constructionText(
          ctx,
          api,
          'Controlled failure   ·   incident data stays inside the approved network',
          150,
          285,
          32,
          C.pink,
        );
        constructionCell(ctx, api, 'Local worker unavailable', 150, 420, 660, 110, C.pink);
        const repair = op(2, 1);
        constructionCell(
          ctx,
          api,
          'Approved local documentation',
          980,
          420,
          760,
          110,
          repair ? C.green : C.muted,
        );
        constructionCell(
          ctx,
          api,
          'Human escalation',
          980,
          650,
          760,
          110,
          repair ? C.green : C.muted,
        );
        if (repair) constructionLine(ctx, api, 820, 475, 960, 475, C.green);
        if (done(2, 3))
          constructionText(
            ctx,
            api,
            'Record attempted connections, denials and the fallback received.',
            150,
            875,
            32,
            C.green,
          );
      }
    }
  });
}
export default {
  id: 'network-controls',
  draw: drawNetworkControls,
  cues: [
    'pl-network-controls-0-0',
    'pl-network-controls-0-1',
    'pl-network-controls-0-2',
    'pl-network-controls-0-3',
    'pl-network-controls-0-4',
    'pl-network-controls-1-0',
    'pl-network-controls-1-1',
    'pl-network-controls-1-2',
    'pl-network-controls-1-3',
    'pl-network-controls-2-0',
    'pl-network-controls-2-1',
    'pl-network-controls-2-2',
    'pl-network-controls-2-3',
  ],
};
