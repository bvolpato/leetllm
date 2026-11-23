import { spoken } from '../construction.mjs';

const strips = [
  { id: 'E1.1', text: 'Temporary quota increases require approval.', keep: true },
  { id: 'E1.2', text: 'Menu  /  Home  /  Contact', keep: false },
  { id: 'E1.3', text: 'Keep exponential backoff enabled.', keep: true },
  { id: 'E1.4', text: 'Storage retention is thirty days.', keep: false },
];
export function drawKnowledgeRefinement(ctx, scene, state, api) {
  const { C, focus } = api;
  const label = (s, x, y, size, color = C.ink) => api.text(ctx, s, x, y, size, color);
  const split = spoken(state, 0, 'refinement-split');
  const filter = spoken(state, 1, 'refinement-keep');
  const kept = strips.filter((v) => v.keep);
  label('Launch quota and retry advice', 135, 270, 46);
  label(filter === 1 ? 'Passages retained for the answer' : 'Source E1', 135, 386, 33, C.cyan);
  strips.forEach((strip, i) => {
    if (!strip.keep && filter > 0) return;
    const slot = strip.keep ? kept.indexOf(strip) : i;
    const y = 500 + i * (98 + 16 * split) + (slot - i) * 114 * filter;
    focus.target('refinement-strips', () => {
      api.rect(ctx, 137, y - 47, 6, 62, split ? C.cyan : C.muted);
      label(split ? strip.id : 'E1', 189, y, 33, C.cyan);
      label(strip.text, 420, y, 40);
    });
  });
  focus.target('refinement-provenance', () =>
    label(
      filter === 1
        ? 'Two surviving strips keep their original order and source IDs.'
        : 'Keep the source ID with each sentence.',
      135,
      994,
      33,
      C.muted,
    ),
  );
}
export default {
  id: 'knowledge-refinement',
  draw: drawKnowledgeRefinement,
  cues: ['refinement-split', 'refinement-keep'],
};
