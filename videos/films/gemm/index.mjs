import { drawUnrecognizedScene } from './compatibility.mjs';
import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import dot from './stages/dot.mjs';
import naive from './stages/naive.mjs';
import addresses from './stages/addresses.mjs';
import tile from './stages/tile.mjs';
import accumulate from './stages/accumulate.mjs';
import banks from './stages/banks.mjs';
import hierarchy from './stages/hierarchy.mjs';
import registerBlocking from './stages/register-blocking.mjs';
import edgeOwnership from './stages/edge-ownership.mjs';
import tensorcores from './stages/tensorcores.mjs';
import precisionContract from './stages/precision-contract.mjs';
import asyncOwnership from './stages/async-ownership.mjs';
import shape from './stages/shape.mjs';
import rooflineCheck from './stages/roofline-check.mjs';
import transfer from './stages/transfer.mjs';
export { bankAddress, bf16, registerDemand } from './arithmetic.mjs';
export {
  doubleBuffer,
  fragmentAccumulation,
} from './construction.mjs';
export { A, B } from './fixtures.mjs';
export { partialProduct } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'gemm',
  validateModel,
  scenes: [
    intro,
    dot,
    naive,
    addresses,
    tile,
    accumulate,
    edgeOwnership,
    banks,
    hierarchy,
    registerBlocking,
    tensorcores,
    precisionContract,
    asyncOwnership,
    shape,
    rooflineCheck,
    transfer,
  ],
});
export function draw(ctx, scene, state, api) {
  if (!definition.scenes.some((candidate) => candidate.id === scene.id))
    return drawUnrecognizedScene(ctx, scene, state, api);
  return definition.draw(ctx, scene, state, api);
}
export default Object.freeze({ ...definition, draw });
