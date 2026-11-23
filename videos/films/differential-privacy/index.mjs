import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import introStage from './stages/intro.mjs';
import adjacencyStage from './stages/adjacency.mjs';
import definitionStage from './stages/definition.mjs';
import clipStage from './stages/clip.mjs';
import noiseStage from './stages/noise.mjs';
import composeStage from './stages/compose.mjs';
import utilityStage from './stages/utility.mjs';
import auditStage from './stages/audit.mjs';
import attackEvidenceStage from './stages/attack-evidence.mjs';
import privateMechanismsStage from './stages/private-mechanisms.mjs';
import userAggregateStage from './stages/user-aggregate.mjs';
import accountantCalculationStage from './stages/accountant-calculation.mjs';
import coordinateNoiseStage from './stages/coordinate-noise.mjs';
import earnedTransferStage from './stages/earned-transfer.mjs';
export {
  clipVector,
  eventUpperBound,
  privacyEventBand,
  probabilityWidths,
  sumVectors,
  updateWithNoise,
} from './arithmetic.mjs';
export { PRIVATE_RECORDS } from './fixtures.mjs';
export {
  adjacencySnapshot,
  clippingProgress,
  definitionSnapshot,
  gaussianAccountantFixture,
  introPrivacySnapshot,
  noiseSnapshot,
  releaseTraceSnapshot,
  replacementSensitivity,
  userAggregateFixture,
  utilityDiagnostics,
  utilityNoiseScale,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'differential-privacy',
  validateModel,
  scenes: [
    introStage,
    adjacencyStage,
    userAggregateStage,
    definitionStage,
    attackEvidenceStage,
    privateMechanismsStage,
    clipStage,
    noiseStage,
    composeStage,
    utilityStage,
    coordinateNoiseStage,
    auditStage,
    accountantCalculationStage,
    earnedTransferStage,
  ],
});
export const draw = definition.draw;
export default definition;
