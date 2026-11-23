const phraseStarts = {
  'c02-b01': ['Under this prompt', 'the first token has probability six tenths', 'Given that same prompt', 'the next one gets four tenths'],
  'c02-b02': [
    'Twenty-four hundredths is the probability',
    'of getting both tokens in that order',
    'For each token',
    'given the prompt and the tokens already chosen',
  ],
  'c02-b03': ['it can cache its keys and values'],
  'c02-b04': ['Keep the current rule', 'and page status in its prompt', 'Long incident logs', "out of the model's finite context window"],
  'c03-b01': ['within thirty minutes of a P1 declaration', 'Twelve minutes have passed'],
  'c04-b03': [
    'In an interface that supports the developer role',
    'with priority over user requests',
    'those instructions take precedence',
    'An archived note may contain the word system',
    'The application still assigns it the user role',
    'Serialize the note as data',
    'so its punctuation stays inside the quoted content',
  ],
  'c04-b04': ['Luna fetches the rule from approved storage', 'and the page status from current incident state'],
  'c05-b02': ['Now add one boundary example', 'At thirty-one minutes', 'The deadline stays at thirty', 'the overdue flag is true', 'and the source is the runbook line'],
  'c05-b03': [
    'Name the action, deadline in minutes',
    'overdue flag and source line IDs',
    'Give the deadline in minutes, cite that line',
    'and mark the incident overdue only when elapsed time exceeds its limit',
    'Otherwise request review',
    'with a null deadline',
    'and an empty source list',
  ],
  'c06-b01': ['misleading instructions go to the writers', 'and a new capability'],
  'c06-b02': ['The first one goes to docs', 'The program simulates'],
  'c06-b03': ['With two or more, it’s few-shot', 'while its weights stay fixed'],
  'c06-b04': [
    'Does the model favor the last label it saw',
    'Zhao and colleagues found effects',
    'Start with balanced examples',
  ],
  'c06-b05': ['in their studied tasks'],
  'c06-b06': ['and score that same ticket again'],
  'c07-b03': ['Our supplied revised reply now contains thirty', 'with overdue false for the current twelve-minute incident'],
  'c08-b01': ['Each extra token costs another generation step', 'and gives later tokens a partial result', 'Early chain-of-thought experiments', 'showed worked intermediate steps in the prompt', 'and improved performance'],
  'c08-b02': ['writes its keys and values', 'when it processes that token on the next forward pass'],
  'c08-b03': ['A concise justification that names the evidence', 'gives Luna something she can check'],
  'c08-b04': ['For a separate explanation experiment', 'replace the output instruction', 'with the same JSON wrapper'],
  'c09-b01': ['Ninety minutes and an hour and a half', 'should count as the same deadline'],
  'c09-b02': ['Four out of five', 'gives ninety an eighty percent share of this vote'],
  'c10-b03': ['Change just the deadline digits to ninety'],
  'c11-b07': ['or part of a byte sequence', 'It closes the array first', 'then the surrounding object'],
  'c11-b08': [
    'then the array',
    'then pop the object',
    'A stack can keep track of arbitrary nesting depth',
    "within the parser's resource limits",
  ],
  'c12-b01': ['and rejects every duplicate', 'It also rejects nonstandard constants'],
  'c12-b03': ['and a list of string source IDs', 'A page recommendation must cite the applicable line'],
  'c12-b06': ['It recommends a first page under IR-7', 'and says overdue is false', 'Run the Python validator'],
  'c12-b08': ['on its own generated replies'],
  'c13-b02': ['fetch the current rule from approved storage', 'the number fails against IR-7'],
  'c13-b03': ['In an indirect prompt injection', 'retrieved text deliberately tries to steer the model', 'Recomputing the decision from trusted facts', 'lets the application enforce the boundary'],
  'c14-b01': ['A separate privacy test', 'looks for a harmless marker', 'copied literally into the reply', 'That test alone tells us nothing', 'about a wrong decision or an encoded copy'],
  'c14-b02': ['Imagine another worker sends the page', 'after Luna checks the snapshot'],
  'c14-b03': ['to an atomic claim or an idempotent send'],
  'c17-b03': ['Use separate development cases', 'to compare that version with the one-example prompt'],
  'c18-b05': ['It allows forty-five minutes from P1 declaration', 'Follow the green marker'],
};

export function prepareCaptions(schedule) {
  for (const entry of schedule) {
    const phrases = phraseStarts[entry.beat.id];
    if (!phrases) continue;
    for (const phrase of phrases) entry.markCaption(phrase);
    entry.cueWordIndices = new Set(entry.cueWordIndices);
  }
}
