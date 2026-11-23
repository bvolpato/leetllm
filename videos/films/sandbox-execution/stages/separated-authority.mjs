import { authorityFlow } from '../model.mjs';
import {
  drawSandboxArtifactHeader,
  drawSandboxCard,
  drawSandboxCodePanel,
  drawSandboxStage,
  drawSandboxTransfer,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeText,
} from '../defaults.mjs';
export function paintSeparatedAuthorityLegacy(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  phase,
  t,
  currentBeat,
  beatProgress,
  routeProgress,
) {
  const flow = authorityFlow();
  const supervisor = api.focus.target('trusted-supervisor', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'TRUSTED SUPERVISOR\npolicy · runtime · timeout',
      120,
      330,
      490,
      themeColors.yellow,
      145,
      27,
    ),
  );
  const worker = api.focus.target('untrusted-worker', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'UNTRUSTED WORKER\ncandidate · dependencies',
      715,
      330,
      490,
      themeColors.pink,
      145,
      27,
    ),
  );
  const validator = api.focus.target('trusted-validator', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'TRUSTED VALIDATOR\nexpected outputs · rules',
      1310,
      330,
      490,
      themeColors.green,
      145,
      27,
    ),
  );
  drawSandboxTransfer(
    ctx,
    api,
    themeColors,
    routeProgress,
    t,
    supervisor,
    worker,
    themeColors.blue,
    routeProgress,
  );
  drawSandboxTransfer(
    ctx,
    api,
    themeColors,
    routeProgress,
    t,
    worker,
    validator,
    themeColors.cyan,
    currentBeat >= 1 ? routeProgress : 0,
    currentBeat >= 1 ? 1 : 0,
  );
  const identity = api.focus.target('frozen-artifact', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      `Frozen artifact\n${flow.artifact.base} · ${flow.artifact.tree}`,
      570,
      640,
      820,
      themeColors.blue,
      130,
      29,
    ),
  );
}
export function paintSeparatedAuthority(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  currentBeat,
  beatProgress,
  id,
  on,
  done,
) {
  drawSandboxArtifactHeader(ctx, api, themeColors);
  if (currentBeat < 3) {
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Trusted supervisor',
      ['Freeze M: base + files', 'image + dependencies + grader'],
      130,
      350,
      720,
      themeColors.yellow,
    );
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Untrusted worker',
      ['Parser P2 + dependencies', 'returns bounded output'],
      1040,
      350,
      740,
      themeColors.pink,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 880, 460, 1010, 460, themeColors.cyan);
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Trusted validator outside worker',
      [
        'Expected output stays protected',
        'Compare observed result',
        'Bind verdict to M; authenticate receipt',
      ],
      620,
      690,
      1040,
      themeColors.green,
    );
    drawSandboxUpgradeArrow(ctx, api, themeColors, 1410, 590, 1410, 660, themeColors.cyan);
  } else {
    const attacked = on('patch-memory'),
      external = on('external-compare');
    drawSandboxCodePanel(
      ctx,
      api,
      themeColors,
      c,
      'Read-only tests/test_oracle.py',
      ['READ: private cases remain visible', 'WRITE: denied by read-only mount'],
      130,
      330,
      1660,
      themeColors.blue,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      attacked
        ? 'Shared interpreter: assertion patched → exit 0'
        : 'Read-only disk does not isolate interpreter memory',
      960,
      625,
      36,
      attacked ? themeColors.pink : themeColors.yellow,
      'center',
    );
    if (external) {
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        'Candidate returns []',
        130,
        755,
        690,
        110,
        themeColors.pink,
        34,
      );
      drawSandboxUpgradeArrow(ctx, api, themeColors, 850, 810, 1040, 810, themeColors.cyan);
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        'External oracle: [] ≠ expected',
        1080,
        755,
        710,
        110,
        themeColors.green,
        30,
      );
    }
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Classroom manifest M proves only its recorded checks when a trusted acceptance step compares it',
  );
}
export function drawSeparatedAuthority(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintSeparatedAuthority,
    paintSeparatedAuthorityLegacy,
  );
}
export default {
  id: 'separated-authority',
  draw: drawSeparatedAuthority,
  cues: [
    'separated-authority-b1-1',
    'separated-authority-b1-2',
    'separated-authority-b2-1',
    'separated-authority-b3-1',
    'separated-authority-extension-4',
    'separated-authority-readonly-attack',
    'separated-authority-patch-memory',
    'separated-authority-external-compare',
  ],
};
