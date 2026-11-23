import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import opening from './stages/opening.mjs';
import environment from './stages/environment.mjs';
import runtimeContract from './stages/runtime-contract.mjs';
import rowValues from './stages/row-values.mjs';
import valueTypes from './stages/value-types.mjs';
import batch from './stages/batch.mjs';
import copies from './stages/copies.mjs';
import nestedOwnership from './stages/nested-ownership.mjs';
import functions from './stages/functions.mjs';
import programEntry from './stages/program-entry.mjs';
import jsonlBoundary from './stages/jsonl-boundary.mjs';
import decoderPolicy from './stages/decoder-policy.mjs';
import iteratorLifetime from './stages/iterator-lifetime.mjs';
import errorsAndCoverage from './stages/errors-and-coverage.mjs';
import confidenceContract from './stages/confidence-contract.mjs';
import numericFloor from './stages/numeric-floor.mjs';
import pytestContract from './stages/pytest-contract.mjs';
import exactMetric from './stages/exact-metric.mjs';
import lockedReplay from './stages/locked-replay.mjs';
import freshInputReceipt from './stages/fresh-input-receipt.mjs';
export { classifyJsonRow, exactMatch, parseJsonLine, score } from './arithmetic.mjs';
export { cueProgress } from './construction.mjs';
export { confidenceFixtures, examples, freshRows } from './fixtures.mjs';
export {
  batchFrame,
  boundaryFrame,
  confidenceState,
  copyFrame,
  decoderState,
  freshState,
  functionFrame,
  metricFrame,
  nestedState,
  rowFrame,
  sampleModel,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'python-for-ai-engineering',
  validateModel,
  scenes: [
    opening,
    rowValues,
    batch,
    valueTypes,
    copies,
    nestedOwnership,
    functions,
    environment,
    runtimeContract,
    programEntry,
    jsonlBoundary,
    decoderPolicy,
    iteratorLifetime,
    errorsAndCoverage,
    confidenceContract,
    numericFloor,
    pytestContract,
    exactMetric,
    lockedReplay,
    freshInputReceipt,
  ],
});
export const draw = definition.draw;
export default definition;
