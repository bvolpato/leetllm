import { defineCanvasLesson } from '../../lib/lesson-definition.mjs';
import { validateModel } from './validation.mjs';
import { SQL_ADDED_SCENES } from './fixtures.mjs';
import { drawUnmatchedSqlOriginal, drawUnmatchedSqlExtended } from './compatibility.mjs';
import openingStage from './stages/opening.mjs';
import durabilityStage from './stages/durability.mjs';
import relationsStage from './stages/relations.mjs';
import schemaContractStage from './stages/schema-contract.mjs';
import queryStage from './stages/query.mjs';
import literalSubstringStage from './stages/literal-substring.mjs';
import joinStage from './stages/join.mjs';
import queryNullStage from './stages/query-null.mjs';
import validityStage from './stages/validity.mjs';
import versionGuardStage from './stages/version-guard.mjs';
import authorizationStage from './stages/authorization.mjs';
import roleBoundaryStage from './stages/role-boundary.mjs';
import countsStage from './stages/counts.mjs';
import aggregateOrderStage from './stages/aggregate-order.mjs';
import deleteOrderStage from './stages/delete-order.mjs';
import transactionContextStage from './stages/transaction-context.mjs';
import publicationStage from './stages/publication.mjs';
import publishBoundaryStage from './stages/publish-boundary.mjs';
import snapshotsStage from './stages/snapshots.mjs';
import retriesStage from './stages/retries.mjs';
import idempotencyBoundaryStage from './stages/idempotency-boundary.mjs';
import indexesStage from './stages/indexes.mjs';
import planContractStage from './stages/plan-contract.mjs';
import semanticStage from './stages/semantic.mjs';
import vectorContractStage from './stages/vector-contract.mjs';
import lineageVersionStage from './stages/lineage-version.mjs';
import closingStage from './stages/closing.mjs';
import freshRequestStage from './stages/fresh-request.mjs';
export { cosine } from './arithmetic.mjs';
export {
  SQL_ADDED_SCENES,
  asOf,
  chunks,
  documents,
  paragraph,
  permissions,
  publicationInput,
  replacement,
  toyEmbeddings,
} from './fixtures.mjs';
export {
  active,
  authorizedMatches,
  corpus,
  eligibleRows,
  freshSqlPacket,
  groupChildren,
  joinedRows,
  literalSubstringPattern,
  permissionRows,
  rlsVisible,
  semanticCandidates,
  sourceCounts,
} from './model.mjs';
export { createPublicationLedger, payloadFingerprint, publishOnce } from './protocols.mjs';
export { extendedSqlState, sampleModel, snapshotQueryFrame } from './construction.mjs';
export { validateModel } from './validation.mjs';
const definition = defineCanvasLesson({
  id: 'sql-databases-data-modeling-ai',
  validateModel,
  scenes: [
    openingStage,
    durabilityStage,
    relationsStage,
    schemaContractStage,
    queryStage,
    literalSubstringStage,
    joinStage,
    queryNullStage,
    validityStage,
    versionGuardStage,
    authorizationStage,
    roleBoundaryStage,
    countsStage,
    aggregateOrderStage,
    deleteOrderStage,
    transactionContextStage,
    publicationStage,
    publishBoundaryStage,
    snapshotsStage,
    retriesStage,
    idempotencyBoundaryStage,
    indexesStage,
    planContractStage,
    semanticStage,
    vectorContractStage,
    lineageVersionStage,
    closingStage,
    freshRequestStage,
  ],
});
const originalDraws = new Map([
  ['opening', openingStage.draw],
  ['durability', durabilityStage.draw],
  ['relations', relationsStage.draw],
  ['query', queryStage.draw],
  ['join', joinStage.draw],
  ['validity', validityStage.draw],
  ['authorization', authorizationStage.draw],
  ['counts', countsStage.draw],
  ['publication', publicationStage.draw],
  ['snapshots', snapshotsStage.draw],
  ['retries', retriesStage.draw],
  ['indexes', indexesStage.draw],
  ['semantic', semanticStage.draw],
  ['closing', closingStage.draw],
]);
const extendedDraws = new Map([
  ['schema-contract', schemaContractStage.draw],
  ['literal-substring', literalSubstringStage.draw],
  ['query-null', queryNullStage.draw],
  ['version-guard', versionGuardStage.draw],
  ['role-boundary', roleBoundaryStage.draw],
  ['aggregate-order', aggregateOrderStage.draw],
  ['delete-order', deleteOrderStage.draw],
  ['transaction-context', transactionContextStage.draw],
  ['publish-boundary', publishBoundaryStage.draw],
  ['idempotency-boundary', idempotencyBoundaryStage.draw],
  ['plan-contract', planContractStage.draw],
  ['vector-contract', vectorContractStage.draw],
  ['lineage-version', lineageVersionStage.draw],
  ['fresh-request', freshRequestStage.draw],
]);
export function draw(ctx, scene, state, api) {
  if (SQL_ADDED_SCENES.has(scene.id)) {
    const painter = extendedDraws.get(scene.id);
    return painter
      ? painter(ctx, scene, state, api)
      : drawUnmatchedSqlExtended(ctx, scene, state, api);
  }
  const painter = originalDraws.get(scene.id);
  return painter
    ? painter(ctx, scene, state, api)
    : drawUnmatchedSqlOriginal(ctx, scene, state, api);
}
export default Object.freeze({
  ...definition,
  draw,
});
