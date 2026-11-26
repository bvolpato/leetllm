// Cinematic Vizmatic 0.10.0 stage film for GEMM at the edge of a tile (16 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyGemmInvariants } from './parts.mjs';
import accumulate from './scenes/accumulate.mjs';
import addresses from './scenes/addresses.mjs';
import asyncOwnership from './scenes/async-ownership.mjs';
import banks from './scenes/banks.mjs';
import dot from './scenes/dot.mjs';
import edgeOwnership from './scenes/edge-ownership.mjs';
import hierarchy from './scenes/hierarchy.mjs';
import intro from './scenes/intro.mjs';
import naive from './scenes/naive.mjs';
import precisionContract from './scenes/precision-contract.mjs';
import registerBlocking from './scenes/register-blocking.mjs';
import rooflineCheck from './scenes/roofline-check.mjs';
import shape from './scenes/shape.mjs';
import tensorcores from './scenes/tensorcores.mjs';
import tile from './scenes/tile.mjs';
import transfer from './scenes/transfer.mjs';

export default cinematicLesson({
  id: 'gemm',
  accent: COSMOS.cyan,
  invariants: verifyGemmInvariants,
  scenes: {
    intro,
    dot,
    naive,
    addresses,
    tile,
    accumulate,
    'edge-ownership': edgeOwnership,
    banks,
    hierarchy,
    'register-blocking': registerBlocking,
    tensorcores,
    'precision-contract': precisionContract,
    'async-ownership': asyncOwnership,
    shape,
    'roofline-check': rooflineCheck,
    transfer,
  },
});
