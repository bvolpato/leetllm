const phraseStarts = {
  'c01-b01': ['She clicks Check policy', 'The button dims'],
  'c01-b02': ['Ready again', 'The key and the report'],
  'c02-b02': ['It commits an attempt in SQLite', 'asks the fixture provider', 'then checks and saves', 'The prompt version in its trace'],
  'c03-b01': ['It checks the report too', 'before it creates a trace', 'or spends a provider call'],
  'c03-b03': ['The route rejects the extra field', 'Looking up a well-formed account'],
  'c03-b04': ['This request gets four twenty-two', 'The provider call count'],
  'c04-b02': ['Change only the stale flag to no', 'Should the checker accept'],
  'c04-b03': ['Now move a stale key to twelve days', 'Here the age falls short', 'A provider that returns not eligible', 'has given a correct answer'],
  'c04-b04': ['The threshold includes that day', 'Now take away the account record'],
  'c04-b06': ['The provider adds P-eight', 'That extra citation', 'A hosted adapter must first parse', 'a complete response into a dictionary', 'the checker can validate'],
  'c05-b01': ['The insert commits a running trace', 'before the provider starts', 'Its row identifies', 'and the trusted facts at submission'],
  'c05-b03': ['It returns eligible', 'The checker verifies'],
  'c05-b04': ['The commit saves completed at version two', 'Now the handler', 'Try the same update again', 'It matches zero rows', 'That first terminal record'],
  'c05-b06': ['and stops after the checker finishes', 'Both database writes', 'start at the click', 'and stop when the page shows the answer'],
  'c06-b02': ['The checker accepts its candidate', 'and the final write commits', 'The same row now says completed at version two', 'Keeping this file'],
  'c06-b03': ['A failed check carries the error code', 'If a write fails'],
  'c07-b02': ['The page checks the completed outcome', 'It shows Eligible under P-seven', 'Match the trace prefix'],
  'c08-b02': ['let the insert commit', 'The provider is called once and returns eligible', 'This time reject'],
  'c08-b03': ['It returns running, version one', 'Compare the two provider call counts'],
  'c08-b04': ['The worker still needs', 'before deciding to repeat the call'],
  'c09-b03': ['It serializes those three fields', 'and stores their HMAC', 'a digest made with a key', 'A real service needs a secret key', 'and retention limits for the fingerprints', 'trusted facts and account records'],
  'c09-b04': ['Now submit the same valid report twice', 'with a working provider', 'Two traces, two calls'],
  'c10-b01': ['It writes that label with textContent', 'The report and provider prose'],
  'c10-b04': ['Once it detects the network error', 'it says Request unavailable', 'This form has no'],
  'c10-b05': ['With those fields in conflict', 'Luna gets the same message as before'],
  'c11-b01': ['The thirty-day case', 'catches a strict greater-than sign', 'where the policy says at least', 'The missing account catches a mistaken negative'],
  'c11-b02': ['Now try four malformed reports', 'Send a request to the health route', 'with a provider that counts every call', 'The route returns okay', 'The provider recorded zero calls'],
  'c11-b03': ['Before a public launch', 'test who can access each account', 'and how the service handles load'],
  'c11-b05': ['Try the deployment again', 'with the file on persistent storage from the start'],
  'c12-b01': ['The other is thirty', 'Which attempt'],
  'c12-b02': ['The final write saves failed with invalid decision', 'Each reply now carries'],
  'c12-b03': ['Both rows have committed', 'The browsers are still waiting'],
  'c12-b04': ['To recover the original result', 'Luna needs an authorized lookup for that attempt'],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
