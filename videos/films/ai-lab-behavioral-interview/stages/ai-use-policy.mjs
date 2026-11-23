import { publicRehearsalPacket } from '../arithmetic.mjs';
import {
  cueProgress,
  drawCaption,
  drawEvidenceBox,
  drawLine,
  drawText,
  withFocus,
} from '../defaults.mjs';
export function drawAiUsePolicy(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    if (currentBeat === 0) {
      const fields = [
          {
            text: 'Wrote the release check',
            private: false,
          },
          {
            text: 'Measured canary p95: 420 ms',
            private: false,
          },
          {
            text: 'Private incident records',
            private: true,
          },
          {
            text: 'Customer data',
            private: true,
          },
          {
            text: 'Confidential interview question',
            private: true,
          },
          {
            text: 'Internal code',
            private: true,
          },
        ],
        safe = publicRehearsalPacket(fields),
        p = cueProgress(ctx, api, 'ai-use-policy-privacy');
      withFocus(ctx, api, 'ai-preparation', () => {
        drawText(ctx, api, 'Candidate notes', 485, 290, 32, themeColors.blue);
        fields.forEach((f, i) =>
          drawEvidenceBox(
            ctx,
            api,
            'ai-field-' + i,
            f.text,
            150,
            330 + i * 105,
            670,
            80,
            f.private ? themeColors.pink : themeColors.blue,
            26,
          ),
        );
      });
      withFocus(ctx, api, 'ai-boundary', () => {
        drawText(ctx, api, 'Sanitized rehearsal prompt', 1370, 290, 30, themeColors.yellow);
        drawLine(ctx, api, 850, 570, 980, 570, themeColors.yellow, 4);
        safe.forEach((s, i) =>
          drawEvidenceBox(
            ctx,
            api,
            'ai-public-' + i,
            p > 0 ? s : 'Not sent',
            1030,
            400 + i * 160,
            690,
            100,
            p > 0 ? themeColors.green : themeColors.muted,
            28,
          ),
        );
        drawEvidenceBox(
          ctx,
          api,
          'ai-withheld',
          p === 1 ? '4 private fields withheld' : 'Select public evidence before sending',
          1030,
          765,
          690,
          95,
          p === 1 ? themeColors.green : themeColors.muted,
          28,
        );
        drawText(
          ctx,
          api,
          'If safe discussion is impossible, choose another example',
          960,
          1020,
          28,
          themeColors.yellow,
        );
      });
    } else if (currentBeat === 2) {
      const write = (line, x, y, size, color, font = 'sans') =>
        api.text(ctx, line, x, y, size, color, 'left', font);
      write('Two interview invitations', 125, 291, 49, themeColors.ink, 'serif');
      write('Prior employer', 125, 430, 35, themeColors.muted);
      write('Live assistant permitted', 706, 430, 43, themeColors.ink);
      api.line(ctx, 125, 494, 1780, 494, themeColors.muted, 2);
      write('New invitation', 125, 590, 35, themeColors.muted);
      write('No tool instructions', 706, 590, 43, themeColors.ink);
      withFocus(ctx, api, 'ai-scope', () =>
        write(
          api.focus.visible('ai-use-policy-separate')
            ? 'Ask the recruiter before the assessment.'
            : 'What does this invitation allow?',
          125,
          731,
          51,
          themeColors.yellow,
          'serif',
        ),
      );
      if (api.focus.visible('ai-use-policy-truth'))
        withFocus(ctx, api, 'ai-evidence', () => {
          write('Rehearsal critique', 125, 908, 35, themeColors.muted);
          write('Sample count: missing from the notes.', 706, 908, 40, themeColors.cyan);
        });
    } else {
      withFocus(ctx, api, 'ai-formats', () => {
        drawText(
          ctx,
          api,
          'Assessment guidance checked 10 October 2026',
          960,
          285,
          33,
          themeColors.yellow,
        );
        const labels = ['OpenAI', 'Google DeepMind', 'Anthropic'],
          live = [
            'Format-specific instructions',
            'No live AI unless told otherwise',
            'Explicit live/task permission',
          ];
        labels.forEach((s, i) => {
          const x = 150 + i * 585;
          drawEvidenceBox(ctx, api, 'ai-org-' + i, s, x, 365, 510, 95, themeColors.blue);
          drawEvidenceBox(
            ctx,
            api,
            'ai-live-' + i,
            live[i],
            x,
            560,
            510,
            130,
            i === 0 ? themeColors.yellow : themeColors.pink,
            26,
          );
        });
      });
      withFocus(ctx, api, 'ai-permissions', () =>
        drawText(
          ctx,
          api,
          'Anthropic: July 2025 published guidance',
          960,
          790,
          28,
          themeColors.muted,
        ),
      );
      withFocus(ctx, api, 'ai-scope', () =>
        drawText(
          ctx,
          api,
          'Check the preparation materials for this interview.',
          960,
          905,
          30,
          themeColors.yellow,
        ),
      );
      drawCaption(
        ctx,
        api,
        'ai-evidence',
        'For an Anthropic application, write the first draft yourself.',
        1010,
        themeColors.pink,
      );
    }
  }
}
export default {
  id: 'ai-use-policy',
  draw: drawAiUsePolicy,
  cues: [
    'ai-use-policy-prepare',
    'ai-use-policy-privacy',
    'ai-use-policy-format',
    'ai-use-policy-guidance',
    'ai-use-policy-separate',
    'ai-use-policy-truth',
  ],
};
