import { expertPackState } from '../construction.mjs';
import { sentenceCues } from '../fixtures.mjs';
import { drawRowPack } from '../row-pack.mjs';

export function drawPacking(ctx, scene, state, api) {
  const pack = expertPackState(scene.id, state);
  const settled = pack.allocationReady;
  const result = pack.totalsReady
    ? `${pack.useful} assignments  +  ${pack.padding} padding  =  ${pack.capacity} reserved`
    : `${pack.useful} assignments follow the same routes`;
  drawRowPack(ctx, api, pack, {
    limit: 1024,
    title: `${pack.alignment} rows per block`,
    result,
    showCapacity: settled,
    pin: settled ? `t7 · row ${pack.segments[2].start}` : 't7',
    detail: pack.totalsReady
      ? `Two projections · ${(pack.usefulFlops / 1e9).toFixed(2)} useful GFLOPs · ${(pack.paddedFlops / 1e9).toFixed(2)} GFLOPs if every reserved row runs`
      : 'Packed row offsets count from zero',
  });
}
export default { id: 'packing', draw: drawPacking, cues: sentenceCues('packing') };
