import { EOS, FAIL_PREFIX, LANGUAGE, SUFFIX, TOKEN_SCORES, VALUE_PREFIX } from '../fixtures.mjs';
import { legal, rankedSteps } from '../model.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after } from '../page.mjs';

const shop = {
  name: 'Shop status',
  language: ['{"status":"open"}', '{"status":"closed"}'],
  prefix: VALUE_PREFIX + 'clo',
  suffix: 'sed"}',
};
const ci = { name: 'CI token index', language: LANGUAGE, prefix: FAIL_PREFIX, suffix: SUFFIX };
const ciNextBuffer = rankedSteps(3).join('');

function drawSpelling(ctx, api, trial, token, checked, y) {
  const { C, focus } = api;
  const punctuation = token.indexOf('"');
  const groups = [
    ['token-letters', 0, punctuation],
    ['token-punctuation', punctuation, token.length],
  ];
  for (const [id, start, end] of groups) {
    focus.target(id, () => {
      for (let i = start; i < end; i++) {
        const x = 270 + i * 117;
        const possible = legal(trial.prefix, token.slice(0, i + 1), trial.language);
        const ink = i >= checked ? C.ink : possible ? C.cyan : C.pink;
        api.rect(ctx, x, y, 98, 99, C.panel, i < checked ? ink : C.muted, 7);
        code(ctx, api, token[i], x + 49, y + 71, 52, ink, 'center');
      }
    });
  }
}

export function drawWholeToken(ctx, scene, state, api) {
  const { C, focus } = api;
  const lookup = focus.progress('ci-lookup', 0) > 0;
  const trial = lookup ? ci : shop;
  const lookupDone = lookup && after(state, 'ci-lookup');
  const committed = !lookup && after(state, 'shop-commit');
  const buffer = committed ? trial.prefix + trial.suffix : trial.prefix;
  const bang = state.cues?.['whole-token-b2-2'];
  const letters = shop.suffix.indexOf('"');
  const shopChecked = [
    Math.floor(letters * focus.progress('shop-scan-a', 0)) +
      Math.floor((shop.suffix.length - letters) * focus.progress('shop-close-a', 0)),
    Math.floor(shop.suffix.length * focus.progress('shop-scan-b', 0)) + Number(bang?.phase === 'after'),
  ];

  focus.target('candidate-characters', () => {
    text(ctx, api, trial.name, 145, 255, 36, C.blue);
    code(ctx, api, trial.language.join('   or   '), 490, 255, 38);
    code(ctx, api, 'Accepted prefix: ' + buffer, 145, 365, 52, C.ink);
    if (committed && legal(buffer, EOS, trial.language))
      text(ctx, api, 'EOS allowed', 1765, 359, 38, C.green, 'right');
  });

  if (lookup) text(ctx, api, 'Model score', 1670, 463, 34, C.muted, 'center');
  [trial.suffix, trial.suffix + '!'].forEach((token, row) => {
    const short = row === 0;
    const checked = lookup ? (lookupDone ? token.length : 0) : shopChecked[row];
    const verdict = lookup ? lookupDone : after(state, short ? 'whole-token-b2-1' : 'shop-reject');
    const allowed = legal(trial.prefix, token, trial.language);
    const y = short ? 510 : 756;
    focus.target(short ? 'candidate-accepted' : 'candidate-rejected', () => {
      if (!lookup && state.beat === 2) {
        const receipt = allowed ? 'Accepted token receipt' : 'Rejected candidate receipt';
        text(ctx, api, receipt, 270, y - 28, 36);
      } else if (state.beat === 1 && (short ? checked === token.length : checked > 0)) {
        const heading = short ? 'Candidate closing the object' : 'Candidate with trailing punctuation';
        text(ctx, api, heading, 270, y - 28, 36);
      }
      text(ctx, api, short ? 'A' : 'B', 147, y + 73, 52);
      drawSpelling(ctx, api, trial, token, checked, y);

      if (verdict) {
        const label = lookup
          ? (allowed ? 'Eligible' : 'Masked out')
          : (allowed ? 'Whole token accepted' : 'Whole token rejected');
        text(ctx, api, label, 1130, y + 65, 40, allowed ? C.green : C.pink);
      } else if (checked === token.length && !allowed) {
        text(ctx, api, 'No transition for !', 1130, y + 65, 40, C.pink);
      } else if (checked) {
        const count = checked + '/' + token.length + ' characters checked';
        text(ctx, api, count, 1130, y + 65, 38, C.ink);
      }
      if (lookup)
        code(ctx, api, TOKEN_SCORES.get(token), 1670, y + 70, 52, C.ink, 'center');

      if (!short && !lookup && bang?.active) {
        const x = 270 + trial.suffix.length * 117;
        focus.target('character-cursor', () =>
          api.line(ctx, x + 9, y + 114, x + 89, y + 114, C.yellow, 7),
        );
      }
    });
  });
  if (lookupDone) {
    code(ctx, api, 'After sampling A: ' + ciNextBuffer, 145, 975, 40, C.green);
    if (legal(ciNextBuffer, EOS)) text(ctx, api, 'EOS allowed', 1765, 975, 38, C.green, 'right');
  }
}

export default {
  id: 'whole-token',
  draw: drawWholeToken,
  cues: [
    'whole-token-b1-1',
    'token-punctuation',
    'shop-prefix',
    'shop-scan-a',
    'shop-close-a',
    'whole-token-b2-1',
    'shop-scan-b',
    'whole-token-b2-2',
    'shop-reject',
    'whole-token-b3-1',
    'shop-commit',
    'ci-lookup',
  ],
};
