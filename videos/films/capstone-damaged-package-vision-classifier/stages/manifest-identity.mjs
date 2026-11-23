import { visionRows } from '../fixtures.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionLine, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawManifestIdentity(ctx, scene, state, api) {
  const frameState = visionFrame('manifest-identity', state);
  return api.focus.target('dv-manifest-identity-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const groups = [
        ['train', 'days 1–2', themeColors.blue],
        ['validation', 'days 3–4', themeColors.pink],
        ['test', 'days 5–11', themeColors.green],
      ];
      groups.forEach(([split, days, color], i) => {
        const y = 330 + i * 175,
          rows = visionRows.filter((row) => row.photo.split === split);
        visionText(ctx, api, split.toUpperCase(), 160, y + 25, 28, color);
        visionText(ctx, api, days, 160, y + 68, 24, themeColors.muted);
        rows.forEach((row, k) => {
          const x = 480 + k * 180;
          visionCard(ctx, api, row.photo.photo_id, x, y - 15, 160, 82, color);
          visionText(
            ctx,
            api,
            'day ' + row.photo.capture_day,
            x + 80,
            y + 108,
            25,
            themeColors.muted,
            'center',
          );
          if (k && rows[k - 1].photo.case_id === row.photo.case_id)
            visionLine(ctx, api, x - 20, y + 24, x, y + 24, color, 5);
        });
      });
      if (currentBeat === 2 && resultComplete('quarantine', 2)) {
        api.rect(ctx, 370, 870, 1360, 68, themeColors.panel, themeColors.pink, 7);
        visionText(
          ctx,
          api,
          'One case spans the cutoff → quarantine all its views',
          1050,
          914,
          28,
          themeColors.pink,
          'center',
        );
      } else {
        visionValue(
          ctx,
          api,
          'Photos',
          '2 / 2 / 7',
          430,
          875,
          resultComplete('manifest-splits', 0),
          themeColors.cyan,
        );
        visionValue(
          ctx,
          api,
          'Physical cases',
          '1 / 2 / 6',
          1120,
          875,
          resultComplete('manifest-splits', 0),
          themeColors.green,
        );
      }
      visionNote(
        ctx,
        api,
        currentBeat === 1
          ? 'File hashes identify bytes; physical-case identity also groups recompressed views.'
          : 'Eleven photos keep nine physical-case identities. Label availability is a separate clock.',
      );
    }
  });
}
export default {
  id: 'manifest-identity',
  draw: drawManifestIdentity,
  cues: [
    'dv-manifest-identity-0',
    'dv-manifest-identity-operation-0',
    'dv-manifest-total',
    'dv-manifest-splits',
    'dv-manifest-identity-1',
    'dv-manifest-identity-operation-1',
    'dv-manifest-identity-2',
    'dv-manifest-identity-operation-2',
    'dv-quarantine',
  ],
};
