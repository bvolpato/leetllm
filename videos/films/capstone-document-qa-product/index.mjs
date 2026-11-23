import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import intro from './stages/intro.mjs';
import admission from './stages/admission.mjs';
import access from './stages/access.mjs';
import retrieval from './stages/retrieval.mjs';
import support from './stages/support.mjs';
import responses from './stages/responses.mjs';
import researchStage from './stages/research.mjs';
import synthesis from './stages/synthesis.mjs';
import strictCorpus from './stages/strict-corpus.mjs';
import typedHttp from './stages/typed-http.mjs';
import retrievalUpgrade from './stages/retrieval-upgrade.mjs';
import claimScope from './stages/claim-scope.mjs';
import replayRows from './stages/replay-rows.mjs';
import researchRequest from './stages/research-request.mjs';
import researchCheckpoint from './stages/research-checkpoint.mjs';
import researchClaims from './stages/research-claims.mjs';
import researchLifecycleApi from './stages/research-lifecycle-api.mjs';
import freshQa from './stages/fresh-qa.mjs';
export { supportBinding, supportReceiptFixture } from './arithmetic.mjs';
export {
  ABSTENTION_TEXT,
  LAB_POLICY,
  SHIPPING_PASSAGE,
  SHIPPING_QUESTION,
  SUPPORT_PASSAGE,
  SUPPORT_QUESTION,
  publicationRecords,
} from './fixtures.mjs';
export {
  admissionSnapshot,
  admit,
  answer,
  commitCheckpoint,
  freshShippingAnswer,
  negationSnapshot,
  publicationDecision,
  readableRankedCandidates,
  research,
  researchSnapshot,
  sampleModel,
  similarity,
  supportSceneSnapshot,
  terms,
} from './model.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'capstone-document-qa-product',
  validateModel,
  scenes: [
    intro,
    admission,
    strictCorpus,
    access,
    retrieval,
    support,
    responses,
    typedHttp,
    retrievalUpgrade,
    claimScope,
    replayRows,
    synthesis,
    researchStage,
    researchRequest,
    researchCheckpoint,
    researchClaims,
    researchLifecycleApi,
    freshQa,
  ],
});
export const draw = definition.draw;
export default definition;
