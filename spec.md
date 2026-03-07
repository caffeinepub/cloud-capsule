# Cloud Capsule

## Current State
The app has a working dashboard with Notes, Media, Neurons, Beneficiaries, and Settings tabs. Users log in with Internet Identity, create a capsule via an onboarding modal, and manage their legacy content. Blob storage handles media uploads.

## Requested Changes (Diff)

### Add
- Retry logic for `getCallerUserProfile` query so transient initialization errors don't permanently block onboarding
- `isError` check in `showOnboarding` condition so a query error still shows the onboarding modal

### Modify
- `useGetCallerUserProfile`: remove `retry: false`, let React Query use default retry behavior
- `DashboardPage.showOnboarding`: treat `isError || userProfile === null` as needing onboarding (not just `=== null`)
- `DashboardPage`: guard all tab content so it only renders after the capsule is confirmed to exist (profile is saved)
- Backend `NeuronEntry` type: add `id` field so update/delete operations have a stable key
- `getCapsuleNotes`, `getCapsuleMedia`, `getNeuronEntries`, `getGlobalInstructions` queries: gracefully handle "Capsule not found" errors by returning empty defaults instead of propagating the error
- `useGetNeuronEntries`: return entries with their map key as `id` so edit/delete work
- Backend `getNeuronEntries`: include the entry ID in each returned record
- `MediaTab`: wire the `compress` toggle into the upload flow
- `useBlobUpload`: accept and apply compression option when uploading videos

### Remove
- Nothing removed

## Implementation Plan
1. Fix `useGetCallerUserProfile` – remove `retry: false`, add `staleTime: 0` to always refetch on mount
2. Fix `DashboardPage.showOnboarding` – also show onboarding when `isError` is true
3. Fix query error handling – wrap `getCapsuleNotes`, `getCapsuleMedia`, `getNeuronEntries`, `getGlobalInstructions` with try/catch returning empty defaults on "Capsule not found" errors
4. Fix backend `NeuronEntry` – add `id: Text` field; update `createNeuronEntry` to store it; update `getNeuronEntries` to return it
5. Fix `updateNeuronEntry` in backend – it currently doesn't look up the existing entry, it just overwrites; also store the id field
6. Fix `MediaTab` compress toggle – pass `compress` flag through to `uploadFile` and do client-side canvas resize/quality reduction for videos
