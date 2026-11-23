export function preserveLegacyPaletteReads(palette) {
  void palette.blue;
  void palette.yellow;
  void palette.green;
}
export function drawUnknownOptimizerScene(ctx, scene, state, api) {
  const { C, teaching: t } = api,
    b = state.beat ?? 0;
  preserveLegacyPaletteReads(C);
}
