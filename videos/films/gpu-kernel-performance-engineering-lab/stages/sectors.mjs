import { sampleModel } from '../model.mjs';
import { text } from '../defaults.mjs';
export function drawSectors(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('sectors', state),
    currentBeat = modelState.step;
  {
    text(
      ctx,
      api,
      currentBeat === 0
        ? modelState.storeProgress === 0
          ? 'READ · aligned input · address = lane × 4 bytes'
          : modelState.converted === 0
            ? 'NAIVE STORE · address = lane × 4096 × 4 bytes'
            : `Selecting naive STORE addresses · ${32 - modelState.converted}/32 lanes`
        : modelState.converted === 32
          ? 'Tiled output · all lanes adjacent'
          : `Switching store addresses · ${modelState.converted}/32 lanes adjacent`,
      150,
      285,
      36,
    );
    api.focus.target(
      'sectors-s-addresses-slice-0-16-map-i-string-i-s-addresses-slice-16-map-i-str',
      () =>
        teaching.grid({
          x: 160,
          y: 350,
          width: 1600,
          height: 180,
          rows: 2,
          columns: 16,
          labels: [
            modelState.addresses.slice(0, 16).map((_, i) => String(i)),
            modelState.addresses.slice(16).map((_, i) => String(i + 16)),
          ],
          fill: themeColors.panel,
          stroke: themeColors.muted,
          textColor: themeColors.ink,
          fontSize: 29,
          highlights: modelState.addresses.map((_, i) => ({
            row: Math.floor(i / 16),
            column: i % 16,
            fill: i < modelState.converted ? '#89ddeb44' : '#ef9ac822',
            stroke: i < modelState.converted ? themeColors.cyan : themeColors.pink,
          })),
        }),
    );
    text(
      ctx,
      api,
      '32 lanes · 128 useful bytes · touched 32-byte sector IDs below',
      960,
      585,
      30,
      themeColors.blue,
      'center',
    );
    api.focus.target('sectors-array-from-length-4-r-array-from-length-8-c-s-sectors-r-8-c', () =>
      teaching.grid({
        x: 250,
        y: 625,
        width: 1420,
        height: 220,
        rows: 4,
        columns: 8,
        labels: Array.from(
          {
            length: 4,
          },
          (_, r) =>
            Array.from(
              {
                length: 8,
              },
              (_, c) => modelState.sectors[r * 8 + c] ?? '',
            ),
        ),
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        fontSize: 27,
        highlights: modelState.sectors.map((_, i) => ({
          row: Math.floor(i / 8),
          column: i % 8,
          fill: '#89ddeb33',
          stroke: themeColors.cyan,
        })),
      }),
    );
    text(
      ctx,
      api,
      modelState.sectors.length +
        ' touched sectors · ' +
        (100 * modelState.fraction).toFixed(1) +
        '% payload fraction',
      960,
      915,
      36,
      themeColors.yellow,
      'center',
    );
    api.focus.target(
      'sectors-32-byte-sector-address-model-physical-hbm-traffic-requires-counters',
      () =>
        text(
          ctx,
          api,
          '32-byte-sector address model · physical device-memory traffic requires counters',
          960,
          975,
          29,
          themeColors.muted,
          'center',
        ),
    );
  }
}
export default {
  id: 'sectors',
  draw: drawSectors,
  cues: [
    'sectors-beat-1-focus-1',
    'sectors-beat-1-focus-2',
    'sectors-naive-store',
    'sectors-beat-2-focus-1',
    'sectors-beat-2-focus-2',
  ],
};
