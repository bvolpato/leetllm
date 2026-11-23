import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import geometryLimits from './stages/geometry-limits.mjs';
import impurity from './stages/impurity.mjs';
import criteriaCompare from './stages/criteria-compare.mjs';
import search from './stages/search.mjs';
import depth from './stages/depth.mjs';
import forest from './stages/forest.mjs';
import boosting from './stages/boosting.mjs';
import classification from './stages/classification.mjs';
import evaluate from './stages/evaluate.mjs';
import importanceExplanation from './stages/importance-explanation.mjs';
import missingContract from './stages/missing-contract.mjs';
import transfer from './stages/transfer.mjs';
export { boostingFrame, policyCosts } from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'trees',
  validateModel,
  scenes: [
    intro,
    geometryLimits,
    impurity,
    criteriaCompare,
    search,
    depth,
    forest,
    boosting,
    classification,
    evaluate,
    importanceExplanation,
    missingContract,
    transfer,
  ],
});
export const draw = definition.draw;
export default definition;
