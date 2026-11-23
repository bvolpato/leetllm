const phraseStarts = {
  'c02-b01': ['Choose the model', 'Then freeze the whole procedure', 'including preprocessing', 'Only now open', 'Test requests come later'],
  'c02-b02': ['after seeing their errors'],
  'c02-b04': ['over the calibration data', 'For each held-out record'],
  'c03-b02': ['One finished early', 'and you get the absolute residual'],
  'c03-b03': ['Even if you mix up the records', 'each gap travels with its own forecast and outcome', 'before we know its outcome'],
  'c06-b03': ['An error at the boundary', 'because the test allows'],
  'c07-b01': ['could have been the next one', 'when you permute their positions'],
  'c08-b02': ['k divided by n plus one', 'that adds one', 'Here that range'],
  'c10-b01': ['assigned that candidate very little probability'],
  'c10-b03': ['a candidate needs probability at least point six'],
  'c11-b02': ['and had the largest share every time'],
  'c11-b05': ['This way of keeping the', 'gave us an empty set on this very same input'],
  'c12-b02': ['so the conservative rule keeps all four', 'If nothing crosses'],
  'c12-b05': ['makes this version of adaptive prediction sets nonempty', 'Randomized APS'],
  'c13-b02': ['and one hundred thirty-five covered long ones', 'The total clears the eighty'],
  'c13-b04': ['The short group contributed four', 'and the long group two hundred seventy'],
  'c13-b05': ['can leave a particular group far below target'],
  'c14-b01': ['how large an error to expect for each input'],
  'c15-b01': ['Now change the traffic mix', 'Give long requests half the', "while each group's coverage stays the same"],
  'c15-b03': ['Compare signed errors, widths and', 'New calibration data help when', "meet the method's assumptions"],
  'c16-b02': ['When it withholds a correct', 'and the number of mistakes stays put', 'When it withholds a wrong'],
  'c16-b03': ['the answer goes out and its loss is one', 'Raise the threshold past more', 'At the score itself we'],
  'c16-b06': ['over the calibration sample and the next request', 'as the router gets stricter'],
  'c17-b01': ['when its verifier score is strictly above the threshold'],
  'c18-b03': ["That's ten percent joint error", 'The population coverage figure was', 'and every answer this policy sent was wrong'],
  'c18-b04': ['label the answers the policy actually sends'],
  'c19-b01': ['whose whole interval fits under the deadline', 'how many of those routed requests will finish on time'],
  'c19-b03': ['We now need the ninth', 'at twenty-eight through fifty-two'],
  'c19-b04': ['This time change just the eighth error'],
  'c19-b05': ['eighteen milliseconds wide', 'The same slot holds a'],
  'c19-b06': ['and measure the deadline failures', 'on the requests your policy actually selects'],
  'c20-b01': ['and where do the endpoints land'],
  'c04-b01': [
    'at least eighty percent',
    'across repeated draws',
    'That leaves twenty percent',
    'Count nine held-out errors',
    'Multiply ten by point eight',
    'That gives rank eight',
  ],
  'c04-b02': [
    'Count to the eighth slot',
    'The error there',
    'Eight is doing two jobs',
    'The position is a count',
    'The height of the brass',
  ],
  'c04-b03': ['Ten times point eight five', 'lands halfway between eight and nine', 'Which stick'],
  'c04-b04': [
    'That stick measures twelve milliseconds',
    'The rule is the ceiling',
    'including the future one',
    'times the desired coverage',
    'Take the value',
  ],
  'c05-b01': [
    'To select rank eight',
    'ask partition for index seven',
    'It returns eight milliseconds',
    'Partition only needs',
    'in the right place',
  ],
  'c05-b02': [
    'with the level set to eight ninths',
    'For nine scores',
    'It multiplies that last index',
    'and rounds up',
    'That picks index eight',
    'The call returns twelve milliseconds',
    'An interval this wide',
    'but it uses a different stick',
  ],
  'c05-b03': [
    'Rank nine uses index eight',
    'The quantile level',
    'This time both calls return twelve',
    'Agreement at the maximum',
    'could hide the earlier indexing mistake',
  ],
  'c05-b04': [
    'the corrected rank is ten',
    'Look at the empty slot',
    'With only nine calibration errors',
    'the ordinary rule gives an infinite radius',
    'Clipping to the largest stick',
    'would cover just nine of ten',
    'How many held-out errors',
    'would make a finite threshold possible at ninety-five percent',
  ],
  'c05-b05': [
    'With nineteen scores',
    'rank nineteen exists',
    "That's the first sample size",
    'where the required slot',
    'The largest observed error',
    'A stable threshold',
  ],
  'c09-b02': ['What fraction of these four'],
  'c09-b03': [
    'The calibration sample',
    'The test then',
    'Even a million test requests',
    'would measure coverage',
    'The marginal guarantee',
    'and fresh requests together',
  ],
  'c09-b04': ['Replay only the fourth outcome', 'Where does the count'],
  'c09-b05': [
    'The endpoint belongs',
    'Changing one outcome',
    'from three quarters to one',
    'The target and the sixteen-millisecond width',
  ],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
    if (entry.beat.id === 'c08-b02') {
      // Make the denominator explicit without changing the spoken word clock.
      const denominator = entry.words.findIndex(({ text }, i) =>
        text === 'n' && entry.words.slice(i, i + 3).map(word => word.text).join(' ') === 'n plus one.');
      if (denominator < 0) throw new Error('Expected n plus one in the coverage formula.');
      entry.words = entry.words.map((word, i) => {
        if (i === denominator) return { ...word, text: '(n' };
        if (i === denominator + 2) return { ...word, text: 'one).' };
        return word;
      });
    }
  }
}
