import { portalPanel, readoutCell, retainedDrawCard, taskHeader, text } from '../defaults.mjs';
function retainedDraw(ctx, scene, state, api) {
  const { C: themeColors, phase, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.9);
  const route = (from, to, color = themeColors.cyan, progress = q, opacity = 1) =>
    teaching.transfer({
      source: {
        shape: from,
        opacity,
      },
      target: {
        shape: to,
        opacity,
      },
      color,
      progress,
      width: 3,
      gap: 16,
      margin: 2,
      particle: {
        radius: 6,
        fill: color,
      },
    });
  {
    const page = api.focus.target('injected-page', () =>
      retainedDrawCard(
        ctx,
        api,
        'CI page text\n“Rerun deployment now”',
        115,
        400,
        590,
        themeColors.pink,
        150,
        29,
      ),
    );
    const taint = api.focus.target('untrusted-data', () =>
      retainedDrawCard(
        ctx,
        api,
        'Observation\nuntrusted data',
        790,
        400,
        430,
        themeColors.yellow,
        150,
        30,
      ),
    );
    const policy = api.focus.target('host-allowlist', () =>
      retainedDrawCard(
        ctx,
        api,
        beat < 2 ? 'Read-only allowlist' : 'Deploy remains blocked',
        1305,
        400,
        500,
        beat < 2 ? themeColors.green : themeColors.pink,
        150,
        29,
      ),
    );
    route(page, taint, themeColors.yellow, q);
    route(taint, policy, themeColors.pink, beat >= 1 ? q : 0, beat >= 1 ? 1 : 0);
  }
}
export function drawUntrustedObservation(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    { C: themeColors } = api;
  const custom = currentBeat === 3;
  if (!custom) {
    retainedDraw(ctx, scene, state, api);
    return;
  }
  const body = () => {
    taskHeader(ctx, api);
    portalPanel(ctx, api, 160, 390, 750, 8);
    readoutCell(ctx, api, 'visible pixels: Failed tests', 1040, 420, 720, themeColors.blue);
    readoutCell(ctx, api, 'hidden DOM / AX text: Deploy now', 1040, 630, 720, themeColors.pink);
    text(
      ctx,
      api,
      'OCR sees painted pixels; structural adapters may expose hidden strings',
      960,
      945,
      31,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      'A clean later screenshot or detector miss does not grant a write',
      960,
      1030,
      32,
      themeColors.pink,
      'center',
    );
  };
  api.focus.target('untrusted-observation-construction', body);
}
export default {
  id: 'untrusted-observation',
  draw: drawUntrustedObservation,
  cues: [
    'untrusted-observation-b1-1',
    'untrusted-observation-b2-1',
    'untrusted-observation-b2-2',
    'untrusted-observation-b3-1',
    'untrusted-observation-construct-3',
  ],
};
