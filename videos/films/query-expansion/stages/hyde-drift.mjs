import { PROXY_CORPUS } from '../fixtures.mjs';
import { proxyEvidence, search } from '../model.mjs';
import { spoken } from '../construction.mjs';

export function drawHydeDrift(ctx, scene, state, api) {
  const { C, focus } = api;
  const initial = spoken(state, 0, 'hyde-find-policies') === 1;
  const edited = spoken(state, 1, 'hyde-edit-proxy') > 0;
  const scored = initial && (!edited || spoken(state, 2, 'hyde-change-cause') === 1);
  const run = proxyEvidence(edited);
  const previous = proxyEvidence(false);
  const label = (s, x, y, size, color = C.ink, align = 'left') =>
    api.text(ctx, s, x, y, size, color, align);
  label('Generated search text', 135, 249, 30, C.muted);
  focus.target('proxy-clause', () => {
    label('For batch jobs,', 135, 340, 50);
    label(run.proposal, 510, 340, 50, edited ? C.yellow : C.blue);
  });
  label('Source ID', 135, 460, 30, C.muted);
  label('Same indexed words', 510, 460, 30, C.muted);
  label('Matches', 1305, 460, 30, C.muted, 'center');
  label(edited ? 'Old rank' : 'Top 2 rank', 1525, 460, 30, C.muted, 'center');
  if (edited) label('New rank', 1745, 460, 30, C.muted, 'center');
  PROXY_CORPUS.forEach((doc, i) => {
    const y = 564 + i * 127;
    const position = run.hits.findIndex((item) => item.document.id === doc.id);
    const tone = scored && position >= 0 ? C.cyan : C.muted;
    api.line(ctx, 133, y + 39, 1787, y + 39, C.panel, 3);
    label(doc.id, 135, y, 37);
    label(doc.text, 510, y, 34);
    const count = search(run.proxy, [doc])[0]?.score ?? 0;
    label(count, 1305, y, 43, C.ink, 'center');
    if (edited) {
      const oldRank = previous.hits.findIndex((item) => item.document.id === doc.id) + 1;
      label(oldRank ? '#' + oldRank : 'out', 1525, y, 39, C.muted, 'center');
    }
    focus.target('hyde-recovered', () =>
      label(
        scored ? (position < 0 ? 'out' : '#' + (position + 1)) : '?',
        edited ? 1745 : 1525,
        y,
        46,
        tone,
        'center',
      ),
    );
  });
  focus.target('hyde-required-slots', () => {
    const found = run.required.filter((id) => run.hits.some(({ document }) => id === document.id));
    label(
      scored
        ? 'Required policies in top 2     ' + found.length + ' / ' + run.required.length
        : edited
          ? 'Which required policy falls out?'
          : 'Which two pages have the most matching words?',
      960,
      945,
      42,
      C.yellow,
      'center',
    );
  });
  label(
    'Word-overlap example  ·  required pages are quota-policy and batch-policy',
    960,
    1016,
    26,
    C.muted,
    'center',
  );
}
export default {
  id: 'hyde-drift',
  draw: drawHydeDrift,
  cues: ['hyde-find-policies', 'hyde-edit-proxy', 'hyde-change-cause'],
};
