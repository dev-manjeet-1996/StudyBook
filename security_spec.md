# StudyBook Firestore Security Specification

## 1. Data Invariants
1. **Strict Ownership Isolation**: Every document under `/users/{userId}` and all subcollections (`syllabusProgress`, `studyLogs`, `mockScores`, `questionBank`, `chapterNotes`) belongs strictly to the verified authenticated user (`request.auth.uid == userId && request.auth.token.email_verified == true`).
2. **Master Gate Relational Integrity**: Subcollection writes require the parent `/users/{userId}` profile document to exist (`exists(/databases/$(database)/documents/users/$(userId))`) and `incoming().ownerId == request.auth.uid`.
3. **Immutable Ownership & Timestamps**: `ownerId` and `createdAt` can never be modified after creation. `createdAt == request.time` on create; `updatedAt == request.time` on create and update.
4. **Strict Key Allowlists & Size Bounds**: Every collection validates `hasAll` and `hasOnly` on create, `affectedKeys().hasOnly(...)` on update, `isValidId()` on document IDs, and explicit `.size()` bounds on every string and array.
5. **No Blanket List Access**: Every `allow list` verifies `resource.data.ownerId == request.auth.uid`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Read/Write**: `request.auth == null` attempting to read or write `/users/alice`.
2. **Unverified Email Bypass**: Authenticated user with `email_verified: false` attempting to create `/users/alice`.
3. **Cross-User Identity Spoofing**: Authenticated user `bob` writing `/users/alice/studyLogs/log1` with `ownerId: "bob"`.
4. **Owner Field Tampering**: User `alice` creating `/users/alice/studyLogs/log1` with `ownerId: "bob"`.
5. **Shadow / Ghost Field Injection**: User `alice` creating `/users/alice` with an undeclared field `isAdmin: true`.
6. **ID Poisoning Attack**: User `alice` creating a document with a 500-character invalid ID containing spaces or slashes.
7. **Denial-of-Wallet Oversized String**: User `alice` writing a 200KB `takeaways` string in `studyLogs` (max 1000).
8. **Timestamp Backdating**: User `alice` supplying a client timestamp instead of `serverTimestamp()` (`request.time`) for `createdAt` or `updatedAt`.
9. **Immutable Field Mutation**: User `alice` attempting to alter `createdAt` or `ownerId` on an existing `chapterNotes` document.
10. **Orphan Subcollection Write**: User `alice` creating a `studyLog` before creating her `/users/alice` parent profile document.
11. **Unbounded Array Injection**: User `alice` submitting 100 `dailyGoals` in `/users/alice` (max 25) or 10 options in `questionBank` (must be exactly 4).
12. **Value Poisoning on Whitelisted Update**: User `alice` updating `status` in `syllabusProgress` to `"hacked_status"` or a boolean instead of `"not_started" | "revising" | "mastered"`.
