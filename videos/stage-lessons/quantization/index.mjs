// Quantization: 31-scene full-bleed cinematic Vizmatic 0.10.0 stage film.
import { COSMOS, cinematicLesson } from '../cinematic-kit.mjs';
import { verifyQuantizationInvariants } from './parts.mjs';
import affineRange from './scenes/affine-range.mjs';
import artifactLineage from './scenes/artifact-lineage.mjs';
import awqSearch from './scenes/awq-search.mjs';
import awq from './scenes/awq.mjs';
import benchmark from './scenes/benchmark.mjs';
import budgetInventory from './scenes/budget-inventory.mjs';
import codecContract from './scenes/codec-contract.mjs';
import containerLayout from './scenes/container-layout.mjs';
import curvature from './scenes/curvature.mjs';
import diagnose from './scenes/diagnose.mjs';
import factorOrder from './scenes/factor-order.mjs';
import freshQuantization from './scenes/fresh-quantization.mjs';
import gguf from './scenes/gguf.mjs';
import gptqLayout from './scenes/gptq-layout.mjs';
import gptq from './scenes/gptq.mjs';
import granularity from './scenes/granularity.mjs';
import grid from './scenes/grid.mjs';
import groupSum from './scenes/group-sum.mjs';
import heldOut from './scenes/held-out.mjs';
import intro from './scenes/intro.mjs';
import kernelPath from './scenes/kernel-path.mjs';
import offloadCount from './scenes/offload-count.mjs';
import output from './scenes/output.mjs';
import pack from './scenes/pack.mjs';
import pairedEvaluation from './scenes/paired-evaluation.mjs';
import payload from './scenes/payload.mjs';
import poolSubtraction from './scenes/pool-subtraction.mjs';
import precisionRoles from './scenes/precision-roles.mjs';
import precisionSweep from './scenes/precision-sweep.mjs';
import q4kUnpack from './scenes/q4k-unpack.mjs';
import roofline from './scenes/roofline.mjs';

export default cinematicLesson({
  id: 'quantization',
  accent: COSMOS.cyan,
  invariants: verifyQuantizationInvariants,
  scenes: {
    intro,
    payload,
    'budget-inventory': budgetInventory,
    grid,
    'affine-range': affineRange,
    pack,
    'codec-contract': codecContract,
    granularity,
    'group-sum': groupSum,
    output,
    curvature,
    gptq,
    'held-out': heldOut,
    'factor-order': factorOrder,
    'gptq-layout': gptqLayout,
    awq,
    'awq-search': awqSearch,
    'precision-sweep': precisionSweep,
    'kernel-path': kernelPath,
    roofline,
    'precision-roles': precisionRoles,
    'pool-subtraction': poolSubtraction,
    gguf,
    'container-layout': containerLayout,
    'q4k-unpack': q4kUnpack,
    'offload-count': offloadCount,
    'artifact-lineage': artifactLineage,
    benchmark,
    'paired-evaluation': pairedEvaluation,
    diagnose,
    'fresh-quantization': freshQuantization,
  },
});
