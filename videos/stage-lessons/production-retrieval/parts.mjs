import { column, passage, place, row } from 'vizmatic/stage';
import { area, chip, note } from '../kit-narrated.mjs';
import { CORPUS, EVAL_DATE, REVIEWED_PARENT } from '../../films/production-retrieval/fixtures.mjs';
import { releaseCases, requestPath } from '../../films/production-retrieval/model.mjs';
export { CORPUS, EVAL_DATE, REVIEWED_PARENT };
export const RUN = requestPath();
export const COLOR = Object.freeze({
  request: 'blue',
  policy: 'cyan',
  admitted: 'green',
  session: 'pink',
  focus: 'yellow',
  failure: 'red',
  quiet: 'dim',
});
const limits = REVIEWED_PARENT.match(/up to (\d+) days[\s\S]*?at most (\d+) hours/);
const ages = RUN.answer.text.match(/stale age (\d+) days[\s\S]*?signal age (\d+) hours/);
const outside = releaseCases()
  .find((row) => row.id === 'outside-window')
  .result.text.match(/stale age (\d+) days/);
export const RULE = Object.freeze({
  days: Number(limits[1]),
  hours: Number(limits[2]),
  requestDays: Number(ages[1]),
  requestHours: Number(ages[2]),
  outsideDays: Number(outside[1]),
});
export const MOTION = { duration: 0.7 };
export const STATE = Object.freeze({
  'subject-intro': 'E1 opens to browser sessions. Its key-rotation claim fails.',
  'three-paths': 'The current key policy serves ingestion, request and release lifetimes.',
  'versioned-evidence': 'The request date selects v2. The old revision stays in history.',
  'validity-invariants': 'One active content revision and a separate current grant are required.',
  'authorized-retrieval': 'Only EU key v2 and EU session v1 survive the caller filters.',
  'filtering-contract':
    'Returned payloads obey scope. Global top-k redaction loses allowed neighbors.',
  'lexical-counterexample': 'A zero-score tie fails the reference retrieval gate.',
  'pinned-bundle': 'The request retains A after the global pointer moves to B.',
  'child-to-parent': 'The complete checked parent is packed once.',
  'context-budget': 'Source characters and complete-request tokens use different budgets.',
  'answer-from-evidence': 'The corner counts. Crossing the day limit gives a cited denial. Removing the rule requires abstention.',
  'prompt-contract': 'Identity, permission and exact support have separate checks.',
  'recorded-model-failure': 'Recorded replies fail comparisons despite known citation labels.',
  'evidence-is-data': 'The changed rule abstains and cannot acquire tool authority.',
  'revocation-and-cache': 'Revoking the uncited session page invalidates the draft. The key rule still supports a new answer.',
  'cache-identity': 'Fifteen days cannot reuse a ten-day yes.',
  'trace-and-diagnose': 'The failed promise is localized to candidates, parents or claims.',
  'recall-contracts': 'ANN overlap can be high while the governing passage is absent.',
  'serial-latency': 'Caller first token and completion use the whole request clock.',
  'release-gates': 'The wrong-limit mutation fails before promotion.',
  'tails-and-gates': 'All six required gates must be present and exactly true.',
  'fresh-evidence':
    'Rollback retains the tombstone. With the rule available, a 49-hour signal supports a cited denial.',
});

/** Luna and the source retain their place across the film. */
export function evidenceFrame(c, { page = true, kinds = {} } = {}) {
  const [identity, body, foot] = area.rows([1, 7, 1], 'normal');
  const identityNodes = place(
    row(
      [
        chip('Luna · EU support', { color: COLOR.request }),
      ],
      { gap: 'wide' },
    ),
    identity,
    'left',
  );
  const [source, work] = body.columns([2, 4], 'loose');
  const policy = page
    ? place(
        passage(REVIEWED_PARENT, {
          width: source.width,
          size: 34,
          titleSize: 29,
          leading: 1.55,
          title: 'eu-access/2026-04-01',
          color: COLOR.policy,
          kinds: {
            focus: { color: 'yellow', sign: 'box' },
            supported: { color: 'green', sign: 'underline' },
            failed: { color: 'red', sign: 'wavy' },
            ...kinds,
          },
        }),
        source,
        'top left',
      )
    : null;
  const locator = page
    ? place(
        column([note('EU Access Policy > key rotation'), note('Request date: ' + EVAL_DATE)], {
          gap: 'tight',
        }),
        source,
        'bottom left',
      )
    : null;
  return {
    identity: identityNodes,
    source,
    work,
    body,
    foot,
    page: policy,
    locator,
    nodes: [identityNodes, ...(page ? [policy, locator] : [])],
  };
}
export function carryIdentity(c, frame) {
  if (c.id !== 'subject-intro') c.take(frame.identity);
  if (c.id !== 'fresh-evidence') c.keep(frame.identity);
}
