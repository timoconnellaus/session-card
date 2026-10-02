// Twenty example cards across situations, for screenshots and design critique.
window.EXAMPLES = {
  '01 Quick answer': {
    project: 'session-card', title: 'Session status card plugin',
    summary: 'Answered, nothing waiting',
    blocks: [{ type: 'banner', state: 'done', title: 'Answered', sub: 'Nothing waiting on you' }],
  },
  '02 One thing to try': {
    project: 'tims-home', title: 'Voice messages on the planning page',
    about: 'Hold-to-talk on the planning page, sent as answers. Built and tested; waiting on a phone check.',
    summary: 'Your turn: try the mic',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'lanes', lanes: [
        { state: 'you', items: [{ lead: 'Try it on the phone.', text: 'Hold, talk, let go; slide left should cancel.', cost: '2 min', effort: 1 }] },
        { state: 'done', items: ['Mic on the planning page', 'Whisper transcription', '14 unit tests pass'] },
        { state: 'next', items: ['Publish the APK once you say go'] },
      ] },
      { type: 'actions', buttons: [{ label: 'It works, ship it', send: 'Tried the mic on the phone, it works. Ship it.', primary: true }, { label: "Something's off", send: 'Tried the mic on the phone and something is off:' }] },
    ],
  },
  '03 One decision': {
    project: 'frockbot', title: 'Order confirmation emails',
    about: 'Moving order emails from SendGrid to Cloudflare Email Service.',
    summary: 'Decide the sender address',
    send: { intro: 'About the order emails:', go: 'Go ahead.', alt: "Plan only, don't start yet." },
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'decide', q: 'Sender address', title: 'Which address should order emails come from?', options: [{ label: 'orders@frockbot.com', why: 'Clear, and replies go to the shared inbox', rec: true }, { label: 'hello@frockbot.com', why: 'Friendlier, but mixes with support mail' }] },
    ],
  },
  '04 Blocked on a key': {
    project: 'whats-on', title: 'Venue scraper',
    about: 'Adding Eventbrite listings to the Illawarra events index.',
    summary: 'Blocked: needs the Eventbrite key',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'lanes', lanes: [
        { state: 'stop', items: [{ lead: 'Eventbrite API key', text: 'missing in the Worker secrets' }] },
        { state: 'done', items: ['Scraper for 3 venues', 'Dedup by date and venue', 'Tests pass'] },
      ] },
      { type: 'cmd', cmd: 'wrangler secret put EVENTBRITE_KEY' },
      { type: 'actions', buttons: [{ label: "Done, it's set", send: 'The Eventbrite key is set. Carry on.' }] },
    ],
  },
  '05 Claude carries on': {
    project: 'frockbot', title: 'Email rules eval',
    summary: 'Your turn: say go to rerun the eval',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'lanes', lanes: [{ state: 'done', items: ['New rules written for 3 senders'] }, { state: 'next', items: ['Rerun the eval with the new rules', 'report the accuracy change'] }] },
      { type: 'actions', buttons: [{ label: 'Go ahead', send: 'Go ahead, rerun the eval.', primary: true }] },
    ],
  },
  '06 All done': {
    project: 'rxforpets', title: 'Dosage table migration',
    about: 'Prisma migration adding the dosage table and backfilling it.',
    summary: 'All done, safe to close',
    blocks: [
      { type: 'banner', state: 'done', sub: 'Safe to close this session' },
      { type: 'lanes', lanes: [{ state: 'done', items: ['Migration applied on staging and prod', 'Backfilled 1,204 rows', 'API tests pass (212)', 'Admin page shows dosages'] }] },
      { type: 'later', text: 'Add an index on `pet_id` once traffic grows.' },
    ],
  },
  '07 Back from a break': {
    project: 'pocketdoc', title: 'Booking page copy',
    summary: 'Where you left off',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'back', ago: '2 h ago', doing: 'Rewriting the booking page copy', last: 'Drafted three headline options' },
      { type: 'decide', q: 'Headline', title: 'Which headline?', options: [{ label: 'See a doctor today, from home', rec: true }, { label: 'Same-day telehealth appointments' }, { label: 'Book a GP in minutes' }] },
    ],
  },
  '08 Ship check': {
    project: 'tims-home', title: 'Chat mode',
    about: 'Talk to Claude on its own page, replies read out by ElevenLabs.',
    summary: 'Ready to ship except one typecheck error',
    blocks: [
      { type: 'banner', state: 'you', title: 'not ready to ship' },
      { type: 'git', branch: 'claude/chat-mode', ahead: 4, behind: 0, dirty: 0, merged: false, asOf: 'Fetched just now' },
      { type: 'checks', title: 'Ship gate', rows: [
        { state: 'done', name: 'Unit tests', scope: 'app', evidence: '142 passed · 0 failed' },
        { state: 'stop', name: 'Typecheck', scope: 'worker', evidence: '1 error · chat.ts:88' },
        { state: 'idle', name: 'On the phone', evidence: 'Not run' },
      ] },
      { type: 'lanes', lanes: [{ state: 'next', items: ['Fix the chat.ts type error', 'rerun the gate'] }] },
      { type: 'actions', buttons: [{ label: 'Go ahead, fix it', send: 'Go ahead, fix the type error and rerun the gate.', primary: true }] },
    ],
  },
  '09 Ready for review': {
    project: 'session-card', title: 'Minimal card style',
    summary: 'Ready for review',
    blocks: [
      { type: 'banner', state: 'you', title: 'review' },
      { type: 'diff', files: [{ path: 'renderer.js', add: 188, del: 142 }, { path: 'skills/session-card/SKILL.md', add: 12, del: 9 }, { path: 'README.md', add: 6, del: 4 }], meta: '4 files · +214 −158 · 1 not shown' },
      { type: 'proof', rows: [{ grade: 'observed', text: 'All 9 gallery cards render, dark and light', how: 'gallery in the browser' }, { grade: 'observed', text: 'Send, reset and copy work', how: 'clicked through' }, { grade: 'unchecked', text: 'Older Safari without :has()', how: 'no device' }] },
      { type: 'actions', buttons: [{ label: 'Looks good, release it (Safari unchecked)', send: 'Reviewed it, looks good. Release it; Safari is unchecked.', primary: true }] },
    ],
  },
  '10 Device test report': {
    project: 'tims-home', title: 'Sitting timer',
    summary: 'Test the step counter on the phone',
    send: { intro: 'Sitting timer phone test:', go: 'Fix anything that failed.' },
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'step', report: true, q: 'Phone test', label: 'Test on the phone', title: 'Walk for a minute, then check the timer', cost: '5 min', effort: 2, checks: [{ text: 'Timer resets after walking', value: 'resets after walking' }, { text: 'Movement event shows in the ledger', value: 'movement event logged' }] },
    ],
  },
  '11 What first?': {
    project: 'whats-on', title: 'Weekend digest',
    summary: 'Pick the order for the next steps',
    send: { intro: 'Order for the weekend digest work:', go: 'Do them in this order; stop after the first for me to check.', alt: 'Do them all in this order.' },
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'rank', q: 'Order', items: ['Email template', 'Sunday 8am schedule', 'Unsubscribe link', 'Open-rate tracking'] },
    ],
  },
  '12 End of day': {
    project: 'tims-home', title: 'Afternoon session',
    summary: 'Park open threads before you stop',
    blocks: [
      { type: 'banner', state: 'you', title: 'wrap up' },
      { type: 'park', items: [{ q: 'Beeper send flow', text: 'Beeper send flow' }, { q: 'Rules eval', text: 'Email rules eval' }, { q: 'Chat audio', text: 'Chat audio caching' }], parkAll: 'Park everything still open as Todoist tasks tagged later, then stop.' },
    ],
  },
  '13 Lots to do': {
    project: 'frockbot', title: 'Launch checklist',
    summary: 'Many items, yours first',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'rows', rows: [
        { state: 'you', text: '**Approve the pricing page**', cost: '5 min', buttons: [{ label: 'Approve', send: 'Pricing page approved.' }] },
        { state: 'you', text: 'Record the demo video', cost: '15 min' },
        { state: 'you', text: 'Pick the launch date' },
        { state: 'stop', text: 'Stripe live keys not set' },
        { state: 'next', text: 'Write the launch email' },
      ] },
    ],
  },
  '14 Progress': {
    project: 'pocketdoc', title: 'Telehealth booking flow',
    summary: 'Step 3 of 5',
    blocks: [
      { type: 'banner', state: 'you', title: 'step 3 of 5' },
      { type: 'track', stages: [{ label: 'Plan', state: 'done' }, { label: 'Calendar API', state: 'done' }, { label: 'Booking form', state: 'next' }, { label: 'You test it', state: 'idle' }, { label: 'Ship', state: 'idle' }] },
      { type: 'actions', buttons: [{ label: 'Carry on', send: 'Carry on with the booking form.', primary: true }] },
    ],
  },
  '15 Tests failing': {
    project: 'rxforpets', title: 'Refill reminders',
    summary: 'Two tests fail',
    blocks: [
      { type: 'banner', state: 'you', title: '2 of 48 tests failing' },
      { type: 'checks', rows: [
        { state: 'stop', name: 'reminder.spec.ts', evidence: 'timezone off by a day' },
        { state: 'stop', name: 'schedule.spec.ts', evidence: 'expects 3 reminders, got 2' },
        { state: 'done', name: '46 others', evidence: 'passed' },
      ] },
      { type: 'lanes', lanes: [{ state: 'next', items: ['Fix the timezone handling', 'rerun the suite'] }] },
      { type: 'actions', buttons: [{ label: 'Go ahead, fix them', send: 'Go ahead, fix the two failing tests.', primary: true }] },
    ],
  },
  '16 Approve a plan': {
    project: 'session-card', title: 'Swift companion app',
    summary: 'Approve the plan',
    send: { intro: 'About the companion app plan:', go: 'Go ahead.' },
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'approve', q: 'Plan', title: 'Stop hook posts cards to a Worker; the iPhone app reads it live', text: 'Read-only first, answering from the phone in version 2.' },
    ],
  },
  '17 Describe a bug': {
    project: 'tims-home', title: 'Widget not updating',
    summary: 'Tell me what you saw',
    send: { intro: 'About the widget bug:', go: 'Look into it.' },
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'reply', q: 'What happened', title: 'What did you see on the home screen?', placeholder: 'The widget still showed…', required: true, min: 12 },
    ],
  },
  '18 Deploy running': {
    project: 'whats-on', title: 'Search index rebuild',
    summary: 'Deploy running, no need to watch',
    blocks: [
      { type: 'banner', state: 'next', title: 'deploying', sub: 'Nothing needs you · back in about 3 min' },
      { type: 'exit', state: 'next', text: '**Deploy running.** No need to watch.', sub: 'Claude reports back when it is live.' },
      { type: 'env', envs: [{ state: 'next', name: 'Worker', where: 'production', version: 'a41c9e2', status: 'Deploying' }, { state: 'done', name: 'Index', where: 'KV', status: 'Rebuilt 8,412 events' }] },
    ],
  },
  '19 Progress since last look': {
    project: 'frockbot', title: 'Product image pipeline',
    summary: '+4 done since your last look',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'win', text: '**+4 done** since your last look', meta: '9 of 12 overall' },
      { type: 'skip', text: 'the sharp deprecation warning, 2 flaky retries that passed' },
      { type: 'lanes', lanes: [{ state: 'next', items: ['Resize the last 3 product sets'] }] },
      { type: 'actions', buttons: [{ label: 'Carry on', send: 'Carry on with the last 3 product sets.', primary: true }] },
    ],
  },
  '20 Long lists fold': {
    project: 'tims-home', title: 'Big cleanup',
    about: 'Removing the old Horizon home screen and its pages.',
    summary: 'Many items fold away',
    blocks: [
      { type: 'banner', state: 'you' },
      { type: 'lanes', lanes: [
        { state: 'you', items: [{ lead: 'Check', text: 'the home screen still loads' }, { lead: 'Check', text: 'Back returns home' }, { lead: 'Decide', text: 'keep the routine card?' }, { lead: 'Check', text: 'widgets on the lock screen' }, { lead: 'Check', text: 'safe mode still works' }] },
        { state: 'done', items: ['Removed Horizon.kt', 'Removed Pages.kt', 'Moved routine card', 'Updated layout.json', 'Deleted 12 dead strings', '41 tests pass', 'APK builds'] },
        { state: 'next', items: ['Publish the APK', 'Update CLAUDE.md'] },
      ] },
    ],
  },
};
