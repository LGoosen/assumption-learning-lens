# Assumption Learning Lens — Roadmap

V1 ships with the manual, human-in-the-loop AI workflow. This document records
what's deliberately out of scope for V1 and how each future feature plugs in.

## Near-term (V1.1)

- **In-app role management**. Today, promoting a user to staff or management means
  editing the Firestore `users/{uid}` document. Add a Management page that lists all
  users and lets management change roles, with an audit trail.
- **Class roster integration**. Today, "which class belongs to which teacher" is
  inferred via mock data. Add a `classes` collection and a Management UI for adding
  classes and assigning a teacher.
- **CSV import** for class lists.
- **Email notifications** when a cycle opens, when a class summary is published,
  when a teacher reflection is overdue. Wired through SendGrid or Postmark.

## Mid-term (V2)

- **Cloud Functions for secure aggregation**. Rules currently allow staff and
  management to read raw submissions so the client can compute averages. Move that
  computation server-side. Tighten the rules to deny all client reads on
  `submissions` and serve only aggregated documents.
- **Audit log**. Every cycle change, question-set edit, settings update, and
  reviewed-summary save writes to an append-only `_audit` collection.
- **Automatic AI summarisation** via a Cloud Function calling a chosen provider
  (Gemini Flash or Claude Haiku). Always produces a draft, never publishes
  automatically.
- **PDF export** of management reports.
- **Comment moderation queue** in the management settings — flagged comments
  surface for human review with an "approve / reject / soften" workflow.
- **App Check** to prevent automated abuse.

## Long-term (V3)

- **Multi-school support** with tenant isolation, separate Firestore projects per
  school, and a school-selector at sign-in.
- **Parent summary view** — opt-in only, with a permission flow on the school side
  and clear explanations for parents about what they will and won't see.
- **Google Classroom integration** for class lists, sign-in, and notifications.
- **Data retention automation**. Cloud Function deletes raw responses after the
  retention window, preserving aggregated reports.
- **Accessibility audit**. Formal review against WCAG 2.2 AA.

## What's intentionally out of scope (probably forever)

- **Anything that ranks teachers**.
- **Public dashboards or leaderboards**.
- **Predictive judgements about specific staff or students**.
- **Direct, unreviewed AI publication** to teachers or parents.

These are not technical limits — they are design constraints aligned with the
purpose of the tool: to support honest reflection and professional growth, not to
surveil or rank.