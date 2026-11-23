import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './model.mjs';
import { draw } from './compatibility.mjs';
export { draw } from './compatibility.mjs';
import introStage from './stages/intro.mjs';
import inventoryPlanStage from './stages/inventory-plan.mjs';
import extractStage from './stages/extract.mjs';
import archivesStage from './stages/archives.mjs';
import filterStage from './stages/filter.mjs';
import proseGatesStage from './stages/prose-gates.mjs';
import scoreContractsStage from './stages/score-contracts.mjs';
import corpusEvidenceStage from './stages/corpus-evidence.mjs';
import dedupStage from './stages/dedup.mjs';
import minhashWorkStage from './stages/minhash-work.mjs';
import lshChainStage from './stages/lsh-chain.mjs';
import inventoryStage from './stages/inventory.mjs';
import mixtureStage from './stages/mixture.mjs';
import exposureScheduleStage from './stages/exposure-schedule.mjs';
import decontaminationStage from './stages/decontamination.mjs';
import privacyStage from './stages/privacy.mjs';
import tokenizerChoiceStage from './stages/tokenizer-choice.mjs';
import bpeWorkStage from './stages/bpe-work.mjs';
import packingWorkStage from './stages/packing-work.mjs';
import boundariesStage from './stages/boundaries.mjs';
import labelLayoutStage from './stages/label-layout.mjs';
import lineageStage from './stages/lineage.mjs';
import restartConsistencyStage from './stages/restart-consistency.mjs';
import annealSyntheticStage from './stages/anneal-synthetic.mjs';
import transferStage from './stages/transfer.mjs';
import freshCorpusStage from './stages/fresh-corpus.mjs';
export {
  DOCUMENT_DRAWS,
  NEAR_DUPLICATE_TEXT,
  PACKED_WORDS,
  TOY_TOKEN_IDS,
  corpus,
  extractionFixture,
} from './fixtures.mjs';
export {
  bpeReplay,
  documentSample,
  independentObjective,
  jaccard,
  packRecords,
  packedMask,
  restoreRecords,
  share,
  shingles,
} from './arithmetic.mjs';
export {
  boundarySnapshot,
  dedupSnapshot,
  extractionSnapshot,
  filterState,
  inventoryFixture,
  mixtureSnapshot,
  preparationBranch,
  transferSnapshot,
  validateModel,
} from './model.mjs';
const definition = defineCanvasLesson({
  id: 'pretraining-data',
  validateModel,
  scenes: [
    introStage,
    inventoryPlanStage,
    extractStage,
    archivesStage,
    filterStage,
    proseGatesStage,
    scoreContractsStage,
    corpusEvidenceStage,
    dedupStage,
    minhashWorkStage,
    lshChainStage,
    inventoryStage,
    mixtureStage,
    exposureScheduleStage,
    decontaminationStage,
    privacyStage,
    tokenizerChoiceStage,
    bpeWorkStage,
    packingWorkStage,
    boundariesStage,
    labelLayoutStage,
    lineageStage,
    restartConsistencyStage,
    annealSyntheticStage,
    transferStage,
    freshCorpusStage,
  ],
});
export default Object.freeze({
  ...definition,
  draw,
});
