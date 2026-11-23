import { sqlCueStep } from '../construction.mjs';
import {
  drawExtendedSqlArrow,
  drawExtendedSqlCard,
  drawExtendedSqlFooter,
  drawExtendedSqlHeading,
  drawExtendedSqlText,
} from '../defaults.mjs';
export function drawRoleBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    stepProgress = (beat, i = 0) => sqlCueStep('role-boundary', state, beat, i),
    stepComplete = (beat, i = 0) => stepProgress(beat, i) === 1;
  api.focus.target('role-boundary-construction', () => {
    drawExtendedSqlHeading(
      ctx,
      api,
      'Change only the PostgreSQL role; keep the candidate rows fixed',
    );
    drawExtendedSqlText(
      ctx,
      api,
      'Fixed: RLS enabled · no applicable policy',
      960,
      309,
      25,
      themeColors.yellow,
      'center',
    );
    const roles =
      currentBeat === 0
        ? [
            ['ordinary role', false],
            ['enabled RLS; no applicable policy', false],
          ]
        : [
            ['ordinary role', false],
            ['table owner', true],
            ['owner + FORCE', false],
            ['superuser / BYPASSRLS', true],
          ];
    roles.forEach(([name, pass], i) => {
      const y = 355 + i * 140;
      drawExtendedSqlCard(ctx, api, name, 160, y, 900, 85, themeColors.blue, 31);
      drawExtendedSqlArrow(
        ctx,
        api,
        {
          x: 1080,
          y: y + 42,
        },
        {
          x: 1240,
          y: y + 42,
        },
        currentBeat === 0 ? stepProgress(0, 1) : stepProgress(1, Math.min(i, 3)),
        pass ? themeColors.green : themeColors.pink,
      );
      if (currentBeat === 0 ? stepComplete(0, 1) : stepComplete(1, Math.min(i, 3)))
        drawExtendedSqlCard(
          ctx,
          api,
          pass ? 'RLS bypass' : 'default deny',
          1270,
          y,
          490,
          85,
          pass ? themeColors.yellow : themeColors.pink,
          31,
        );
    });
    drawExtendedSqlFooter(
      ctx,
      api,
      'This view isolates RLS behavior; trusted application predicates still belong in every retrieval route',
    );
  });
}
export default {
  id: 'role-boundary',
  draw: drawRoleBoundary,
  cues: [
    'role-boundary-b1',
    'role-boundary-voice-1',
    'role-boundary-step-0-1',
    'role-boundary-step-0-2',
    'role-boundary-step-0-3',
    'role-boundary-b2',
    'role-boundary-voice-2',
    'role-boundary-step-1-1',
    'role-boundary-step-1-2',
    'role-boundary-step-1-3',
    'role-boundary-step-1-4',
  ],
};
