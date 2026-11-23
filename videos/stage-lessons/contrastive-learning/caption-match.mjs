import { arrow, boxOf, column, place } from 'vizmatic/stage';
import { area, label, mono, namedBox, note } from '../kit-narrated.mjs';

export const QUERY = 'A dog is running';
export const CAPTIONS = ['A puppy runs', 'A dog sleeps', 'The sky is blue'];

// Keep the query and caption endpoints fixed while the editor changes the retrieval rule.
export function captionMatch() {
  const [body, footer] = area.rows([5, 1], 'normal');
  const [request, , candidates] = body.columns([5, 2, 7], 'normal');
  const [requestHead, queryBox, ruleBox, requestFoot] = request.rows([1, 2, 2, 1], 'tight');
  const query = place(
    namedBox(QUERY, { width: queryBox.width, height: 126, color: 'cyan' }),
    queryBox,
  );
  const queryLabel = place(note('Search query'), requestHead, 'bottom');
  const rule = (name, detail) =>
    place(
      column([label(name, { color: 'yellow', size: 42 }), note(detail, { size: 32 })], {
        gap: 'normal',
        align: 'center',
      }),
      ruleBox,
    );
  const lanes = candidates.rows(3, 'loose');
  const captions = [],
    readings = [];
  for (const [i, lane] of lanes.entries()) {
    const [words, value] = lane.columns([5, 3], 'normal');
    captions.push(
      place(
        namedBox(CAPTIONS[i], {
          width: words.width,
          height: 120,
          color: 'ink',
          size: 44,
        }),
        words,
      ),
    );
    readings.push((valueText, color = 'dim') => place(mono(valueText, { size: 36, color }), value));
  }
  function link(index, color) {
    return arrow(boxOf(query).point('right'), boxOf(captions[index]).point('left'), {
      stroke: color,
      width: 7,
      pad: 16,
    });
  }
  return { query, queryLabel, rule, captions, readings, link, requestFoot, footer };
}
