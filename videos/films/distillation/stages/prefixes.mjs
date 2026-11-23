import { INITIAL, TEACHER } from '../fixtures.mjs';
import { prefixSnapshot } from '../model.mjs';
import { card, text } from '../defaults.mjs';
import { stableSoftmax } from 'vizmatic';
export function drawPrefixes(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const teacher = stableSoftmax(TEACHER),
    initial = stableSoftmax(INITIAL);
  {
    const current = prefixSnapshot(currentBeat, progress),
      prefix = api.focus.target('visited-prefix', () =>
        card(ctx, api, 'The child saw a', 440, 250, 1040, themeColors.yellow),
      );
    const lane = (tokens, y, label, color) => {
      text(ctx, api, label, 400, y - 26, 27, color);
      const nodes = tokens.map((word, i) =>
        api.focus.target('continuation-tokens', () =>
          components.card({
            label: word,
            x: 400 + i * 175,
            y,
            width: 155,
            height: 78,
            fontSize: 29,
            fill: themeColors.panel,
            stroke: color,
            textColor: color,
            padding: 8,
          }),
        ),
      );
      if (tokens.length) {
        api.path(
          ctx,
          [
            {
              x: prefix.x + 100,
              y: prefix.y + prefix.height + 12,
            },
            {
              x: 350,
              y: prefix.y + prefix.height + 12,
            },
            {
              x: 350,
              y: y + 39,
            },
            {
              x: 382,
              y: y + 39,
            },
          ],
          {
            color,
            width: 3,
          },
        );
        api.arrow(ctx, 365, y + 39, 385, y + 39, color, 3);
      }
      return nodes;
    };
    lane(current.reference, 440, 'Reference path', themeColors.blue);
    lane(current.visited, 715, 'Student path', themeColors.cyan);
    const conditional = (tokens, values, y, color, ready) => {
      const node = components.panel({
        x: 1300,
        y,
        width: 470,
        height: 250,
        fill: themeColors.panel,
        stroke: ready ? color : themeColors.muted,
        radius: 14,
      });
      text(
        ctx,
        api,
        'Teacher | … a ' + tokens,
        1535,
        y + 38,
        24,
        ready ? color : themeColors.muted,
        'center',
      );
      if (ready) {
        api.focus.target('conditional-teacher', () =>
          teaching.bars({
            x: 1330,
            y: y + 90,
            width: 410,
            height: 80,
            values,
            labels: current.words,
            colors: values.map(() => color),
            max: 1,
            showValues: true,
            format: (v) => v.toFixed(2),
            fontSize: 21,
            gap: 28,
          }),
        );
        text(ctx, api, 'Student target at this same prefix', 1535, y + 230, 20, color, 'center');
      } else
        text(ctx, api, 'Conditional query pending', 1535, y + 135, 24, themeColors.muted, 'center');
      return node;
    };
    conditional(
      'bird',
      current.referenceTeacher,
      365,
      themeColors.blue,
      current.referenceCount > 1,
    );
    api.focus.target('student-prefix-feedback', () => {
      const teacherQuery = conditional(
        'dog',
        current.visitedTeacher,
        650,
        themeColors.cyan,
        current.feedback === 1,
      );
      if (current.feedback > 0) {
        const query = components.card({
          label: 'Query: The child saw a dog',
          x: 400,
          y: 830,
          width: 690,
          height: 64,
          fontSize: 26,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.cyan,
          padding: 8,
        });
        teaching.transfer({
          source: {
            shape: query,
            opacity: 1,
          },
          target: {
            shape: teacherQuery,
            opacity: 1,
          },
          progress: current.feedback,
          color: themeColors.cyan,
          width: 3,
          gap: 16,
          particle: {
            radius: 6,
            fill: themeColors.cyan,
          },
        });
      }
    });
  }
}
export default {
  id: 'prefixes',
  draw: drawPrefixes,
  cues: ['prefixes-b1-1', 'prefixes-b2-1', 'prefixes-b2-2', 'prefixes-b3-1'],
};
