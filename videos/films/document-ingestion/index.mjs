import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import subjectIntroStage from './stages/subject-intro.mjs';
import parserForkStage from './stages/parser-fork.mjs';
import pdfLayoutStage from './stages/pdf-layout.mjs';
import ocrReviewStage from './stages/ocr-review.mjs';
import tableStructureStage from './stages/table-structure.mjs';
import htmlBoundariesStage from './stages/html-boundaries.mjs';
import markdownSlicesStage from './stages/markdown-slices.mjs';
import provenanceRecordStage from './stages/provenance-record.mjs';
import chunkLocatorsStage from './stages/chunk-locators.mjs';
import versionPublicationStage from './stages/version-publication.mjs';
import visualRetrievalStage from './stages/visual-retrieval.mjs';
import evidenceGateStage from './stages/evidence-gate.mjs';
import parserBoundaryStage from './stages/parser-boundary.mjs';
import freshCaseStage from './stages/fresh-case.mjs';
export { PATCH_SCORES, RULES, SOURCE_BYTES, SOURCE_TEXT } from './fixtures.mjs';
export {
  RECORDS,
  admitted,
  evidenceRecord,
  freshIngestion,
  introSnapshot,
  lateInteraction,
  makeChunks,
  sourceGate,
  validateModel,
  versionDiff,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'document-ingestion',
  validateModel,
  scenes: [
    subjectIntroStage,
    parserForkStage,
    pdfLayoutStage,
    ocrReviewStage,
    tableStructureStage,
    htmlBoundariesStage,
    markdownSlicesStage,
    provenanceRecordStage,
    chunkLocatorsStage,
    versionPublicationStage,
    visualRetrievalStage,
    evidenceGateStage,
    parserBoundaryStage,
    freshCaseStage,
  ],
});
export const draw = definition.draw;
export default definition;
