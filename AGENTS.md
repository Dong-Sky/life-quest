# Life Quest — Project Instructions

## Product Definition

Life Quest is a general-purpose gamified personal management system.

Users define their own:

- life areas
- goals
- projects
- quests
- habits
- real-world rewards

The system defines and controls:

- XP calculation
- coin calculation
- levels
- achievements
- reward settlement
- review statistics

The product must not prescribe what a successful life should look like.

## Core Product Rules

- Users cannot manually enter XP or coin rewards.
- A quest can only be settled once.
- Every XP and coin change must have an auditable transaction record.
- Historical rewards must retain their original calculation version.
- AI-generated suggestions must be confirmed by the user before being saved.
- User data is private by default.
- Social sharing must be opt-in.
- Do not introduce public rankings without explicit approval.

## Engineering Rules

- Use TypeScript strict mode.
- Do not use `any` to bypass type errors.
- Do not expose secrets or service-role keys in client-side code.
- All database changes must use versioned migrations.
- Do not modify unrelated modules.
- Do not expand task scope without approval.
- Reuse existing components before creating new ones.
- Add tests for business-critical rules.
- Do not delete or weaken tests merely to make them pass.

## Required Checks

Before completing a task, run:

- typecheck
- lint
- unit tests
- integration tests where applicable
- production build

## Required Completion Report

For every task, report:

1. Implementation summary
2. Files changed
3. Database changes
4. Tests executed and results
5. Known limitations
6. Manual verification steps
