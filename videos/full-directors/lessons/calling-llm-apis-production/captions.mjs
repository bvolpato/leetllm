const phraseStarts = {
  'c01-b02': [
    'Uncover the first possible history',
    'but its reply got lost',
    'Uncover the second history',
    'At six seconds',
    'until the provider can confirm them',
  ],
  'c02-b01': [
    'Try the startup check',
    'A blank value stops it too',
    'it needs a provider credential',
  ],
  'c02-b02': ['Give it the local placeholder', 'the provider has to check it'],
  'c02-b03': ['The browser downloads the bundle'],
  'c02-b04': [
    'and the receiving client',
    'with its public prefix',
    'through import dot meta dot env',
    'Keep it out of mobile packages',
    'source control and build artifacts',
  ],
  'c02-b05': [
    'injected from an authorized secret store',
    'and revoke a leaked one',
    'Now a signed-out caller',
    'asks this server to check the same account',
    'if the route forwards every request',
  ],
  'c03-b03': [
    'Every route can share timeouts',
    'privacy scrubbing, and operational telemetry',
  ],
  'c04-b01': [
    'the account, the policy IDs',
    'and the prompt version',
    'the total deadline and the retry cap',
    'and its type annotations',
  ],
  'c04-b03': [
    'On the ruler, eligibility starts',
    'until you migrate its consumers',
    'then authorize job creation separately',
  ],
  'c05-b02': [
    'The model cites P seven',
    'but the number disagrees',
    'but puts the minimum at ninety days',
  ],
  'c05-b03': ['names thirty days', 'after field types, evidence', 'and duplicate keys'],
  'c06-b01': [
    'Python JSON parsing can otherwise accept',
    'by retaining one value',
    'and can accept nonstandard NaN or Infinity',
  ],
  'c06-b02': [
    'rejects any duplicate field',
    'and turns excessive nesting into a named rejection',
  ],
  'c06-b03': [
    'Python treats Boolean values',
    'so check the exact type to reject true',
    'containing exactly the supplied P seven ID',
  ],
  'c06-b04': [
    'and the stale flag must be Boolean',
    'At thirty days, a stale key qualifies',
    'At twenty-nine days, a stale key is too young',
    'A current key at forty-five days',
    'but fails the stale check',
  ],
  'c07-b01': [
    'The wrapper loads the account',
    'calls the local provider stub',
    'five hundredths of a millisecond',
  ],
  'c07-b02': ['Now the stub gives a wrong answer', 'Try an unknown account', 'Just one'],
  'c08-b01': [
    'The client can wait for a pooled connection',
    'open a new one',
    'write the request',
    'or wait for the next chunk',
    'affect the time it takes to connect',
  ],
  'c08-b02': [
    'Here come six heartbeats',
    'and resets a two-second read timer',
    'At six seconds our first-text deadline expires',
    'through retrieval, attempts',
    'and the time the user can wait',
  ],
  'c08-b03': [
    'wait-for requests cancellation',
    'that can yield to cancellation',
    'and measure overruns',
  ],
  'c08-b04': ['cancellation has to wait for it to yield'],
  'c09-b01': ['and mark the deadline at twenty seconds', 'The first attempt occupies fourteen seconds'],
  'c09-b02': ['Add half a second of full jitter', 'make a two-and-a-half-second wait'],
  'c09-b03': [
    'The three-second retry ends at nineteen and a half',
    'inside the budget',
    'With only one point two seconds left', 'the requested wait cannot fit',
  ],
  'c10-b01': [
    'Take five requests',
    'with sixteen thousand input tokens each',
    'but eighty thousand input tokens',
  ],
  'c10-b02': [
    'four twenty-nine',
    'just as it can after a transient five-oh-three',
    'The second ran out of credit',
  ],
  'c10-b03': [
    'For four-oh-one or four-oh-three',
    'check credentials and access',
    'Inspect an unfamiliar error code',
  ],
  'c11-b03': [
    'For full jitter',
    'on each retry up to that cap',
  ],
  'c11-b04': ["That's half a second", 'This time the wait is one second'],
  'c11-b05': ['and three times the previous sleep', 'then cap the result'],
  'c11-b06': ['although a cap can bunch workers together again'],
  'c12-b01': [
    'Add half a second above the floor',
    'and we drew the midpoint',
  ],
  'c12-b02': ['and give malformed values an explicit fallback'],
  'c12-b03': [
    'Place the three-second allowance',
    'for the next call after that wait',
    'Leave four tenths of a second for validation',
    'The whole reservation takes five point nine seconds',
    'the wrapper can schedule this retry',
    'and enforce the time still available',
  ],
  'c12-b05': [
    'The wait helper returns two and a half seconds',
    'in both cases',
    'but the wrapper must also budget',
  ],
  'c12-b07': ['so each invocation makes one attempt'],
  'c13-b02': [
    'The first adds one to the count',
    'The second opens the contact',
    'so a tenant spending limit',
    'returns two five-oh-three errors in a row',
  ],
  'c13-b03': ['while another failure opens it again', 'permission, capacity, and the same validator'],
  'c14-b01': [
    'so the second request gets through',
    'Its failure opens the breaker',
    'The next request goes to the backup',
    'Start the ten-second cooldown',
    'at one hundred three',
  ],
  'c14-b03': ['A takes the slot'],
  'c14-b04': [
    'The next arrival takes the backup',
    'Its probe succeeds',
    'and D can go straight to the primary',
  ],
  'c14-b05': [
    'This account allows requests',
    'to be kept for one day',
    'The backup keeps them for seven days',
    'B stays at the router',
  ],
  'c14-b07': [
    'so a crashed probe can release it',
  ],
  'c14-b08': [
    'with the number in the slot',
  ],
  'c15-b02': [
    'carries intent key seven E three B',
    'The service creates job zero zero one',
    'Its acknowledgment gets lost',
  ],
  'c15-b03': [
    'The service finds the existing entry',
    'needs durable, atomic deduplication',
    'or a way to reconcile an uncertain outcome',
    'before another write',
  ],
  'c16-b01': ['Now restart the server', 'at the same time', 'and both see an empty slot'],
  'c16-b02': ['Store the arguments’ fingerprint', 'and whether the job is pending'],
  'c16-b03': [
    'ask it for the job by the original key',
    'If the destination guarantees deduplication',
    'the caller can also resend',
  ],
  'c17-b01': [
    'The server has to look up the key’s age and stale flag',
    'JSON mode asks for valid JSON',
    'also enforces the supported schema',
    'on a successful completion',
    'handle refusals and validate the decision',
    'the key’s age and stale flag',
  ],
  'c17-b02': [
    'text dot format carries',
    'and a list of source IDs',
    'Set additional properties to false',
    'looks up the age threshold in the policy',
    'A tool call can also carry',
  ],
  'c17-b04': ['on the model and endpoint that will serve the request'],
  'c18-b01': ['the key age of forty-five days', 'and the stale flag'],
  'c18-b02': [
    'Change the number to ninety',
    'The next reply is a refusal',
    'The last runs out of output tokens',
  ],
  'c18-b03': [
    'without a TLS handshake',
    'uses the operating system’s certificate store',
    'install it in the active trust store',
    'or a verified context',
  ],
  'c18-b05': [
    'setting store to false',
    'opts out of Responses application-state storage',
    'and Zero Data Retention approval separately',
  ],
  'c19-b02': ['text begins at three seconds', 'while buffering the full response'],
  'c20-b01': ['The next read supplies the other byte'],
  'c20-b02': [
    'with café in its data field',
  ],
  'c20-b03': ['normally opens a GET request and can reconnect', 'in a POST response'],
  'c20-b04': ['Here only item A’s text', 'and record when text first', 'Its arrival time measures'],
  'c21-b01': [
    'The buffer grows to eight characters',
    'then nineteen, thirty-one, and forty-one',
    'Now the provider sends',
  ],
  'c21-b02': [
    'to check against its schema and policy',
  ],
  'c21-b03': ['Replay the same four pieces', 'This time the connection ends right there'],
  'c21-b04': [
    'The second received only end of file',
    'Now try a dropped connection',
    'The client keeps the nineteen characters',
    'and records a failed draft',
  ],
  'c21-b05': [
    'has parsed and normalized the events',
    'and inspect refusal, incomplete and failure signals',
    'only when the product can safely show it',
    'before returning an eligibility decision',
  ],
  'c22-b01': [
    'Two hundred fifty input tokens',
    'cost five hundredths of a cent',
    'Eighty output tokens at six dollars per million',
    'cost almost as much',
    'just under a tenth of a cent per request',
  ],
  'c22-b02': [
    'for thirty days',
    'of five thousand eight hundred eighty dollars',
    'before retries or other charges',
  ],
  'c23-b01': [
    'Twelve hundred came from the cache',
    'and a hundred were cache writes',
    'That leaves seven hundred ordinary input tokens',
    'The two hundred output tokens include eighty for reasoning',
  ],
  'c23-b03': [
    'the fictional rates are two dollars for ordinary input',
    'fifty cents for cache reads',
    'and two dollars fifty for writes',
  ],
  'c23-b04': ['and divide by a million', 'The request costs point zero zero three four five dollars'],
  'c23-b05': ['They came out of the ordinary group', 'What happens to the price'],
  'c23-b06': [
    'The price drops to point zero zero two eight five dollars',
    'now cost fifty cents per million',
    'instead of two dollars per million',
    'Reusing a cached prefix can also save work',
    'processing those input positions',
  ],
  'c23-b07': [
    'If a timed-out attempt has no usage record',
    'leave its cost unknown',
    'until billing confirms it',
  ],
  'c24-b01': ['requested model and model that answered', 'of the OpenTelemetry convention'],
  'c24-b02': [
    'because an earlier HTTP response was successful',
  ],
  'c24-b03': [
    'and provider credential out of the log',
    'hold one hundred twenty-eight bits',
  ],
  'c24-b04': ['with a second tenant’s key', 'and expire them under the retention policy'],
  'c25-b01': [
    'when the caller needs an immediate decision',
    'use durable background state',
    'that can accompany more than one execution shape',
  ],
  'c25-b02': [
    "could have sent C's answer to A",
  ],
  'c25-b03': [
    'the Batch API in this example',
    'offers a twenty-four-hour window',
    'and a fifty-percent discount',
  ],
  'c25-b04': [
    'then check the reported cache usage',
    'test it with a signed-out caller',
    'the wrong tenant and a caller over quota',
  ],
  'c26-b05': [
    'so the wait is one and a half seconds',
    'Now add validation',
    'Four point two seconds in all',
    'extend past the four-second deadline',
  ],
  'c26-b06': [
    'each keep their own receipt',
  ],
  'c26-b07': [
    'The confirmation disappears on its way back',
    'and still has no job number',
    'with action key R B to the job service',
  ],
  'c26-b08': [
    'The lookup returns job forty-two',
    'so the user can find that confirmation again',
    'after a refresh',
  ],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
