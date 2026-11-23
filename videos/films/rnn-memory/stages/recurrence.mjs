import { cueStarted } from '../construction.mjs';
import { actorMemoryTrace } from '../model.mjs';
import { math, text } from '../defaults.mjs';
export function drawRecurrence(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    F = components.fade;
  {
    const original = actorMemoryTrace('dog'),
      reversed = actorMemoryTrace('cat');
    const wordPill = (word, x, y, color, id) =>
      api.focus.target(id, () =>
        components.card({
          label: word,
          x,
          y,
          width: 170,
          height: 76,
          fill: themeColors.panel,
          stroke: color,
          textColor: themeColors.ink,
          fontSize: 32,
          padding: 10,
        }),
      );
    const stateCard = (label, value, x, y, color, id) =>
      api.focus.target(id, () =>
        components.card({
          label: label + '  ' + value,
          x,
          y,
          width: 220,
          height: 92,
          fill: themeColors.panel,
          stroke: color,
          textColor: color,
          fontSize: 29,
          padding: 12,
        }),
      );
    if (currentBeat === 0) {
      api.focus.target('actor-feature', () => {
        components.panel({
          x: 335,
          y: 350,
          width: 1250,
          height: 430,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          padding: 30,
        });
        text(ctx, api, 'ONE HIDDEN COORDINATE', 960, 425, 32, themeColors.cyan, 'center');
        math(ctx, api, String.raw`x_t^{(actor)}=`, 635, 590, 48, themeColors.ink, 'center');
        api.focus.target('actor-input', () => {
          components.card({
            label: 'dog  →  +0.8',
            x: 875,
            y: 500,
            width: 300,
            height: 90,
            fill: themeColors.panel,
            stroke: themeColors.blue,
            textColor: themeColors.blue,
            fontSize: 34,
            padding: 14,
          });
          components.card({
            label: 'cat  →  −0.8',
            x: 875,
            y: 620,
            width: 300,
            height: 90,
            fill: themeColors.panel,
            stroke: themeColors.pink,
            textColor: themeColors.pink,
            fontSize: 34,
            padding: 14,
          });
        });
        api.focus.target('neutral-input', () =>
          text(
            ctx,
            api,
            'other words  →  0 on this coordinate',
            960,
            740,
            29,
            themeColors.muted,
            'center',
          ),
        );
      });
      text(
        ctx,
        api,
        'A hand-coded actor clue isolates the memory update.',
        960,
        870,
        29,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      text(ctx, api, 'The dog chased the cat', 960, 255, 35, themeColors.ink, 'center');
      ['The', 'dog', 'chased', 'the', 'cat'].forEach((word, i) =>
        wordPill(
          word,
          230 + i * 310,
          300,
          i === 1 ? themeColors.blue : themeColors.cyan,
          i === 1 ? 'sentence-actor-dog' : 'sentence-context-' + i,
        ),
      );
      const input = api.focus.target('actor-input', () =>
        components.card({
          label: 'actor feature  +0.8',
          x: 250,
          y: 515,
          width: 360,
          height: 116,
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.blue,
          fontSize: 33,
          padding: 16,
        }),
      );
      const old = api.focus.target('recurrence-old-state', () =>
        components.card({
          label: 'previous state · 0',
          x: 250,
          y: 700,
          width: 360,
          height: 116,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.pink,
          fontSize: 32,
          padding: 16,
        }),
      );
      const cellNode = api.focus.target('recurrence-cell', () =>
        components.card({
          label: 'RNN update · tanh',
          x: 790,
          y: 590,
          width: 340,
          height: 144,
          fill: themeColors.panel,
          stroke: themeColors.cyan,
          textColor: themeColors.cyan,
          fontSize: 27,
          padding: 20,
        }),
      );
      const next = api.focus.target('recurrence-new-state', () =>
        components.card({
          label: 'after dog · +' + original.states[2].toFixed(3),
          x: 1300,
          y: 590,
          width: 410,
          height: 144,
          fill: themeColors.panel,
          stroke: themeColors.green,
          textColor: themeColors.green,
          fontSize: 27,
          padding: 18,
        }),
      );
      api.connect(ctx, input, cellNode, {
        color: themeColors.blue,
      });
      api.connect(ctx, old, cellNode, {
        color: themeColors.pink,
      });
      api.connect(ctx, cellNode, next, {
        color: themeColors.green,
      });
      api.focus.target('recurrence-equation', () =>
        math(
          ctx,
          api,
          String.raw`h_t=\tanh(x_t+0.9h_{t-1})`,
          960,
          925,
          53,
          themeColors.ink,
          'center',
        ),
      );
    } else if (currentBeat === 2) {
      const active = cueStarted(state, 'step-cat') ? 4 : cueStarted(state, 'step-chased') ? 2 : 1;
      text(ctx, api, 'The dog chased the cat', 960, 255, 34, themeColors.ink, 'center');
      original.words.forEach((word, i) =>
        wordPill(
          word,
          230 + i * 310,
          300,
          i === 1 ? themeColors.blue : i === active ? themeColors.yellow : themeColors.cyan,
          i === active ? 'sentence-current-state' : 'carry-token-' + i,
        ),
      );
      const visible = active + 1,
        nodes = [];
      api.focus.target('sentence-memory-path', () =>
        api.arrow(ctx, 350, 700, 1750, 700, themeColors.cyan, 5),
      );
      original.states.slice(1, visible + 1).forEach((value, i) => {
        const x = 130 + i * 350,
          current = i + 1 === visible;
        const drawState = () =>
          stateCard(
            'h' + ['₁', '₂', '₃', '₄', '₅'][i],
            value.toFixed(3),
            x,
            560,
            current ? themeColors.yellow : themeColors.blue,
            'sentence-state-' + (i + 1),
          );
        const node = current ? api.focus.target('sentence-current-state', drawState) : drawState();
        nodes.push(node);
        if (i > 0)
          api.connect(ctx, nodes[i - 1], node, {
            color: themeColors.cyan,
          });
      });
      api.focus.target('neutral-input', () =>
        components.card({
          label: 'next inputs  0, 0, 0',
          x: 190,
          y: 770,
          width: 440,
          height: 86,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.muted,
          fontSize: 29,
          padding: 12,
        }),
      );
      math(
        ctx,
        api,
        String.raw`h_t=\tanh(x_t+0.9h_{t-1})`,
        960,
        950,
        47,
        themeColors.ink,
        'center',
      );
      if (active === 4)
        api.focus.target('dog-actor-readout', () =>
          components.card({
            label: 'positive state  →  dog acted',
            x: 1120,
            y: 770,
            width: 590,
            height: 86,
            fill: themeColors.panel,
            stroke: themeColors.green,
            textColor: themeColors.green,
            fontSize: 30,
            padding: 12,
          }),
        );
    } else {
      const rows = [
        {
          trace: original,
          y: 330,
          color: themeColors.blue,
          word: 'dog',
          role: 'dog-actor-readout',
        },
        {
          trace: reversed,
          y: 650,
          color: themeColors.pink,
          word: 'cat',
          role: 'cat-actor-readout',
        },
      ];
      rows.forEach(({ trace, y, color, word, role }) => {
        trace.words.forEach((token, i) =>
          wordPill(
            token,
            110 + i * 178,
            y,
            i === 1 ? color : themeColors.cyan,
            trace.actor === 'cat' && i === 1
              ? 'cat-actor-input'
              : trace.actor === 'dog' && i === 1
                ? 'sentence-actor-dog'
                : trace.actor + '-token-' + i,
          ),
        );
        api.focus.target(role, () =>
          components.card({
            label:
              'state ' +
              (trace.final > 0 ? '+' : '−') +
              Math.abs(trace.final).toFixed(3) +
              '  ·  ' +
              word +
              ' acted',
            x: 1050,
            y: y + 1,
            width: 690,
            height: 86,
            fill: themeColors.panel,
            stroke: color,
            textColor: color,
            fontSize: 30,
            padding: 15,
          }),
        );
        text(ctx, api, 'same cell · reset state', 1400, y + 125, 25, themeColors.muted, 'center');
      });
      api.focus.target('reversed-sentence', () =>
        text(ctx, api, '↺  reverse word order', 960, 525, 28, themeColors.pink, 'center'),
      );
      api.focus.target('reversed-roles', () =>
        text(ctx, api, 'the actor changes', 960, 565, 28, themeColors.pink, 'center'),
      );
      math(
        ctx,
        api,
        String.raw`\operatorname{sign}(h_5)\longrightarrow\text{actor}`,
        960,
        930,
        46,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'recurrence',
  draw: drawRecurrence,
  cues: [
    'actor-feature',
    'dog-input',
    'neutral-words',
    'actor-word',
    'previous-memory',
    'apply-tanh',
    'zero-input',
    'carried-state',
    'step-chased',
    'step-cat',
    'actor-readout',
    'reverse-run',
    'cat-readout',
  ],
};
