const phraseStarts = {
  'c01-b02': [
    'Login and test',
    'The word fail',
    "That's two hits",
    'Before you choose',
    'how many more',
  ],
  'c01-b03': ['Feed the remaining', 'even if its', 'Complexity describes', 'grows with its inputs'],
  'c02-b01': ['Keep those notes and add four more'],
  'c02-b02': ['Let the second scan visit the notes one at a time', 'Here twice the input'],
  'c02-b04': [
    'Sixteen notes give sixteen visits',
    'You could write the three word tests',
    'but a fixed inner loop adds',
  ],
  'c03-b04': [
    'with random access',
    'the first three midpoints',
    "Now there's only",
    'Have we read',
  ],
  'c03-b05': [
    'Read slot zero',
    "That's the fourth",
    'For sixty-five thousand',
    'sixteen halvings',
    'Seventeen checks',
    'still counts as',
  ],
  'c04-b01': [
    'Here the table adds up',
    'and takes the remainder after division by eight',
    'Follow issuer-check',
    'then compare the stored key for equality',
    'With a good spread',
    'the expected number of probes stays constant',
  ],
  'c04-b02': [
    'then look up missing-login-note',
    'To rule out a match',
    'the search checks each stored key',
  ],
  'c04-b03': ['This toy hash adds every character code', 'even when the bucket takes one probe'],
  'c05-b02': ['from the first letter'],
  'c05-b04': [
    'With expected constant-time child lookups',
    'reaching a matched prefix',
    'takes order p plus one work',
    'including the check',
  ],
  'c05-b05': [
    'An HNSW index follows a graph',
    'to find approximate nearest neighbors',
    'and where the query sits',
    'A prefix lookup needs something we can check symbol by symbol',
  ],
  'c05-b06': [
    'Try the same lookup',
    'The first three match',
    'the stored request',
    'and the new one',
    'and cache scope',
  ],
  'c06-b01': ['Allocate four slots', 'In this trace', 'then write the third reference'],
  'c07-b02': [
    'Pair the remaining coordinates',
    'Run that same inner loop',
    'Four times three',
    'Even the runner-clock note',
  ],
  'c08-b03': [
    'The issuer note',
    'and replaces the runner-clock note',
    'Score the release checklist',
    'so the heap stays',
  ],
  'c08-b04': [
    'A score of point eight takes the root',
    'The weaker child belongs above point eight',
    'so swap those two',
    'Compare again one level down',
    'Swap with the weaker child there too',
  ],
  'c08-b05': ['Here comes a score', 'It beats the new cutoff', 'so put it at the root'],
  'c08-b08': [
    'Whether we sort all four scores',
    'or keep two winners in a heap',
    'the counter still reads twelve products',
  ],
  'c08-b09': [
    'A and C keep their scores and IDs',
    'Beyond the resident matrix',
    'we need the query, the k winners, a running sum and indices',
    'With fixed-size IDs and scores',
  ],
  'c08-b10': [
    'with seven hundred sixty-eight',
    'That gives thirty-eight',
    'coordinate products for one exact scan',
    'The resident matrix',
  ],
  'c09-b04': [
    'Look down A’s column',
    'Keep one index on A',
    'For each pair, add the squared coordinate differences',
  ],
  'c09-b07': [
    'Process each arrival once',
    'under normal hashing',
    'with the cost of reading long strings',
  ],
  'c10-b01': [
    'During prompt processing',
    'each query position',
    'in a conceptual score grid',
    'Watch four positions',
  ],
  'c10-b02': ['as the new rows', 'The number of score positions in this square grid quadruples'],
  'c10-b03': [
    'to use only itself and earlier keys',
    'while still doing dense attention arithmetic',
  ],
  'c10-b04': [
    'Start with eight completed positions',
    'Consuming the next input appends its key and value',
    'Follow its query across the row',
  ],
  'c10-b05': [
    "That's why one decode step costs current length times head width",
    'current length times head width',
  ],
  'c10-b09': ['The blue rectangle', 'and one column', "that's G times T"],
  'c10-b10': [
    'for query-key work per head',
    'Doubling the starting history doubles the blue part',
    'so the green part grows quadratically',
  ],
  'c10-b11': [
    'Our three rows belong to three inputs fed back to the decoder',
    'you never pay for the first of these extra rows',
  ],
  'c11-b01': ['saved it from having', 'In this example'],
  'c11-b02': ['at each of thirty-two layers', 'Now make room', 'or one hundred twenty-eight'],
  'c11-b04': ['At a thousand twenty-four', 'the raw cache values occupy'],
  'c11-b05': [
    'Increase only',
    'Each bar stretches',
    'and storage becomes',
    'multiplies a dense prefill score grid',
  ],
  'c11-b06': ['and unused space'],
  'c12-b03': [
    'Time preprocessing',
    'In this second trace',
    'while the accelerator runs the first',
    'A worker pool can give us that overlap',
    'at the cost of scheduling, transfers and memory',
  ],
  'c12-b04': ['measure its contribution', 'leaves reference counting active', 'Here two unreachable objects'],
  'c13-b01': ['count the work this caller is allowed to ask for', 'and the reader'],
  'c13-b02': ['so we skip', 'but the wrong project', 'Three allowed rows'],
  'c13-b03': ['A budget of eight would stop the score pass here'],
  'c13-b04': ['each three hundred eighty-four coordinates wide', 'Predict whether the whole rectangle fits'],
  'c13-b07': [
    'Shrink the winner',
    'One or two winners',
    'one million five hundred thirty-six thousand products',
    'Reroute it before scoring',
  ],
  'c13-b08': ['compare the evidence', 'with the exact winners'],
  'c14-b01': ['Pass only the two largest', 'and see what it can return'],
  'c14-b04': ['to see whether that happened here'],
  'c14-b05': ['For tied word counts', 'and C comes before D', 'but still return just two citations'],
  'c14-b09': ['against the fully scored', 'and the evidence it recovers'],
  'c14-b10': ['our model predicts six seconds'],
  'c14-b11': ['At two point six seconds per hundred tokens', 'the prediction drops to five point two'],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
