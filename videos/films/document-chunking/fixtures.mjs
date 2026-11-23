export const RUNBOOK =
  'Rollback failure page on-call within 15 minutes with deploy ID. Routine deploy notes archive within 14 days.';
export const RUNBOOK_WORDS = RUNBOOK.split(/\s+/);
// A storyboard without speech uses these fractions. Production uses the spoken cues.
export const PARENT_REVEAL_START = 0.7807056530214422;
export const PARENT_REVEAL_END = 0.8684249512670564;
export const ENCODE_START = 0.0714080697687265;
export const ENCODE_END = 0.2369983992934826;
export const POOL_START = 0.27632610255561174;
export const POOL_END = 0.550585085830989;
export const LONG_SECTION =
  'Page on-call within 15 minutes with deploy ID. Include the service name and rollback attempt.';
export const RELEASE_WORD_CAP = 10;
export const REVISED_RULE =
  'Rollback failure: page on-call within 20 minutes with deploy ID and service.';
export const RELEASE_QUERY = 'After rollback failure, who gets paged, when, and with which ID?';
