# Cloud Capsule

## Current State
The app has a beneficiary login page where beneficiaries must enter the full capsule owner principal ID (a long string like `xxxxx-xxxxx-xxxxx-xxxxx-xxx`), a username, and a password. The principal ID is displayed in the Beneficiaries tab and Access tab for the owner to copy/share. There is no short code or shareable direct link.

## Requested Changes (Diff)

### Add
- `capsuleCode` field to the `Capsule` type — a short `CLOUD-XXXXX` code (prefix + 5 random alphanumeric characters) generated automatically at capsule creation time (new capsules only; existing capsules are unaffected)
- `getCapsuleByCode(code: Text) : async ?Principal` — a public query that looks up a capsule owner principal by short code; enables beneficiaries to use the code instead of the full principal
- A global code registry `Map<Text, Principal>` to index codes to owner principals
- Shareable direct URL displayed in both Beneficiaries tab and Access tab: `/access/CLOUD-XXXXX` that pre-fills the code on the beneficiary login page (via URL param or route segment)
- `/access/:code` route in the frontend that pre-fills the short code field on the login page
- A copy button for the shareable link in both the Beneficiaries tab and Access tab

### Modify
- `createCapsule()` — generate and store a unique `CLOUD-XXXXX` code in the code registry when a new capsule is created
- `beneficiaryLogin` — accept either a short code OR full principal ID as the owner identifier; if input matches `CLOUD-XXXXX` format, resolve it to a principal via the registry before proceeding
- `BeneficiaryLoginPage` — replace the "Capsule Owner ID" label/field with a friendlier "Capsule Code" field that accepts `CLOUD-XXXXX` codes (and still supports full principal ID for backward compatibility with existing users). Update validation accordingly.
- `BeneficiariesTab` — add shareable link section showing the `CLOUD-XXXXX` code and copy button for `/access/CLOUD-XXXXX` URL. Update the info box to reference the short code instead of the full principal.
- `AccessTab` — add shareable link section showing the `CLOUD-XXXXX` code and copy button for `/access/CLOUD-XXXXX` URL.
- `DashboardPage` / backend queries — expose a way to get the current user's capsule code so the frontend can display it

### Remove
- Nothing removed; full principal ID remains supported as a fallback login method for backward compatibility

## Implementation Plan
1. Update Motoko backend:
   - Add `capsuleCode` field to `Capsule` type
   - Add global `capsuleCodes` map `Map<Text, Principal>`
   - Add `generateCapsuleCode()` private helper to produce unique `CLOUD-XXXXX` codes
   - Update `createCapsule()` to generate and register a code
   - Add `getCapsuleByCode(code: Text) : async ?Principal` public query
   - Add `getMyCapsuleCode() : async ?Text` authenticated query for the owner to retrieve their code
   - Update `beneficiaryLogin` to accept short code or principal: if input contains `CLOUD-`, resolve to principal first

2. Update frontend routing — add `/access/:code` route that maps to BeneficiaryLoginPage with pre-filled code

3. Update `BeneficiaryLoginPage`:
   - Change field label from "Capsule Owner ID" to "Capsule Code or Owner ID"
   - Accept `CLOUD-XXXXX` format; if detected, call `getCapsuleByCode` to resolve to principal before calling `beneficiaryLogin`
   - Improve placeholder/helper text to be friendly for non-technical beneficiaries
   - If route param `:code` is present, pre-fill the field and auto-focus username

4. Update `BeneficiariesTab`:
   - Fetch and display the owner's capsule code via `getMyCapsuleCode`
   - Show shareable link (`{appUrl}/access/{code}`) with a copy button
   - Update "Copy Access" per beneficiary to include the short link instead of the raw principal
   - Update info box text to reference the short code

5. Update `AccessTab`:
   - Show the capsule code and shareable link with a copy button
   - Display a note explaining that new users get a short code; existing users without a code should see a message explaining they can share their principal ID directly
