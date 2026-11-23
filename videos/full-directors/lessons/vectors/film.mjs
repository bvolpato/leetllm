import { frame, heading } from './drawing.mjs';
import { check } from './model.mjs';
import {
  opening,
  coordinates,
  directions,
  mixture,
  column,
  compose,
  rows,
  tensor,
  localEdit,
} from './coordinates.mjs';
import { gradient, requestDot, batch, multiple, shape, broadcast } from './requests.mjs';
import { pairs, normalized, transposeTrap } from './scores.mjs';
import { pooling, padding, guards, linear, finalPractice } from './reductions.mjs';

const lessons = [
  [opening, 'The plotting carriage'],
  [coordinates, 'The plotting carriage'],
  [directions, 'Projection geometry'],
  [mixture, 'Projection geometry'],
  [column, 'Projection geometry'],
  [compose, 'Projection geometry'],
  [rows, 'Token positions'],
  [tensor, 'Token positions'],
  [localEdit, 'Token positions'],
  [gradient, 'Request timing'],
  [requestDot, 'Request timing'],
  [batch, 'Request timing'],
  [multiple, 'Request timing'],
  [shape, 'Request timing'],
  [broadcast, 'Request timing'],
  [pairs, 'Pairwise comparisons'],
  [normalized, 'Pairwise comparisons'],
  [transposeTrap, 'Pairwise comparisons'],
  [pooling, 'Prompt summaries'],
  [padding, 'Prompt summaries'],
  [guards, 'Projection checks'],
  [linear, 'Projection checks'],
  [finalPractice, 'Final practice'],
];
const captionStarts = {
  'c02-b03': ["you'd accept both versions"],
  'c03-b03': ['with any mix'],
  'c04-b01': ['even the coordinate'],
  'c05-b02': ['we already constructed'],
  'c06-b03': ['we can precompute their product'],
  'c07-b01': ['or down a column'],
  'c07-b03': ['some other operation'],
  'c09-b02': ['so the edit'],
  'c10-b01': ['then queue delay'],
  'c11-b01': ['plus a second'],
  'c11-b05': ['because swapping'],
  'c12-b01': ['how many predictions'],
  'c12-b03': ['even when the three values agree'],
  'c13-b03': ['For any request', "it's the two input features"],
  'c14-b05': ['how strongly', 'all the outputs depend'],
  'c15-b01': ['and subtract'],
  'c15-b06': ['and a missing leading axis', 'whose length'],
  'c16-b03': ['so the grid', 'and taking a row-wise softmax'],
  'c16-b05': ['and some of those'],
  'c17-b01': ['the dot product measures', 'even though'],
  'c17-b02': ['divide their dot product', 'with the horizontal reference', 'gives each a self-score'],
  'c18-b05': ['so this calculation'],
  'c18-b08': ['because the multiply'],
};

export default {
  title: 'Vectors, Matrices & Tensors: Follow the Coordinates',
  check,
  draw(ctx, clock) {
    for (const phrase of captionStarts[clock.beat.id] ?? []) {
      clock.reveal(phrase, 0, { captionStart: phrase });
    }
    const [paint, section] = lessons[clock.beat.chapterIndex];
    frame(ctx, section);
    const title = paint(ctx, clock) ?? clock.beat.chapterTitle;
    heading(ctx, title);
  },
};
