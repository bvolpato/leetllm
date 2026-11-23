import { apiChapterState } from '../construction.mjs';
import { chapterText, footer, heading, panel, strokeLine, travel } from '../defaults.mjs';
export function drawSdkWire(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('sdk-wire', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'OpenAI SDK 3.16.2 · HTTPX2 2.13.0 · local MockTransport');
      panel(
        ctx,
        api,
        '/v1/responses\nstrict schema + trusted age 45',
        250,
        410,
        1420,
        150,
        themeColors.blue,
        32,
      );
      travel(
        ctx,
        api,
        'request bytes',
        {
          x: 300,
          y: 725,
        },
        {
          x: 1280,
          y: 725,
        },
        u,
        themeColors.cyan,
        300,
      );
      footer(ctx, api, 'Placeholder key and model; zero provider requests / model tokens');
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Four constructed replies pass through the same real adapter');
      const rows = [
        ['eligible / 30 / P-7', 'accepted'],
        ['eligible / 90 / P-7', 'policy mismatch'],
        ['refusal content', 'refusal'],
        ['token-limited status', 'incomplete output'],
      ];
      rows.forEach(([a, z], i) => {
        panel(ctx, api, a, 220, 400 + i * 125, 800, 90, themeColors.blue, 28);
        if (u > (i + 1) / 5)
          panel(
            ctx,
            api,
            z,
            1130,
            400 + i * 125,
            570,
            90,
            i ? themeColors.pink : themeColors.green,
            28,
          );
      });
    } else if (currentBeat === 2) {
      heading(ctx, api, 'Which certificates does the deployed client trust?');
      panel(
        ctx,
        api,
        'SDK + HTTPX2\nconfigured connection pool',
        210,
        420,
        660,
        160,
        themeColors.blue,
        31,
      );
      strokeLine(ctx, api, 960, 360, 960, 940, themeColors.yellow, 4);
      panel(
        ctx,
        api,
        'OS trust store\ncontainer CA / corporate proxy',
        1070,
        420,
        650,
        160,
        themeColors.yellow,
        30,
      );
      panel(ctx, api, 'transport timeout: 5 s', 300, 770, 580, 100, themeColors.cyan, 30);
      panel(ctx, api, 'overall task deadline', 1070, 770, 580, 100, themeColors.pink, 30);
      footer(
        ctx,
        api,
        'One retry owner · inspect active certificates and the full live connection path',
      );
    } else {
      heading(ctx, api, 'store:false controls one data category');
      const labels = ['Responses app state', 'abuse monitoring', 'tool retention', 'cache policy'];
      labels.forEach((v, i) => {
        panel(
          ctx,
          api,
          v,
          230 + i * 420,
          440,
          365,
          150,
          i === 0 ? themeColors.green : themeColors.yellow,
          26,
        );
        if (i === 0 && u > 0.4)
          chapterText(ctx, api, 'opt out', 410 + i * 420, 730, 32, themeColors.green, 'center');
        else
          chapterText(
            ctx,
            api,
            'check separately',
            410 + i * 420,
            730,
            25,
            themeColors.yellow,
            'center',
          );
      });
      footer(
        ctx,
        api,
        'Endpoint + organization + all tools determine the complete sensitive-data path',
      );
    }
  }
}
export default {
  id: 'sdk-wire',
  draw: drawSdkWire,
  cues: ['ap-sdk-wire-0', 'ap-sdk-wire-1', 'ap-sdk-wire-2', 'ap-sdk-wire-3'],
};
