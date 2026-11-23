import { PROTOCOL_VERSION } from '../fixtures.mjs';
import { discoveryFixture } from '../model.mjs';
import { chip, footer, panel, text } from '../defaults.mjs';
export function drawDiscoverAndNegotiate(ctx, scene, state, api) {
  return api.focus.target('discover-and-negotiate-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const cueVisible = (key) => api.focus.visible(`t-discover-and-negotiate-${key}`);
    const cueComplete = (key) =>
      api.focus.cue(`t-discover-and-negotiate-${key}`)?.phase === 'after';
    {
      chip(ctx, api, 'server/discover', 150, 245, 590, themeColors.blue, 75, 32);
      chip(ctx, api, '2026-07-28 · tools capability', 880, 245, 900, themeColors.cyan, 75, 30);
      const show = cueVisible('requests') || currentBeat > 1,
        fixture = discoveryFixture();
      fixture.requests.forEach((r, i) => {
        const x = 150 + i * 870,
          col = i ? themeColors.yellow : themeColors.cyan;
        panel(ctx, api, x, 395, 760, 370, col);
        text(ctx, api, `request ${i ? 'B' : 'A'} · ID ${r.id}`, x + 380, 450, 35, col);
        text(ctx, api, 'same operation: rollback v17', x + 380, 525, 29, themeColors.muted);
        if (show) {
          text(ctx, api, `version: ${PROTOCOL_VERSION}`, x + 380, 605, 31, themeColors.blue);
          text(
            ctx,
            api,
            i ? 'clientCapabilities: {}' : 'clientCapabilities: {"elicitation": {"form": {}}}',
            x + 380,
            690,
            i ? 29 : 25,
            col,
          );
        }
      });
      const { formReply, missingReply } = fixture;
      if (api.focus.cue('discovery-allowed')?.phase === 'after')
        text(
          ctx,
          api,
          `ID ${formReply.id}   ·   ${formReply.result.resultType}`,
          530,
          817,
          32,
          themeColors.green,
        );
      if (cueComplete('missing')) {
        const { code, data } = missingReply.error;
        const required = JSON.stringify(data.requiredCapabilities);
        text(
          ctx,
          api,
          `ID ${missingReply.id} · error ${code} · requiredCapabilities: ${required}`,
          960,
          860,
          32,
          themeColors.red,
        );
      } else if (cueVisible('compare'))
        text(
          ctx,
          api,
          'Compare the declaration attached to each individual request',
          960,
          860,
          30,
          themeColors.yellow,
        );
      if (cueComplete('missing'))
        footer(ctx, api, 'Client name for diagnostics   /   caller identity from authentication');
    }
  });
}
export default {
  id: 'discover-and-negotiate',
  draw: drawDiscoverAndNegotiate,
  cues: [
    'discovery-allowed',
    'discover-and-negotiate-beat-1-focus-1',
    't-discover-and-negotiate-discover',
    'discover-and-negotiate-beat-2-focus-1',
    't-discover-and-negotiate-requests',
    'discover-and-negotiate-beat-3-focus-1',
    'discovery-missing-result',
    't-discover-and-negotiate-compare',
    't-discover-and-negotiate-missing',
  ],
};
