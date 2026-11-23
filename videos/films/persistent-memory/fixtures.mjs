import { createCueTrack } from 'vizmatic';
export const WINDOW_TURNS = [
  {
    id: 'billing-event',
    text: 'FACT: event=billing_event_78291',
  },
  {
    id: 'webhook-inspection',
    text: "I'll inspect webhook.ts",
  },
  {
    id: 'invoice-replay',
    text: 'Replay returned two invoices',
  },
  {
    id: 'canary-restriction',
    text: 'FACT: rollout must stay canary-only',
  },
  {
    id: 'verifier-question',
    text: 'Which test was failing again?',
  },
];
export const WINDOW_CAPACITY = 3;
export const ARCHIVED_TURNS = WINDOW_TURNS.slice(0, -WINDOW_CAPACITY);
export const RECENT_TURNS = WINDOW_TURNS.slice(-WINDOW_CAPACITY);
export const WINDOW_SUMMARY = ARCHIVED_TURNS.filter((turn) => turn.text.startsWith('FACT: '))
  .map((turn) => turn.text)
  .join(' | ');
export const WINDOW_TRACK = createCueTrack({
  initial: {
    id: 'window-uncompressed',
    snapshot: {
      stage: 'five turns before folding',
      summary: [],
      archive: [],
      archivedIds: [],
      recent: WINDOW_TURNS.map((turn) => turn.text),
      recentIds: WINDOW_TURNS.map((turn) => turn.id),
    },
  },
  cues: [
    {
      id: 'window-folded-overflow',
      beat: 1,
      at: 0.3,
      snapshot: {
        stage: 'older turns summarized',
        summary: [WINDOW_SUMMARY],
        archive: ARCHIVED_TURNS.map((turn) => turn.text),
        archivedIds: ARCHIVED_TURNS.map((turn) => turn.id),
        recent: RECENT_TURNS.map((turn) => turn.text),
        recentIds: RECENT_TURNS.map((turn) => turn.id),
      },
    },
    {
      id: 'window-packed-prompt',
      beat: 2,
      at: 0.3,
      snapshot: {
        stage: 'bounded prompt assembled',
        summary: [WINDOW_SUMMARY],
        archive: ARCHIVED_TURNS.map((turn) => turn.text),
        archivedIds: ARCHIVED_TURNS.map((turn) => turn.id),
        recent: RECENT_TURNS.map((turn) => turn.text),
        recentIds: RECENT_TURNS.map((turn) => turn.id),
      },
    },
  ],
});
