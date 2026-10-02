// Example specs: one card per common shape, covering every block type.
window.EXAMPLES = {
  'Your turn: lanes': {
    project: 'tims-home',
    title: 'Voice messages on the planning page',
    about: 'Hold-to-talk on the planning page, transcribed by Whisper and sent as answers. Built and tested; waiting on a phone check.',
    summary: 'Your turn: 2 things need you, 3 done',
    blocks: [
      { type: 'banner', state: 'you', sub: '2 things · about 7 min', bar: ['done', 'done', 'done', 'you', 'you', 'idle', 'idle'] },
      { type: 'lanes', lanes: [
        { state: 'done', items: ['Hold-to-talk mic on the planning page', 'Whisper transcription wired up', '14 unit tests pass', 'Slide left cancels', 'Vocab in the Whisper prompt'] },
        { state: 'you', hot: true, items: [{ lead: 'Try it on the phone.', text: 'Slide left to cancel.', cost: '2 min', effort: 1 }, { lead: 'Decide:', text: '“UI,” on the planning page?', cost: '1 min', effort: 1 }] },
        { state: 'next', items: ['Publish the APK once you say go', 'Update CLAUDE.md'] },
      ] },
      { type: 'note', state: 'stop', text: "**Heads up:** the ElevenLabs key isn't set, so replies stay text-only." },
      { type: 'skip', text: '2 lint warnings, the Gradle deprecation notice' },
      { type: 'actions', buttons: [{ label: 'Tested it, ship it', send: 'Tested it on the phone, it works. Ship it.', primary: true }, { label: 'Help me decide', send: 'Help me decide whether UI, should work on the planning page.' }] },
    ],
  },
  'Back from a break: one step': {
    summary: 'Where you left off, and one next step',
    blocks: [
      { type: 'back', ago: '42 min ago', doing: 'Voice messages on the planning page', last: 'Mic records and transcribes, tests pass', now: 'Try the mic on your phone' },
      { type: 'step', title: 'Try the voice button on your phone', cost: '2 min', effort: 1, checks: ['Open the planning page', 'Hold the mic, talk, let go', 'Hold again, slide left: nothing should send'] },
      { type: 'win', text: '**+3 done** since your last look', meta: '5 of 7 overall' },
      { type: 'exit', state: 'idle', text: '**Safe to stop here.** Nothing is half-done.', sub: 'To pick up, say “carry on with voice”.' },
    ],
  },
  'Progress track': {
    summary: 'Step 4 of 5: you review',
    blocks: [
      { type: 'banner', state: 'you', sub: 'Step 4 of 5 · you review' },
      { type: 'track', stages: [{ label: 'Asked', state: 'done' }, { label: 'Built', state: 'done' }, { label: 'Tests pass', state: 'done' }, { label: 'You review', state: 'you' }, { label: 'Ship', state: 'idle' }] },
      { type: 'chips', chips: [{ state: 'done', text: '3 done' }, { state: 'you', text: '2 on you' }, { state: 'next', text: '2 on Claude' }] },
      { type: 'meta', text: '3 turns · 41 min' },
    ],
  },
  'Scoreboard: rows with answers': {
    summary: 'Scoreboard: 3 done, 2 on you, 2 on Claude, 1 blocked',
    blocks: [
      { type: 'tiles', tiles: [{ state: 'done', label: 'Done', value: 3 }, { state: 'you', label: 'On you', value: 2 }, { state: 'next', label: 'On Claude', value: 2 }, { state: 'stop', label: 'Blocked', value: 1 }] },
      { type: 'rows', rows: [
        { state: 'you', text: '**Try the mic on the phone**', cost: '2 min', buttons: [{ label: 'Works', send: 'Tried the mic on the phone, it works.' }] },
        { state: 'stop', text: 'Spoken replies need an ElevenLabs key' },
        { state: 'next', text: 'Publish the APK once you say go' },
        { state: 'done', text: 'Mic, transcription, 14 tests passing' },
      ] },
      { type: 'cmd', cmd: 'wrangler secret put ELEVENLABS_API_KEY' },
    ],
  },
  'Ship check: dev workflow': {
    project: 'tims-home',
    title: 'Voice messages on the planning page',
    about: 'Getting the voice feature merged and onto the phone.',
    summary: 'Ship check: branch, checks and environments',
    blocks: [
      { type: 'banner', state: 'next', title: 'Ready to ship', sub: 'Waiting on one phone check' },
      { type: 'git', branch: 'claude/voice-support', worktree: 'voice-support-9747e6', ahead: 3, behind: 2, dirty: 0, merged: false, asOf: 'As of fetch at 14:02' },
      { type: 'pr', state: 'next', number: 42, title: 'Voice messages on the planning page', status: 'Open', meta: [{ state: 'done', text: 'Checks 6/6' }, { state: 'idle', icon: 'eye', text: 'No review yet' }, { state: 'stop', icon: 'git-compare', text: 'Conflicts with main' }] },
      { type: 'checks', title: 'Ship gate', rows: [
        { state: 'done', name: 'Unit tests', scope: 'app/src/test', evidence: '142 passed · 0 failed' },
        { state: 'stop', name: 'Typecheck', scope: 'worker', evidence: '2 errors · chat.ts' },
        { state: 'idle', name: 'Worker tests', scope: 'bun test', evidence: 'Stale · ran before last edit' },
        { state: 'idle', name: 'On the phone', evidence: 'Not run · needs you' },
      ] },
      { type: 'env', envs: [{ state: 'done', name: 'Worker', where: 'production', version: 'db4d737', status: 'Deployed 14:05' }, { state: 'you', name: 'APK', where: 'phone', version: 'v4410', status: 'Published · install not confirmed' }, { state: 'idle', name: 'Surface', where: 'KV', status: 'Not touched' }] },
    ],
  },
  'Ready for review: proof and diff': {
    summary: 'Ready for review: what changed and how we know it works',
    blocks: [
      { type: 'banner', state: 'you', title: 'Ready for your review', sub: '7 files · about 10 min' },
      { type: 'diff', files: [{ path: 'app/src/main/java/dev/tim/home/Voice.kt', add: 120, del: 14 }, { path: 'worker/src/voice.ts', add: 31, del: 9 }, { path: 'app/src/main/java/dev/tim/home/PlanningView.kt', add: 22, del: 3 }], meta: '7 files · +212 −40 · 4 not shown' },
      { type: 'proof', rows: [{ grade: 'observed', text: 'Mic posts WAV, text comes back', how: 'ran on emulator, /voice 200' }, { grade: 'tested', text: 'Slide-left cancels, nothing sent', how: 'VoiceTest, new case' }, { grade: 'inferred', text: 'Planning id rides along', how: 'read code, not run' }, { grade: 'unchecked', text: 'Android 12 permission prompt', how: 'no device' }] },
      { type: 'risk', items: [{ lead: 'Live now:', text: '/voice changed for every client' }, { lead: 'Blast radius:', text: 'voice only; plan untouched' }], rollback: 'git revert db4d737 && home worker deploy' },
    ],
  },
  'Questions: answer from the card': {
    summary: 'Three questions for you, answered together',
    send: { intro: 'Answers to your voice-support questions:', go: 'Go ahead.' },
    blocks: [
      { type: 'decide', q: 'UI, prefix on planning page', title: 'Should “UI,” work on the planning page?', other: true, options: [{ label: 'Yes, same rule', value: 'yes, same as the input bar', why: 'Consistent; small risk of accidental UI changes', rec: true }, { label: 'No', value: 'no, answers only', why: 'Planning stays focused on answers' }] },
      { type: 'ask', questions: [{ q: 'Publish the APK now', text: 'Publish the APK now?', rec: 'yes' }, { q: 'Update CLAUDE.md', text: 'Update CLAUDE.md?', rec: 'yes' }] },
      { type: 'approve', q: 'Plan for voiced chat replies', title: 'Voice replies with ElevenLabs, text fallback' },
    ],
  },
  'Report back and reorder': {
    summary: 'Phone test with a report, and the order for next steps',
    send: { intro: 'Phone test results and order:', go: 'Fix what failed first, then do them in this order.' },
    blocks: [
      { type: 'step', report: true, q: 'Phone test of the mic', label: 'Test on the phone', title: 'Try the voice button', cost: '2 min', checks: [{ text: 'Hold, talk, let go: text appears', value: 'hold and talk transcribes' }, { text: 'Slide left cancels, nothing sent', value: 'slide-left cancel' }] },
      { type: 'rank', q: 'Order for next steps', items: ['Publish the APK', 'Update CLAUDE.md', 'Add vocab words'] },
      { type: 'reply', q: 'Anything else', title: 'Anything else?', placeholder: 'Optional' },
    ],
  },
  'All done, with parking': {
    summary: 'All done; park the open threads',
    blocks: [
      { type: 'banner', state: 'done', sub: 'Nothing needs you. Safe to close this session.', bar: ['done', 'done', 'done', 'done', 'done'] },
      { type: 'fold', summary: '5 done · nothing needs you', items: ['Voice on the planning page', 'Tested on the phone', 'Merged and pushed', 'APK published', 'CLAUDE.md updated'] },
      { type: 'park', items: [{ q: 'Beeper send flow', text: 'Beeper send flow' }, { q: 'Rules eval', text: 'Run the email rules eval' }], parkAll: 'Park everything still open as Todoist tasks tagged later, then stop here.' },
      { type: 'later', text: 'Let “UI,” work on the planning page too.' },
    ],
  },
};
