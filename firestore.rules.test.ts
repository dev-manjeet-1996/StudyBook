/**
 * StudyBook Firestore Security Rules Verification Spec
 * Verifies all "Dirty Dozen" adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_SECURITY_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Read/Write',
    operation: 'get',
    path: '/users/alice',
    auth: null,
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Bypass',
    operation: 'create',
    path: '/users/alice',
    auth: { uid: 'alice', email_verified: false },
    payload: { ownerId: 'alice', aspirantName: 'Alice' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Cross-User Identity Spoofing',
    operation: 'create',
    path: '/users/alice/studyLogs/log_1',
    auth: { uid: 'bob', email_verified: true },
    payload: { ownerId: 'bob', topic: 'SOM' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Owner Field Tampering',
    operation: 'create',
    path: '/users/alice/studyLogs/log_2',
    auth: { uid: 'alice', email_verified: true },
    payload: { ownerId: 'bob', topic: 'RCC' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Shadow / Ghost Field Injection',
    operation: 'create',
    path: '/users/alice',
    auth: { uid: 'alice', email_verified: true },
    payload: {
      ownerId: 'alice',
      aspirantName: 'Alice',
      branch: 'civil',
      targetExam: 'combo',
      theme: 'day',
      font: 'jakarta',
      glassBlur: true,
      dailyGoals: [],
      isAdmin: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'ID Poisoning Attack',
    operation: 'create',
    path: `/users/alice/studyLogs/${'x'.repeat(200)}`,
    auth: { uid: 'alice', email_verified: true },
    payload: { ownerId: 'alice' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Denial-of-Wallet Oversized String',
    operation: 'create',
    path: '/users/alice/studyLogs/log_big',
    auth: { uid: 'alice', email_verified: true },
    payload: { ownerId: 'alice', takeaways: 'A'.repeat(5000) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Timestamp Backdating',
    operation: 'create',
    path: '/users/alice/mockScores/mock_1',
    auth: { uid: 'alice', email_verified: true },
    payload: { ownerId: 'alice', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable Field Mutation',
    operation: 'update',
    path: '/users/alice/chapterNotes/note_1',
    auth: { uid: 'alice', email_verified: true },
    payload: { ownerId: 'charlie' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Orphan Subcollection Write',
    operation: 'create',
    path: '/users/newuser/studyLogs/log_orphan',
    auth: { uid: 'newuser', email_verified: true },
    payload: { ownerId: 'newuser', topic: 'Surveying' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Unbounded Array Injection',
    operation: 'update',
    path: '/users/alice',
    auth: { uid: 'alice', email_verified: true },
    payload: { dailyGoals: Array.from({ length: 40 }, (_, i) => ({ id: String(i), text: 'Goal', done: false })) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Value Poisoning on Whitelisted Update',
    operation: 'update',
    path: '/users/alice/syllabusProgress/civ_som_1',
    auth: { uid: 'alice', email_verified: true },
    payload: { status: 'invalid_state' },
    expected: 'PERMISSION_DENIED',
  },
];
