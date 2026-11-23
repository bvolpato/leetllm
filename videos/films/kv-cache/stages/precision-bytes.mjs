import { fadeIn, Node, rect, tex } from 'vizmatic/stage';
import { billFor } from '../model.mjs';
export function buildPrecisionBytes(
  stage,
  shrink,
  { M, place, crossfade, bar, growBar, arrive, clearFirst, handoff },
  { heads },
  {
    fLeft,
    fLayers,
    fHeads,
    fNumbers,
    fBytes,
    fCaptions,
    byteCaptions,
    r40,
    r320c,
    r160,
    blockFaces,
    share2,
    shLayerTag,
    shHeadTag,
    PL,
    PW2,
  },
  { switchParts },
) {
  // Lower precision: the same heads, each number stored in half the bytes.
  const BYTE = 110;
  const byteRow = (name, count, y, color) => {
    const node = new Node();
    node.add(
      place(
        M(name, {
          size: 50,
          color,
        }),
        PL,
        y,
      ),
    );
    for (let i = 0; i < count; i += 1)
      node.add(
        rect(BYTE, BYTE, {
          radius: 12,
          fill: color,
          stroke: null,
        }).at(PL + 300 + i * (BYTE + 14), y),
        M('byte', {
          size: 38,
          color: 'bg',
        }).at(PL + 300 + i * (BYTE + 14), y),
      );
    return node;
  };
  const bits16 = byteRow('16 bit', 2, -190, 'orange'),
    bits8 = byteRow('8 bit', 1, -60, 'teal');
  const backNote = place(
    M('with the real 8 KV heads', {
      size: 42,
      color: 'teal',
    }),
    PL,
    40,
  );
  const SCALE8 = PW2 / billFor(8);
  const rowFor16 = bar(PL, 130, billFor(8) * SCALE8, 70, 'orange'),
    name16 = place(
      M(`${billFor(8)} KiB`, {
        size: 46,
        color: 'bg',
      }),
      PL + 20,
      130,
    ).zIndex(1);
  const eightBitLimit = place(
    M('if kernels support it and quality holds', {
      size: 32,
      color: 'dim',
    }),
    PL,
    300,
  );
  const row8 = growBar(PL, 230, (billFor(8) / 2) * SCALE8, 70, 'teal'),
    name8 = place(
      M(`${billFor(8) / 2} KiB`, {
        size: 46,
        color: 'bg',
      }),
      PL + 20,
      230,
    ).zIndex(1);
  const pending = tex('= \\ ?', { size: 76, color: 'ink' })
    .moveTo([0, r160.center[1]])
    .alignTo([r160.center[0] - r160.width / 2, 0], 'left');
  shrink.on('precision', () =>
    handoff(
      switchParts,
      () =>
        arrive(
          fadeIn(bits16),
          fadeIn(backNote),
          ...crossfade(fHeads[2], fHeads[1]),
          ...crossfade(r40, r320c),
          heads.to(8),
          share2.to(1),
          fadeIn([rowFor16, name16]),
          {
            duration: 0.6,
          },
        ),
      clearFirst,
    ),
  );
  shrink.on('half', () =>
    stage.play(
      fadeIn(bits8, {
        shift: [-14, 0],
      }),
      ...crossfade(fBytes[0], fBytes[1]),
      ...crossfade(byteCaptions[0], byteCaptions[1]),
      ...crossfade(r320c, pending),
      { duration: 0.7 },
    ),
  );
  shrink.after('half', () =>
    stage.play(
      ...crossfade(pending, r160),
      fadeIn(row8.node),
      row8.grow({
        duration: 0.7,
      }),
      fadeIn([name8, eightBitLimit]),
      {
        duration: 0.7,
      },
    ),
  );
  const blockParts = [
    ...blockFaces,
    fLeft,
    fLayers,
    fHeads[1],
    fNumbers,
    fBytes[1],
    ...fCaptions,
    byteCaptions[1],
    r160,
    pending,
    shLayerTag,
    shHeadTag,
    bits16,
    bits8,
    backNote,
    rowFor16,
    name16,
    row8.node,
    name8,
    eightBitLimit,
  ];
  return {
    blockParts,
  };
}
