# Cloud Capsule

## Current State
A full-stack Internet Computer app where users log in with Internet Identity to create a personal "capsule" containing notes, media (photos/videos), neuron instructions, and beneficiary accounts. Beneficiaries can access the capsule via a short code and username/password. The app has a landing page, owner dashboard, beneficiary login/view, and admin dashboard at /admin.

The Settings tab currently has:
- Profile name editor
- "Your Data & Privacy" info card explaining IC infrastructure

There is no way for a user to delete their capsule.

## Requested Changes (Diff)

### Add
- `deleteCapsule()` backend function that removes the caller's capsule and their user profile from state
- "Danger Zone" section at the bottom of the Settings tab with a "Delete Capsule" button
- Confirmation AlertDialog warning the user that all notes, media, neuron instructions, and beneficiary accounts will be permanently deleted
- User must type "DELETE" to confirm before the button becomes active
- After successful deletion, navigate the user back to the landing page "/"

### Modify
- Settings tab: add the new Danger Zone section below the existing cards

### Remove
- Nothing

## Implementation Plan
1. Add `deleteCapsule(): Promise<void>` to backend (via generate_motoko_code)
2. Add `useDeleteCapsule` mutation hook in useQueries
3. Update SettingsTab to accept an `onDeleteCapsule` prop and render the Danger Zone card with AlertDialog
4. Wire up the prop in DashboardPage, navigating to "/" on success
