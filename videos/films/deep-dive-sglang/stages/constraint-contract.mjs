import { motion, settled } from '../construction.mjs';
import { box, rectangle, text } from '../defaults.mjs';
import { grammarState } from '../model.mjs';

function drawWeights(ctx, state, api) {
  const { C } = api;
  const { labels, raw, allowed, mass, probabilities } = grammarState(0, 1);
  const mask = motion(state, 'sg-constraint-mask', 1, 0.08, 0.23);
  const total = settled(state, 'sg-constraint-mass', 1, 0.45);
  const normalize = motion(state, 'sg-constraint-normalize', 1, 0.46, 0.6);
  const empty = settled(state, 'sg-constraint-empty', 1, 0.88);
  let weightHeading = 'Before masking';
  if (empty) weightHeading = 'No legal tokens';
  else if (normalize > 0) weightHeading = 'Sampling probability';
  else if (mask > 0) weightHeading = 'Allowed weight';
  text(ctx, api, 'Candidate', 200, 320, 34, C.muted);
  text(ctx, api, 'Model', 590, 320, 34, C.blue, 'center');
  text(ctx, api, weightHeading, 1080, 320, 34, C.cyan, 'center');
  for (const [i, label] of labels.entries()) {
    const y = 390 + i * 113;
    const weight = empty
      ? 0
      : allowed[i]
        ? raw[i] + (probabilities[i] - raw[i]) * normalize
        : raw[i] * (1 - mask);
    const color = empty || !allowed[i] ? C.pink : C.cyan;
    text(ctx, api, label, 200, y + 46, 44, C.ink);
    text(ctx, api, raw[i].toFixed(2), 590, y + 46, 42, C.blue, 'center');
    rectangle(ctx, api, 730, y + 5, 760, 48, C.panel, C.muted);
    if (weight > 0) rectangle(ctx, api, 730, y + 5, 760 * weight, 48, color, color);
    const moving =
      (!allowed[i] && mask > 0 && mask < 1) || (allowed[i] && normalize > 0 && normalize < 1);
    let readout = weight.toFixed(normalize === 1 ? 3 : 2);
    if (moving) readout = '…';
    if (empty) readout = 'blocked';
    text(ctx, api, readout, 1620, y + 46, 37, color, 'center');
  }
  if (total && !empty) {
    const allowedSum = raw
      .filter((_, i) => allowed[i])
      .map((p) => p.toFixed(2))
      .join(' + ');
    text(
      ctx,
      api,
      'Allowed weight     ' + allowedSum + ' = ' + mass.toFixed(2),
      960,
      875,
      40,
      C.ink,
      'center',
    );
  }
  let calculation = 'The model assigns weight to four candidates.';
  if (empty) calculation = 'Legal weight = 0     Stop sampling';
  else if (normalize > 0)
    calculation =
      'bug     ' +
      raw[0].toFixed(2) +
      ' ÷ ' +
      mass.toFixed(2) +
      (normalize === 1 ? ' ≈ ' + probabilities[0].toFixed(3) : '');
  else if (mask > 0) calculation = '42 is a number. This field takes a label.';
  text(ctx, api, calculation, 960, 950, 46, empty ? C.pink : C.yellow, 'center');
}

export function drawConstraintContract(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('constraint-contract-mechanism', () => {
    if (state.beat === 0) {
      text(ctx, api, 'Schema for the label field', 190, 298, 37, C.blue);
      rectangle(ctx, api, 190, 334, 1540, 152, C.panel, C.blue);
      api.text(
        ctx,
        '{"enum": ["bug", "feature", "question"]}',
        246,
        430,
        52,
        C.ink,
        'left',
        'mono',
      );
      text(ctx, api, 'Server request', 190, 633, 42, C.ink);
      text(ctx, api, 'JSON schema', 760, 633, 42, C.cyan);
      if (motion(state, 'constraint-server-options', 0, 0.33, 0.48) > 0) {
        text(ctx, api, 'or regex', 1100, 633, 42, C.cyan);
        text(ctx, api, 'or EBNF', 1370, 633, 42, C.cyan);
      }
      if (motion(state, 'constraint-frontend', 0, 0.48, 0.65) > 0) {
        text(ctx, api, 'Pinned Python gen', 190, 766, 42, C.ink);
        text(ctx, api, 'JSON schema', 760, 766, 42, C.cyan);
        text(ctx, api, 'or regex', 1100, 766, 42, C.cyan);
      }
      if (motion(state, 'constraint-backends', 0, 0.68, 0.8) > 0) {
        text(ctx, api, 'Server EBNF backends', 190, 923, 37, C.ink);
        text(ctx, api, 'XGrammar or llguidance', 760, 923, 37, C.yellow);
      }
    } else if (state.beat === 1) {
      drawWeights(ctx, state, api);
    } else {
      const prefix = '{"label":';
      const typing = motion(state, 'sg-constraint-contract-beat-2', 2, 0, 0.24);
      const stopped = settled(state, 'constraint-limit', 2, 0.43);
      text(ctx, api, 'Reply from the server', 240, 349, 40, C.blue);
      rectangle(ctx, api, 240, 399, 1440, 222, C.panel, C.blue, 14);
      const visible = Math.max(1, Math.ceil(typing * prefix.length));
      const printed = prefix.slice(0, visible);
      api.text(ctx, stopped ? printed : printed + '▏', 310, 549, 88, C.ink, 'left', 'mono');
      if (stopped) {
        box(ctx, api, 'Token limit reached', 295, 716, 575, 100, C.pink, 38);
        text(ctx, api, 'Missing label value and closing brace', 925, 784, 38, C.ink);
      }
    }
  });
}

export default {
  id: 'constraint-contract',
  draw: drawConstraintContract,
  cues: [
    'sg-constraint-contract-beat-0',
    'constraint-server-options',
    'constraint-frontend',
    'constraint-backends',
    'sg-constraint-contract-beat-1',
    'sg-constraint-mask',
    'sg-constraint-mass',
    'sg-constraint-normalize',
    'sg-constraint-empty',
    'sg-constraint-contract-beat-2',
    'constraint-limit',
  ],
};
