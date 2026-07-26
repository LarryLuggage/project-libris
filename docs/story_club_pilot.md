# Story Club Concierge Pilot

## Product Fit

Story Club is a lead magnet and validation loop for Project LIBRIS. The core app
helps readers discover literature through short excerpts; the pilot tests whether
those readers will also return for new member-submitted short fiction, voting,
and a lightweight literary community.

The Phase 1 implementation should remain a concierge pilot. LIBRIS only needs to
capture qualified interest in-app, then run submissions, editorial review,
finalist publishing, voting, winner checks, and prize payment manually.

## Positioning

Use this framing consistently:

- "A weekly short-story club with member voting and company-sponsored prizes."
- "Anonymous finalist voting, author reveal after the winner is announced."
- "Fixed $100 weekly company-sponsored prize."

Avoid this framing until legal review says otherwise:

- "Pot"
- "Entry fee"
- "Member-funded prize"
- "Prize funded by subscriptions"
- "Pay to submit"

## Phase 1 Scope

- Invite-only four-week pilot.
- 100 invited members: roughly 40 writers and 60 reader-only or reader-leaning members.
- No required payment during the pilot.
- Capture willingness-to-pay signal for a possible $5/month founding membership.
- U.S.-only participation unless legal review approves broader eligibility.
- One story per writer per week.
- Recommended story length: 1,000-5,000 words.
- Four anonymously published finalists per week.
- One member vote per week.
- $100 fixed weekly company-sponsored prize.

## App Integration

Current code-level integration:

- `POST /api/v1/story-club/waitlist` captures name, email, reader/writer role,
  genre preferences, and willingness to pay $5/month.
- The mobile feed exposes a Story Club entry point.
- The mobile Story Club screen positions the club as a pilot and sends leads to
  the API without requiring authentication.

This deliberately does not implement contests, submissions, voting, or payments
inside the app yet. Those flows should remain manual until the pilot proves
weekly supply, reader engagement, trust, and monetization intent.

## Manual Pilot Artifacts

Use external tools for Phase 1:

- Waitlist export from `story_club_leads`.
- Submission form with author name, email, title, story text/file, word count,
  genre, originality attestation, AI-use disclosure, and rights agreement checkbox.
- Voting form requiring member email, one vote per member per week, optional
  ranking, favorite note, and likelihood to return next week.
- Admin tracking sheet for members, submissions, eligibility, finalist status,
  votes, disqualifications, prize payment, and weekly metrics.
- Weekly email templates:
  - Monday finalist reveal.
  - Thursday voting reminder.
  - Friday winner announcement.
  - Writer submission reminder.
- Rules document covering eligibility, submission window, prize amount,
  originality, AI policy, plagiarism policy, voting rules, tie-breaks, tax
  responsibility, disqualification rights, and license terms.

## Success Criteria

Supply:

- At least 25 eligible submissions per week by week 3.
- At least 70% of selected finalists accept publication.

Reader engagement:

- At least 50 members open finalist emails weekly.
- At least 35 members vote weekly.
- At least 25 members report reading all four stories weekly.

Quality and trust:

- At least 75% of voters rate finalist quality as good or better.
- Fewer than 2 serious moderation or plagiarism incidents across the pilot.

Monetization signal:

- At least 30 members say they would likely pay $5/month.
- At least 15 members join a paid MVP waitlist or commit to founding membership.

Retention:

- At least 40 members participate in 2 or more weeks.
- At least 20 members participate in 3 or more weeks.

## Graduation Path

Build native contest features only after the pilot clears enough success criteria.
The likely sequence is:

1. Admin export and segmentation for `story_club_leads`.
2. Authenticated submission intake with rights and AI-use attestations.
3. Anonymous finalist publishing using the existing feed/excerpt surface.
4. Authenticated weekly voting with duplicate prevention.
5. Admin moderation, plagiarism-review status, and finalist acceptance workflow.
6. Paid founding membership and broader prize/legal review.
