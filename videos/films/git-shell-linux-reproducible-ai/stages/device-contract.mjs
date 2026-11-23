import { deviceEnumeration } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { caption, mark, route, tag, text, transfer } from '../defaults.mjs';
export function drawDeviceContract(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    first = cueProgress(state, 'mask-device-map', 0),
    second = cueProgress(state, 'mask-second-device', 0),
    empty = cueProgress(state, 'empty-device-mask', 1),
    unset = cueProgress(state, 'unset-device-mask', 1),
    evidence = cueProgress(state, 'device-probe-boundary', 1);
  const visible =
    currentBeat === 0
      ? deviceEnumeration([0, 1, 2], '2,0')
      : unset === 1
        ? deviceEnumeration([0, 1, 2], null)
        : [];
  mark(api, 'device-enumeration', () => {
    text(ctx, api, 'Supplied host · physical identity', 480, 320, 34, api.C.muted, 'center');
    text(ctx, api, 'Application-local numbering', 1440, 320, 34, api.C.muted, 'center');
    [0, 1, 2].forEach((n, i) =>
      tag(
        ctx,
        api,
        `physical ${n}`,
        180,
        410 + i * 150,
        530,
        [api.C.blue, api.C.yellow, api.C.cyan][n],
        36,
      ),
    );
    text(
      ctx,
      api,
      currentBeat === 0 ? 'mask="2,0"' : unset === 1 ? 'mask unset' : 'mask=""',
      960,
      350,
      33,
      api.C.yellow,
      'center',
      true,
    );
    visible.forEach(({ logical, physical }) => {
      const p = currentBeat === 0 ? (logical === 0 ? first : second) : unset;
      const y1 = 444 + physical * 150,
        y2 = 444 + logical * 150;
      if (p > 0) {
        route(
          ctx,
          api,
          [
            [740, y1],
            [850 + logical * 60, y1],
            [850 + logical * 60, y2],
            [1190, y2],
          ],
          [api.C.blue, api.C.yellow, api.C.cyan][physical],
        );
        transfer(
          ctx,
          api,
          `physical ${physical}`,
          [750, y1 - 34],
          [1200, y2 - 34],
          p,
          [api.C.blue, api.C.yellow, api.C.cyan][physical],
          260,
        );
        if (p === 1)
          tag(
            ctx,
            api,
            `app ${logical} → physical ${physical}`,
            1220,
            410 + logical * 150,
            520,
            [api.C.blue, api.C.yellow, api.C.cyan][physical],
            30,
          );
      }
    });
  });
  if (currentBeat === 0)
    caption(
      ctx,
      api,
      'The list order determines application IDs; physical device 1 is not selected',
    );
  else {
    mark(api, 'device-empty-mask', () => {
      text(
        ctx,
        api,
        unset === 1
          ? 'Unset: all three available devices'
          : empty === 1
            ? 'Visible application devices: 0'
            : 'Visible application devices: ?',
        1430,
        unset === 1 ? 875 : 570,
        unset === 1 ? 28 : 36,
        empty === 1 ? api.C.yellow : api.C.muted,
        'center',
      );
    });
    mark(api, 'device-evidence', () => {
      text(
        ctx,
        api,
        evidence === 1
          ? 'driver view + mask + interpreter + framework probe'
          : 'Record the four observations together',
        960,
        940,
        31,
        evidence === 1 ? api.C.cyan : api.C.muted,
        'center',
      );
    });
    if (evidence < 1)
      caption(
        ctx,
        api,
        'Visibility does not install a driver or repair an incompatible Python package',
      );
  }
}
export default {
  id: 'device-contract',
  draw: drawDeviceContract,
  cues: [
    'mask-device-map',
    'mask-second-device',
    'empty-device-mask',
    'device-probe-boundary',
    'unset-device-mask',
  ],
};
