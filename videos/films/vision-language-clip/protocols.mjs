import { IMAGE_REQUEST } from './fixtures.mjs';
export function imageFingerprint(r) {
  return JSON.stringify([
    r.tenant,
    r.imageID,
    r.bytes,
    r.site,
    r.metadata?.schema,
    r.metadata?.description,
  ]);
}
export function ingestImage(ledger, r, actor) {
  if (
    !actor ||
    actor.tenant !== r.tenant ||
    !actor.sites.includes(r.site) ||
    !r.imageID.startsWith(r.tenant + '/')
  )
    return {
      status: 'denied',
    };
  const key = JSON.stringify([actor.tenant, r.key]),
    fingerprint = imageFingerprint(r),
    prior = ledger.get(key);
  if (prior)
    return prior.fingerprint === fingerprint
      ? {
          status: 'replayed',
          receipt: prior.receipt,
        }
      : {
          status: 'conflict',
        };
  const receipt = Object.freeze({
    operation: 'ingest-17',
    imageID: r.imageID,
    site: r.site,
    tenant: r.tenant,
  });
  ledger.set(key, {
    fingerprint,
    receipt,
  });
  return {
    status: 'accepted',
    receipt,
  };
}
export function cachedImageAllowed(actor, image) {
  return actor.tenant === image.tenant && actor.sites.includes(image.site);
}
export function activateImageGeneration(current, next, checks) {
  return ['preprocess', 'pairedEncoders', 'normalization', 'index'].every((k) => checks[k] === true)
    ? next
    : current;
}
export function imageLedgerSnapshot(stage = 0) {
  const ledger = new Map(),
    actor = {
      tenant: 'Ops',
      sites: ['East'],
    };
  let result = null;
  if (stage >= 1) result = ingestImage(ledger, IMAGE_REQUEST, actor);
  if (stage >= 2) result = ingestImage(ledger, IMAGE_REQUEST, actor);
  if (stage >= 3)
    result = ingestImage(
      ledger,
      {
        ...IMAGE_REQUEST,
        metadata: {
          ...IMAGE_REQUEST.metadata,
          schema: 2,
        },
      },
      actor,
    );
  return {
    count: ledger.size,
    result,
    entry: [...ledger.values()][0] ?? null,
  };
}
