import { releaseSentenceProgress } from '../construction.mjs';
import {
  drawReleaseArrow,
  drawReleaseBox,
  drawReleaseFooter,
  drawReleaseHeading,
  drawReleaseText,
} from '../defaults.mjs';
export function drawGitopsContract(ctx, scene, state, api) {
  if (paintGitopsContract(ctx, scene, state, api)) return;
}
function paintGitopsContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (beat, i = 0) => releaseSentenceProgress(state, 'gitops-contract', beat, i),
    resultComplete = (beat, i = 0) => cueProgress(beat, i) >= 1;
  api.focus.target('gitops-contract-construction', () => paintReleaseContent());
  return true;
  function paintReleaseContent() {
    drawReleaseHeading(
      ctx,
      api,
      'Modeled desired-state loop · durable declaration and runtime are separate',
    );
    const repaired = currentBeat > 1 && resultComplete(2, 0),
      labels =
        currentBeat === 1
          ? [
              'immutable artifact bytes',
              'verified digests in manifest',
              'evaluate this candidate',
              'approve these same bytes',
            ]
          : [
              'declarative manifest',
              'versioned immutable history',
              'agent pulls desired state',
              'observe + reconcile',
            ];
    if (currentBeat < 2)
      labels.forEach((text, i) => {
        const slot = [0, 1, 3, 2][i],
          x = 160 + (slot % 2) * 930,
          y = 350 + Math.floor(slot / 2) * 260,
          progress =
            currentBeat === 0
              ? cueProgress(0, i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 3 : 4)
              : cueProgress(1, Math.min(i, 3));
        if (progress > 0 || currentBeat > 0)
          drawReleaseBox(
            ctx,
            api,
            text,
            x,
            y,
            650,
            115,
            i === 3 ? themeColors.cyan : themeColors.blue,
            31,
          );
      });
    if (currentBeat === 0) {
      drawReleaseArrow(ctx, api, 830, 407, 1060, 407, themeColors.blue);
      drawReleaseArrow(ctx, api, 1415, 485, 1415, 590, themeColors.cyan);
      drawReleaseArrow(ctx, api, 1080, 667, 830, 667, themeColors.cyan);
      drawReleaseArrow(ctx, api, 485, 600, 485, 485, themeColors.muted);
    } else if (currentBeat === 1) {
      drawReleaseArrow(ctx, api, 830, 407, 1060, 407, themeColors.blue);
      drawReleaseArrow(ctx, api, 1415, 485, 1415, 590, themeColors.cyan);
      drawReleaseArrow(ctx, api, 1080, 667, 830, 667, themeColors.green);
    } else {
      drawReleaseBox(
        ctx,
        api,
        'Git desired: ' + (repaired ? 'BASELINE' : 'CANDIDATE'),
        190,
        355,
        670,
        100,
        repaired ? themeColors.green : themeColors.pink,
      );
      drawReleaseBox(ctx, api, 'Runtime: BASELINE', 1060, 355, 670, 100, themeColors.green);
      drawReleaseText(
        ctx,
        api,
        repaired
          ? 'Durable repair matches the emergency target'
          : 'Emergency routing left a declaration mismatch',
        960,
        585,
        36,
        repaired ? themeColors.green : themeColors.yellow,
        'center',
      );
      if (resultComplete(2, 1))
        drawReleaseBox(
          ctx,
          api,
          'selfHeal / source changes govern the next synchronization',
          320,
          690,
          1280,
          100,
          themeColors.yellow,
          31,
        );
      if (resultComplete(2, 2))
        drawReleaseText(
          ctx,
          api,
          'Automated sync enabled → rollback command unavailable',
          960,
          880,
          31,
          themeColors.pink,
          'center',
        );
    }
    drawReleaseFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Audit authority, desired-state repair and served-version checks remain distinct'
        : 'Check which release the worker has loaded',
    );
  }
}
export default {
  id: 'gitops-contract',
  draw: drawGitopsContract,
  cues: [
    'gitops-contract-b1',
    'gitops-contract-s0-0',
    'gitops-contract-s0-1',
    'gitops-contract-s0-2',
    'gitops-contract-s0-3',
    'gitops-contract-s0-4',
    'gitops-contract-s0-5',
    'gitops-contract-b2',
    'gitops-contract-s1-0',
    'gitops-contract-s1-1',
    'gitops-contract-s1-2',
    'gitops-contract-s1-3',
    'gitops-contract-s1-4',
    'gitops-contract-s1-5',
    'gitops-contract-b3',
    'gitops-contract-s2-0',
    'gitops-contract-s2-1',
    'gitops-contract-s2-2',
    'gitops-contract-s2-3',
    'gitops-contract-s2-4',
  ],
};
