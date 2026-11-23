import { catalogSlip } from '../catalog-slip.mjs';
import { connector, text } from '../defaults.mjs';

const id = 'resolve-identity';
export function drawResolveIdentity(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const after = (name) => cue(name)?.phase === 'after';
  const typed = after('typed');
  const joined = cue('join')?.progress ?? 0;
  const write = (s, x, y, z, col) => text(ctx, api, id, s, x, y, z, col);
  api.focus.target(id + '-lookup', () => {
    catalogSlip(ctx, api, id, {
      id: 'incoming',
      x: 120,
      y: 446,
      label: 'Incoming link   /   Endpoint',
      title: typed ? 'River Walk, revised edition' : 'River Walk',
      detail: typed ? 'Type    ·    Book' : 'Type    ·    missing',
      color: C.blue,
    });
    catalogSlip(ctx, api, id, {
      id: 'book',
      x: 1140,
      y: 290,
      label: 'Book',
      title: 'River Walk',
      detail: 'book:river',
      color: C.cyan,
    });
    catalogSlip(ctx, api, id, {
      id: 'park',
      x: 1140,
      y: 631,
      label: 'Place',
      title: 'River Walk',
      detail: 'place:river',
      color: C.muted,
    });
    if (joined > 0) connector(ctx, api, 790, 536, 1120, 401, joined, C.cyan);
    const label =
      joined > 0
        ? 'Reviewed alias maps to book:river.'
        : typed
          ? 'Review the edition alias.'
          : after('hold')
            ? 'Ambiguous endpoint. Hold the link.'
            : 'Where can this link be stored?';
    write(label, 120, 910, 44, joined > 0 ? C.cyan : C.yellow);
  });
}
export default {
  id,
  draw: drawResolveIdentity,
  cues: ['ambiguous', 'hold', 'typed', 'join'].map((name) => id + '-' + name),
};
