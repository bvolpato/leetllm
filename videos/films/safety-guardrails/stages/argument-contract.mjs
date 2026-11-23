import { lerp } from '../arithmetic.mjs';
import { articleActionHash, guardCue, guardDone } from '../model.mjs';
import {
  drawGuardMechanismBlock,
  drawGuardMechanismLine,
  drawGuardMechanismLines,
  drawGuardMechanismNote,
  drawGuardMechanismRect,
  drawGuardMechanismText,
  withGuardMechanismFocus,
} from '../defaults.mjs';
export function paintArgumentContract(
  ctx,
  scene,
  state,
  api,
  themeColors,
  currentBeat,
  cueProgress,
  cueDone,
) {
  if (currentBeat === 0) {
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'argument-tuple',
      'Untrusted proposal · article fixture',
      [
        'service: payment-service',
        'environment: prod',
        'artifact_digest: sha256:',
        'a'.repeat(32),
        'a'.repeat(32),
      ],
      155,
      300,
      920,
      430,
      themeColors.blue,
      30,
    );
    drawGuardMechanismBlock(
      ctx,
      api,
      themeColors,
      'argument-host',
      'Trusted host context',
      ['actor: engineer-7', 'operation: deploy-op-42'],
      1150,
      300,
      615,
      245,
      themeColors.green,
      29,
    );
    withGuardMechanismFocus(ctx, api, 'argument-host', () => {
      drawGuardMechanismLine(ctx, api, themeColors, 1100, 600, 1770, 600, themeColors.yellow, 4);
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Model-written actor fields',
        1180,
        665,
        30,
        themeColors.pink,
      );
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'cannot cross this boundary',
        1180,
        720,
        29,
        themeColors.pink,
      );
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Exact 64-character artifact value · host identities are separate from model arguments',
    );
  } else if (currentBeat === 1) {
    const digest = cueDone('argument-contract-digest', 1),
      change = cueProgress('argument-contract-change', 1);
    withGuardMechanismFocus(ctx, api, 'argument-digest', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Canonical action · sorted keys, compact JSON',
        160,
        295,
        31,
        themeColors.cyan,
      );
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        [
          'action: deploy',
          'artifact_digest: sha256:' + 'a'.repeat(12) + '… (64 a)',
          'environment: prod    service: payment-service',
        ],
        160,
        355,
        29,
        themeColors.ink,
        49,
        true,
      );
      drawGuardMechanismText(ctx, api, themeColors, 'SHA-256', 1125, 335, 31, themeColors.cyan);
      if (digest)
        drawGuardMechanismLines(
          ctx,
          api,
          themeColors,
          [articleActionHash('a').slice(0, 32), articleActionHash('a').slice(32)],
          1125,
          398,
          26,
          themeColors.cyan,
          45,
          true,
        );
      else
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'hash not constructed yet',
          1125,
          407,
          27,
          themeColors.muted,
        );
    });
    withGuardMechanismFocus(ctx, api, 'argument-change', () => {
      if (change > 0)
        api.teaching.byteDifference({
          x: 160,
          y: 570,
          width: 1600,
          height: 300,
          fontSize: 25,
          startColumn: 60,
          maxColumns: 10,
          before: new TextEncoder().encode('sha256:' + 'a'.repeat(64)),
          after: new TextEncoder().encode('sha256:' + 'b'.repeat(64)),
          scanProgress: change,
          revealVerdict: change === 1,
          beforeLabel: 'grant',
          afterLabel: 'new',
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          mutedColor: themeColors.muted,
          scanColor: themeColors.cyan,
          changeColor: themeColors.yellow,
        });
      else {
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'approval-42 · engineer-7 · release-manager-3',
          180,
          620,
          32,
          themeColors.green,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Approved status · expires 00:15 UTC',
          180,
          695,
          30,
          themeColors.green,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Actor and distinct authorized approver must match',
          180,
          770,
          29,
          themeColors.yellow,
        );
      }
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      change === 1
        ? 'The byte values differ; so does the full computed action digest'
        : 'Model approval ID → lookup key, never approval authority',
    );
  } else {
    withGuardMechanismFocus(ctx, api, 'argument-capability', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Host capability set',
        170,
        300,
        33,
        themeColors.cyan,
      );
      ['read_runbook', 'deploy_service'].forEach((s, i) => {
        drawGuardMechanismRect(
          ctx,
          api,
          themeColors,
          170,
          350 + i * 105,
          650,
          80,
          themeColors.green,
        );
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          s,
          200,
          405 + i * 105,
          32,
          themeColors.green,
          'left',
          true,
        );
      });
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'export_secret',
        200,
        625,
        32,
        themeColors.pink,
        'left',
        true,
      );
      drawGuardMechanismLine(ctx, api, themeColors, 180, 640, 740, 640, themeColors.pink, 5);
    });
    withGuardMechanismFocus(ctx, api, 'argument-resource', () => {
      drawGuardMechanismText(
        ctx,
        api,
        themeColors,
        'Resolve at the access boundary',
        1030,
        300,
        33,
        themeColors.yellow,
      );
      const q = cueProgress('argument-contract-resource', 2);
      drawGuardMechanismLines(
        ctx,
        api,
        themeColors,
        [
          'File: /workspace/reviewed/runbook',
          'link → /private/credential',
          'URL: approved internal service',
          'DNS + redirects → admitted target',
        ],
        1030,
        390,
        29,
        themeColors.ink,
        100,
      );
      const y = lerp(385, 830, q);
      drawGuardMechanismLine(ctx, api, themeColors, 990, 365, 990, y, themeColors.yellow, 4);
      api.circle(ctx, 990, y, 10, themeColors.yellow);
      if (q === 1)
        drawGuardMechanismText(
          ctx,
          api,
          themeColors,
          'Confinement / destination check',
          1030,
          890,
          31,
          themeColors.green,
        );
    });
    drawGuardMechanismNote(
      ctx,
      api,
      themeColors,
      'Private addresses can be legitimate for a specifically approved internal tool',
    );
  }
}
export function drawArgumentContract(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0;
  const cueProgress = (id, beat, a, z) => guardCue(state, id, beat, a, z),
    cueDone = (id, beat, a, z) => guardDone(state, id, beat, a, z);
  return paintArgumentContract(
    ctx,
    scene,
    state,
    api,
    themeColors,
    currentBeat,
    cueProgress,
    cueDone,
  );
}
export default {
  id: 'argument-contract',
  draw: drawArgumentContract,
  cues: [
    'argument-contract-tuple',
    'argument-contract-host',
    'argument-contract-digest',
    'argument-contract-change',
    'argument-contract-capability',
    'argument-contract-resource',
  ],
};
