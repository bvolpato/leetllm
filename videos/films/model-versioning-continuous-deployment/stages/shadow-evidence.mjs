import { clamp } from '../arithmetic.mjs';
import { authorize } from '../model.mjs';
import { chapterText, footer, pill } from '../defaults.mjs';
export function drawShadowEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-shadow-evidence-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('shadow-evidence-mechanism', () => {
    if (currentBeat === 0) {
      pill(ctx, api, 'SHIP-4412 · approval request', 960, 330, 1120, themeColors.blue);
      if (B('redact'))
        api.text(
          ctx,
          '[SHIP_ID] · approval request',
          960,
          480,
          37,
          themeColors.yellow,
          'center',
          'mono',
        );
      pill(ctx, api, 'observed STABLE: ABSTAIN', 470, 685, 740, themeColors.blue);
      pill(ctx, api, 'encoded CANDIDATE: ABSTAIN', 1450, 685, 780, themeColors.cyan);
      if (resultComplete('agreement'))
        chapterText(
          ctx,
          api,
          'agreement = true · supplied support = false',
          960,
          880,
          38,
          themeColors.green,
        );
      footer(ctx, api, 'Actual local envelope and encoded branch · no language model or queue run');
    } else if (currentBeat === 1) {
      chapterText(
        ctx,
        api,
        'Agreement and correctness answer different questions',
        960,
        295,
        35,
        themeColors.yellow,
      );
      const wrong = B('wrong');
      pill(
        ctx,
        api,
        'STABLE: ' + (wrong ? 'SERVE' : 'ABSTAIN'),
        470,
        470,
        650,
        wrong ? themeColors.pink : themeColors.blue,
      );
      pill(
        ctx,
        api,
        'CANDIDATE: ' + (wrong ? 'SERVE' : 'ABSTAIN'),
        1450,
        470,
        690,
        wrong ? themeColors.pink : themeColors.cyan,
      );
      chapterText(ctx, api, 'supplied support = false', 960, 620, 35, themeColors.yellow);
      chapterText(ctx, api, 'agreement = true', 960, 750, 37, themeColors.cyan);
      if (resultComplete('wrong'))
        chapterText(ctx, api, 'both routes wrong', 960, 845, 38, themeColors.pink);
      if (B('observations'))
        ['support', 'quality', 'latency', 'drops', 'timeouts'].forEach((v, i) =>
          pill(ctx, api, v, 300 + i * 330, 940, 280, themeColors.muted, 60, 26),
        );
      footer(ctx, api, 'Use the same sanitized input for both releases');
    } else {
      chapterText(ctx, api, 'Shadow tool checks', 960, 295, 36, themeColors.yellow);
      const rows = [
        ['read policy', ['read policy'], ['policy:read']],
        ['deploy application', ['read policy'], ['deploy:write']],
        ['deploy application', ['deploy application'], ['policy:read']],
      ];
      ['Tool requested', 'Tool on list?', 'Credential scope', 'Decision'].forEach((v, i) =>
        chapterText(ctx, api, v, [365, 805, 1235, 1625][i], 420, 31, themeColors.muted),
      );
      rows.forEach(([tool, allowed, scopes], i) => {
        const y = 525 + i * 108;
        const permit = authorize(tool, new Set(scopes), new Set(allowed));
        chapterText(ctx, api, tool, 365, y, 34, themeColors.ink);
        chapterText(ctx, api, allowed.includes(tool) ? 'Yes' : 'No', 805, y, 34, themeColors.ink);
        chapterText(ctx, api, scopes[0], 1235, y, 34, themeColors.ink);
        if (B('capability'))
          chapterText(
            ctx,
            api,
            permit ? 'ALLOW' : 'DENY',
            1625,
            y,
            34,
            permit ? themeColors.green : themeColors.pink,
          );
      });
      if (B('capability'))
        chapterText(
          ctx,
          api,
          'side-effects-disabled=true · intent only',
          960,
          835,
          34,
          themeColors.pink,
        );
      if (B('gap'))
        chapterText(
          ctx,
          api,
          'full or timed-out comparison → missing coverage',
          960,
          940,
          33,
          themeColors.yellow,
        );
      footer(ctx, api, 'The worker checks the requested tool and its credential scope');
    }
  });
}
export default {
  id: 'shadow-evidence',
  draw: drawShadowEvidence,
  cues: [
    'mv-shadow-evidence-redact',
    'mv-shadow-evidence-agreement',
    'mv-shadow-evidence-wrong',
    'mv-shadow-evidence-observations',
    'mv-shadow-evidence-capability',
    'mv-shadow-evidence-gap',
  ],
};
