// Cinematic Vizmatic 0.10.0 stage film for Embedding Geometry (24 scenes).
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyEmbeddingInvariants } from './parts.mjs';
import authorizedFunnel from './scenes/authorized-funnel.mjs';
import binaryPack from './scenes/binary-pack.mjs';
import calibration from './scenes/calibration.mjs';
import coordinates from './scenes/coordinates.mjs';
import deployment from './scenes/deployment.mjs';
import freshQuery from './scenes/fresh-query.mjs';
import graph from './scenes/graph.mjs';
import indexMemory from './scenes/index-memory.mjs';
import magnitude from './scenes/magnitude.mjs';
import normContract from './scenes/norm-contract.mjs';
import normalize from './scenes/normalize.mjs';
import opening from './scenes/opening.mjs';
import payload from './scenes/payload.mjs';
import pqCodebooks from './scenes/pq-codebooks.mjs';
import pqDistance from './scenes/pq-distance.mjs';
import pqTransform from './scenes/pq-transform.mjs';
import prefix from './scenes/prefix.mjs';
import quantization from './scenes/quantization.mjs';
import rulers from './scenes/rulers.mjs';
import scalarCodec from './scenes/scalar-codec.mjs';
import scalarScales from './scenes/scalar-scales.mjs';
import signAngle from './scenes/sign-angle.mjs';
import synthesis from './scenes/synthesis.mjs';
import wideArithmetic from './scenes/wide-arithmetic.mjs';

export default cinematicLesson({
  id: 'embedding-geometry',
  accent: COSMOS.cyan,
  invariants: verifyEmbeddingInvariants,
  scenes: {
    opening,
    coordinates,
    rulers,
    magnitude,
    normalize,
    'norm-contract': normContract,
    prefix,
    payload,
    quantization,
    'scalar-codec': scalarCodec,
    'scalar-scales': scalarScales,
    calibration,
    'wide-arithmetic': wideArithmetic,
    'pq-codebooks': pqCodebooks,
    'pq-distance': pqDistance,
    'pq-transform': pqTransform,
    'binary-pack': binaryPack,
    'sign-angle': signAngle,
    graph,
    'index-memory': indexMemory,
    'authorized-funnel': authorizedFunnel,
    deployment,
    synthesis,
    'fresh-query': freshQuery,
  },
});
