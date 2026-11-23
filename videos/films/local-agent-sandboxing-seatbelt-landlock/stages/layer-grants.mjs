import { cueComplete, cueProgress } from '../construction.mjs';
import { layeredWrite } from '../model.mjs';

export default {
  id: 'layer-grants',
  cues: [
    'grant-project',
    'grant-add-read',
    'grant-predict',
    'grant-stays',
    'grant-narrow',
    'grant-mount',
  ],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const roots = ['src', 'out', '.git'];
    const grant = cueProgress(state, 'grant-project', 0, 0.06, 0.32);
    const read = cueProgress(state, 'grant-add-read', 0, 0.36, 0.64);
    const replaced = cueComplete(state, 'grant-narrow', 1, 0.75);
    const result = cueComplete(state, 'grant-stays', 1, 0.22);
    const mountReady = cueComplete(state, 'grant-mount', 2, 0.37);
    const { broad, narrow, metadataReadOnly } =
      state.beat === 2
        ? { broad: true, narrow: false, metadataReadOnly: mountReady }
        : { broad: !replaced, narrow: replaced, metadataReadOnly: false };
    const columns = [132, 688, 1244];
    const width = 510;
    const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
    const band = (x, y, w, h, color) => api.rect(ctx, x, y, Math.max(2, w), h, color, undefined, 3);
    api.focus.target('grant-footprint', () => {
      label('/workspace', 132, 291, 57);
      label(broad ? 'Project-wide write grant' : 'Two subtree write grants', 132, 384, 37, C.blue);
      if (broad && grant > 0) band(132, 414, 1622 * grant, 28, C.blue);
      if (narrow) columns.slice(0, 2).forEach((x) => band(x, 414, width, 28, C.blue));
      for (const [i, dir] of roots.entries()) {
        const x = columns[i];
        api.rect(ctx, x, 490, width, 155, C.panel, C.muted, 8);
        label(dir + '/', x + 28, 556, 48);
        label(['report.txt', 'test.log', 'config'][i], x + 31, 612, 33, C.muted);
      }
    });
    api.focus.target('child-grant', () => {
      if (read > 0) band(columns[2], 681, width * read, 16, metadataReadOnly ? C.yellow : C.cyan);
      label(
        metadataReadOnly
          ? 'Read-only mount'
          : read > 0
            ? 'Read grant in this layer'
            : 'Repository metadata',
        columns[2],
        749,
        34,
        metadataReadOnly ? C.yellow : C.cyan,
      );
    });
    api.focus.target('write-result', () => {
      if (result) {
        roots.forEach((dir, i) => {
          const allowed = layeredWrite('/workspace/' + dir + '/probe', {
            broad,
            narrow,
            metadataReadOnly,
          });
          label(
            allowed ? 'Write allowed' : 'Write denied',
            columns[i] + 24,
            864,
            40,
            allowed ? C.green : C.pink,
          );
        });
      } else label('Can the worker still write .git/config?', 132, 864, 44, C.yellow);
    });
    label(
      metadataReadOnly
        ? 'An independent read-only mount limits the effective grant.'
        : replaced
          ? 'Build a fresh ruleset with only the two needed write grants.'
          : 'Within a Landlock layer, each matching rule can add a right.',
      132,
      989,
      35,
      C.muted,
    );
  },
};
