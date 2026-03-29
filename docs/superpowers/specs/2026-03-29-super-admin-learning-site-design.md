# Super Admin Learning-Site Entry Design

## Goal

Keep the admin navbar `Website` action generic while making it explicit where a super admin can enter the learner-facing product without routing them into the broken learner dashboard path.

## Current Problem

- The admin navbar now sends all admin sessions to the public site at `/`.
- Super admins can reach the public landing page, but the landing-page signed-in CTA still assumes a learner account and points to `/dashboard`.
- `/dashboard` is user-only and depends on a `User` record, so super admins should not be sent there.

## Decision

- Keep a single generic `Website` button in the admin navbar and admin dropdown.
- That button always routes to the public landing page `/` for both admin and super-admin sessions.
- On the public landing page, detect signed-in super-admin sessions and change the primary signed-in CTA label from `Open dashboard` or equivalent learner wording to `Open learning site`.
- The super-admin learning-site CTA routes to `/browse-skills`, which is already a protected, learner-facing surface that does not depend on the learner dashboard’s `User.findById(req.userId)` path.
- Reuse the same role-aware target anywhere the public site currently sends signed-in users to `/dashboard` from prominent CTAs on the landing page.

## Scope

In scope:

- Add one shared client helper that resolves the signed-in public CTA target for:
  - regular users
  - admins
  - super admins
- Update the landing page to use that helper for its signed-in CTA copy and destinations.
- Keep the admin navbar `Website` behavior unchanged as a public-site entry.
- Add tests for the helper behavior and any copy/target logic that is easy to verify without brittle DOM snapshots.

Out of scope:

- Reworking the learner dashboard backend to support admin identities.
- Adding a chooser screen or a second admin-navbar button.
- Refactoring every historic `/dashboard` reference in the whole app during this pass.

## UX Behavior

### Admin Navbar

- `Website` remains a single generic label.
- Clicking it opens `/`.

### Public Landing Page

- Guest session:
  - CTA behavior remains guest-oriented.
- Learner session:
  - Signed-in CTA continues to use learner-oriented wording and target.
- Admin session:
  - Signed-in CTA should avoid pretending the admin has learner progress.
  - If the session is super admin, the CTA label becomes `Open learning site`.
  - The CTA target becomes `/browse-skills`.
  - If the session is non-super admin, keep sending them to the public site and avoid exposing learner-specific copy as if they have learner access.

## Implementation Notes

- Extend the existing navbar/access helper layer instead of embedding more role branches in `landingPage.jsx`.
- Prefer a small pure helper such as `resolvePublicWebsiteEntry(...)` or equivalent that returns:
  - `label`
  - `path`
- Source inputs should come from stored session state already used elsewhere:
  - `token`
  - `userRole`
  - `isSuperAdmin`
- The helper must never return `/dashboard` for admin-role sessions.

## Error Handling

- If no session exists, fall back to guest CTA behavior.
- If stored role data is missing or malformed, normalize it through existing access helpers and default to non-admin behavior.

## Testing

- Add or extend unit tests to verify:
  - learner session resolves to learner dashboard/workspace behavior
  - super-admin session resolves to `Open learning site` and `/browse-skills`
  - admin non-super session does not resolve to `/dashboard`
- Run client verification:
  - `npm test`
  - `npm run lint`
  - `npm run build`
- Run one browser smoke check:
  - log in as super admin
  - click `Website`
  - verify landing CTA points to the learning-site target instead of `/dashboard`

## Risks

- There are multiple public CTAs on the landing page. Missing one would leave inconsistent wording or destinations for super-admin sessions.
- Some pages outside the landing page still hardcode `/dashboard`; those should be treated as follow-up cleanup unless directly touched by this scoped change.
