import { opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawPublication(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'publication');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Tenant + normalized request + key bind the durable job'
        : currentBeat === 1
          ? 'Check the exact final derivative bytes privately'
          : 'Commit matching evidence before exposing the immutable URL',
    );
    if (currentBeat === 0) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['Tenant', 'Key', 'Request hash', 'Current attempt'],
          ['T1', 'K17', 'H-request', '5'],
          ['T1 retry', 'K17', 'same hash', 'same job'],
          ['T1 conflict', 'K17', 'changed prompt / route', 'reject'],
        ],
        170,
        390,
        1580,
        360,
        themeColors.cyan,
        28,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Expiring leases + increasing attempt fence · authorize status and asset reads separately',
      );
    } else if (currentBeat === 1) {
      drawConstructionBox(ctx, api, 'Checked source H0', 170, 425, 650, themeColors.blue, 120, 35);
      drawConstructionBox(
        ctx,
        api,
        'Resized derivative H1',
        1090,
        425,
        650,
        themeColors.pink,
        120,
        35,
      );
      drawConstructionArrow(ctx, api, 850, 485, 1050, 485);
      drawConstructionBox(
        ctx,
        api,
        'Privately watermark + check H1 itself',
        350,
        770,
        1220,
        themeColors.yellow,
        120,
        35,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Uncertain detector result leaves origin unresolved · disable unchecked later transforms',
      );
    } else {
      const names = [
        'Attempt still current?',
        'Checked digest = asset?',
        'Manifest committed?',
        'Immutable URL',
      ];
      names.forEach((v, i) => {
        drawConstructionBox(
          ctx,
          api,
          v,
          140 + i * 445,
          480,
          390,
          i <= Math.floor(progress * 4) ? themeColors.cyan : themeColors.muted,
          120,
          26,
        );
        if (i < 3) drawConstructionArrow(ctx, api, 545 + i * 445, 540, 570 + i * 445, 540);
      });
      drawConstructionFooter(
        ctx,
        api,
        'Real backend transaction required · failed objects private · retries reuse committed bytes',
      );
    }
    return;
  }
}
export default {
  id: 'publication',
  draw: drawPublication,
  cues: ['df-publication-0', 'df-publication-1', 'df-publication-2'],
};
