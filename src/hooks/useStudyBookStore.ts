import { useCallback, useEffect, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { DEFAULT_DAILY_GOALS, SEED_NOTES, SEED_QUESTIONS } from '../data/syllabusData';
import type {
  Branch,
  ChapterNote,
  ChapterProgress,
  ChapterStatus,
  ContentBranch,
  DailyGoal,
  FontFamily,
  MockScore,
  QuestionItem,
  StudyBookBackup,
  StudyLog,
  TargetExam,
  ThemeMode,
  UserProfile,
} from '../types/studybook';

const STORAGE_KEY = 'studybook_state_v1';

const DEFAULT_PROFILE: UserProfile = {
  aspirantName: '',
  branch: 'civil',
  targetExam: 'combo',
  theme: 'day',
  font: 'jakarta',
  glassBlur: true,
  dailyGoals: DEFAULT_DAILY_GOALS,
};

interface PersistedLocalState {
  profile: UserProfile;
  syllabusProgress: Record<string, ChapterProgress>;
  studyLogs: StudyLog[];
  mockScores: MockScore[];
  questionBank: QuestionItem[];
  chapterNotes: Record<string, ChapterNote>;
}

export function addDaysIso(baseDate: Date, days: number): string {
  const next = new Date(baseDate);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 96);
}

function loadLocalState(): PersistedLocalState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        profile: DEFAULT_PROFILE,
        syllabusProgress: {},
        studyLogs: [],
        mockScores: [],
        questionBank: SEED_QUESTIONS,
        chapterNotes: SEED_NOTES,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedLocalState>;
    return {
      profile: {
        ...DEFAULT_PROFILE,
        ...(parsed.profile || {}),
        dailyGoals: Array.isArray(parsed.profile?.dailyGoals)
          ? parsed.profile.dailyGoals.slice(0, 25)
          : DEFAULT_DAILY_GOALS,
      },
      syllabusProgress: parsed.syllabusProgress || {},
      studyLogs: Array.isArray(parsed.studyLogs) ? parsed.studyLogs : [],
      mockScores: Array.isArray(parsed.mockScores) ? parsed.mockScores : [],
      questionBank:
        Array.isArray(parsed.questionBank) && parsed.questionBank.length > 0
          ? parsed.questionBank
          : SEED_QUESTIONS,
      chapterNotes:
        parsed.chapterNotes && Object.keys(parsed.chapterNotes).length > 0
          ? parsed.chapterNotes
          : SEED_NOTES,
    };
  } catch {
    return {
      profile: DEFAULT_PROFILE,
      syllabusProgress: {},
      studyLogs: [],
      mockScores: [],
      questionBank: SEED_QUESTIONS,
      chapterNotes: SEED_NOTES,
    };
  }
}

export function useStudyBookStore() {
  const initial = useRef<PersistedLocalState>(loadLocalState());

  const [profile, setProfile] = useState<UserProfile>(initial.current.profile);
  const [syllabusProgress, setSyllabusProgress] = useState<Record<string, ChapterProgress>>(
    initial.current.syllabusProgress,
  );
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>(initial.current.studyLogs);
  const [mockScores, setMockScores] = useState<MockScore[]>(initial.current.mockScores);
  const [questionBank, setQuestionBank] = useState<QuestionItem[]>(initial.current.questionBank);
  const [chapterNotes, setChapterNotes] = useState<Record<string, ChapterNote>>(
    initial.current.chapterNotes,
  );

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [syncMessage, setSyncMessage] = useState<string>('');

  const profileCreatedInCloudRef = useRef<boolean>(false);
  const remoteDocIdsRef = useRef<{
    syllabus: Set<string>;
    questions: Set<string>;
    notes: Set<string>;
  }>({
    syllabus: new Set(),
    questions: new Set(),
    notes: new Set(),
  });

  // Persist locally on every change (offline-first)
  useEffect(() => {
    try {
      const payload: PersistedLocalState = {
        profile,
        syllabusProgress,
        studyLogs,
        mockScores,
        questionBank,
        chapterNotes,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore quota exceeded on storage
    }
  }, [profile, syllabusProgress, studyLogs, mockScores, questionBank, chapterNotes]);

  // Apply theme, font, and glass blur attributes to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (profile.theme === 'night') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-font', profile.font);
    root.setAttribute('data-blur', profile.glassBlur ? 'on' : 'off');
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', profile.theme === 'night' ? '#0A0A0C' : '#F5F5F7');
    }
  }, [profile.theme, profile.font, profile.glassBlur]);

  // Ensure parent /users/{uid} exists before writing subcollections
  const ensureCloudProfile = useCallback(async (uid: string, currentProfile: UserProfile) => {
    const path = `users/${uid}`;
    const userRef = doc(db, 'users', uid);
    try {
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        const safeName = (currentProfile.aspirantName || auth.currentUser?.displayName || 'Aspirant')
          .trim()
          .slice(0, 80);
        await setDoc(userRef, {
          ownerId: uid,
          aspirantName: safeName || 'Aspirant',
          branch: currentProfile.branch,
          targetExam: currentProfile.targetExam,
          theme: currentProfile.theme,
          font: currentProfile.font,
          glassBlur: currentProfile.glassBlur,
          dailyGoals: currentProfile.dailyGoals.slice(0, 25),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      profileCreatedInCloudRef.current = true;
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      setSyncStatus('error');
      setSyncMessage('Could not initialize cloud profile.');
      return false;
    }
  }, []);

  // Auth listener & Firestore real-time synchronization
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (!user) {
        profileCreatedInCloudRef.current = false;
        setSyncStatus('local');
        setSyncMessage('');
      }
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authReady || !authUser) return;
    const uid = authUser.uid;
    let cancelled = false;
    const unsubscribers: Array<() => void> = [];

    const startCloudSync = async () => {
      setSyncStatus('syncing');
      const ok = await ensureCloudProfile(uid, profile);
      if (!ok || cancelled) return;

      // 1. Profile real-time listener
      const profilePath = `users/${uid}`;
      unsubscribers.push(
        onSnapshot(
          doc(db, 'users', uid),
          (snap) => {
            if (snap.exists()) {
              profileCreatedInCloudRef.current = true;
              const data = snap.data();
              setProfile((prev) => ({
                aspirantName:
                  typeof data.aspirantName === 'string' ? data.aspirantName : prev.aspirantName,
                branch: data.branch === 'mechanical' ? 'mechanical' : 'civil',
                targetExam:
                  data.targetExam === 'ssc_je' || data.targetExam === 'rrb_je'
                    ? data.targetExam
                    : 'combo',
                theme: data.theme === 'night' ? 'night' : 'day',
                font:
                  data.font === 'manrope' || data.font === 'dm' ? data.font : 'jakarta',
                glassBlur: typeof data.glassBlur === 'boolean' ? data.glassBlur : true,
                dailyGoals: Array.isArray(data.dailyGoals)
                  ? (data.dailyGoals as DailyGoal[]).slice(0, 25)
                  : prev.dailyGoals,
              }));
              setSyncStatus('synced');
              setSyncMessage('');
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, profilePath);
            setSyncStatus('error');
            setSyncMessage('Profile sync paused.');
          },
        ),
      );

      // 2. Syllabus Progress listener
      const sylPath = `users/${uid}/syllabusProgress`;
      unsubscribers.push(
        onSnapshot(
          query(collection(db, sylPath), where('ownerId', '==', uid)),
          (snap) => {
            const nextMap: Record<string, ChapterProgress> = {};
            const ids = new Set<string>();
            snap.forEach((d) => {
              ids.add(d.id);
              const v = d.data();
              nextMap[d.id] = {
                chapterId: String(v.chapterId || d.id),
                subjectId: String(v.subjectId || ''),
                branch: (v.branch as ContentBranch) || 'civil',
                status: (v.status as ChapterStatus) || 'not_started',
                remarks: String(v.remarks || ''),
                revisionStage: Number(v.revisionStage || 0),
                nextRevisionDate: v.nextRevisionDate ? String(v.nextRevisionDate) : undefined,
                lastStudiedDate: v.lastStudiedDate ? String(v.lastStudiedDate) : undefined,
              };
            });
            remoteDocIdsRef.current.syllabus = ids;
            if (snap.size > 0) {
              setSyllabusProgress((prev) => ({ ...prev, ...nextMap }));
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, sylPath);
          },
        ),
      );

      // 3. Study Logs listener
      const logsPath = `users/${uid}/studyLogs`;
      unsubscribers.push(
        onSnapshot(
          query(collection(db, logsPath), where('ownerId', '==', uid)),
          (snap) => {
            if (snap.size === 0) return;
            const list: StudyLog[] = [];
            snap.forEach((d) => {
              const v = d.data();
              list.push({
                id: d.id,
                subjectId: String(v.subjectId || ''),
                subjectName: String(v.subjectName || ''),
                topic: String(v.topic || ''),
                chapterId: v.chapterId ? String(v.chapterId) : undefined,
                activityType: v.activityType || 'Concept Study',
                durationMinutes: Number(v.durationMinutes || 30),
                pyqsSolved: Number(v.pyqsSolved || 0),
                confidence: Number(v.confidence || 3),
                takeaways: String(v.takeaways || ''),
                branch: v.branch === 'mechanical' ? 'mechanical' : 'civil',
                loggedDate: String(v.loggedDate || todayIso()),
              });
            });
            list.sort((a, b) => b.loggedDate.localeCompare(a.loggedDate));
            setStudyLogs(list);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, logsPath);
          },
        ),
      );

      // 4. Mock Scores listener
      const mocksPath = `users/${uid}/mockScores`;
      unsubscribers.push(
        onSnapshot(
          query(collection(db, mocksPath), where('ownerId', '==', uid)),
          (snap) => {
            if (snap.size === 0) return;
            const list: MockScore[] = [];
            snap.forEach((d) => {
              const v = d.data();
              list.push({
                id: d.id,
                title: String(v.title || 'Mock Test'),
                examType: v.examType === 'rrb_je' ? 'rrb_je' : 'ssc_je',
                branch: v.branch === 'mechanical' ? 'mechanical' : 'civil',
                score: Number(v.score || 0),
                maxScore: Number(v.maxScore || 100),
                accuracy: Number(v.accuracy || 0),
                correctCount: Number(v.correctCount || 0),
                wrongCount: Number(v.wrongCount || 0),
                skippedCount: Number(v.skippedCount || 0),
                timeTakenMinutes: Number(v.timeTakenMinutes || 0),
                date: String(v.date || todayIso()),
              });
            });
            list.sort((a, b) => b.date.localeCompare(a.date));
            setMockScores(list);
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, mocksPath);
          },
        ),
      );

      // 5. Question Bank listener
      const qPath = `users/${uid}/questionBank`;
      unsubscribers.push(
        onSnapshot(
          query(collection(db, qPath), where('ownerId', '==', uid)),
          (snap) => {
            const ids = new Set<string>();
            const remoteQuestions: QuestionItem[] = [];
            snap.forEach((d) => {
              ids.add(d.id);
              const v = d.data();
              const opts = Array.isArray(v.options) ? v.options.slice(0, 4).map(String) : ['A', 'B', 'C', 'D'];
              while (opts.length < 4) opts.push('');
              remoteQuestions.push({
                id: d.id,
                subject: String(v.subject || ''),
                topic: String(v.topic || ''),
                examType: v.examType === 'rrb_je' ? 'rrb_je' : 'ssc_je',
                branch: (v.branch as ContentBranch) || 'civil',
                questionText: String(v.questionText || ''),
                options: [opts[0], opts[1], opts[2], opts[3]],
                correctIndex: Number(v.correctIndex || 0),
                explanation: String(v.explanation || ''),
                sourceName: String(v.sourceName || ''),
                isMistake: Boolean(v.isMistake),
                lastWrongChoice: typeof v.lastWrongChoice === 'number' ? v.lastWrongChoice : undefined,
                wrongCount: Number(v.wrongCount || 0),
              });
            });
            remoteDocIdsRef.current.questions = ids;
            if (remoteQuestions.length > 0) {
              setQuestionBank((prev) => {
                const byId = new Map<string, QuestionItem>();
                for (const item of prev) byId.set(item.id, item);
                for (const item of remoteQuestions) byId.set(item.id, item);
                return Array.from(byId.values());
              });
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, qPath);
          },
        ),
      );

      // 6. Chapter Notes listener
      const notesPath = `users/${uid}/chapterNotes`;
      unsubscribers.push(
        onSnapshot(
          query(collection(db, notesPath), where('ownerId', '==', uid)),
          (snap) => {
            const ids = new Set<string>();
            const remoteNotes: Record<string, ChapterNote> = {};
            snap.forEach((d) => {
              ids.add(d.id);
              const v = d.data();
              remoteNotes[d.id] = {
                chapterId: String(v.chapterId || d.id),
                subjectId: String(v.subjectId || ''),
                chapterTitle: String(v.chapterTitle || ''),
                branch: (v.branch as ContentBranch) || 'civil',
                tldr: String(v.tldr || ''),
                plainNotes: String(v.plainNotes || ''),
                conceptCards: Array.isArray(v.conceptCards) ? v.conceptCards : [],
                diagrams: Array.isArray(v.diagrams) ? v.diagrams : [],
                comparisonTables: Array.isArray(v.comparisonTables) ? v.comparisonTables : [],
                qaHistory: Array.isArray(v.qaHistory) ? v.qaHistory : [],
              };
            });
            remoteDocIdsRef.current.notes = ids;
            if (snap.size > 0) {
              setChapterNotes((prev) => ({ ...prev, ...remoteNotes }));
            }
          },
          (err) => {
            handleFirestoreError(err, OperationType.LIST, notesPath);
          },
        ),
      );
    };

    void startCloudSync();

    return () => {
      cancelled = true;
      unsubscribers.forEach((fn) => fn());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, authUser]);

  // Sign in / Sign out with Google
  const signInWithGoogle = useCallback(async () => {
    try {
      setSyncStatus('syncing');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && !profile.aspirantName && result.user.displayName) {
        const firstName = result.user.displayName.split(' ')[0].slice(0, 40);
        setProfile((prev) => ({ ...prev, aspirantName: firstName }));
      }
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Google sign-in cancelled.';
      setSyncStatus('error');
      setSyncMessage(msg);
      return false;
    }
  }, [profile.aspirantName]);

  const signOutCloud = useCallback(async () => {
    await signOut(auth);
    setSyncStatus('local');
    setSyncMessage('');
  }, []);

  // Profile mutations
  const updateProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      setProfile((prev) => {
        const next: UserProfile = {
          ...prev,
          ...patch,
          aspirantName:
            patch.aspirantName !== undefined
              ? patch.aspirantName.slice(0, 80)
              : prev.aspirantName,
          dailyGoals:
            patch.dailyGoals !== undefined
              ? patch.dailyGoals.slice(0, 25)
              : prev.dailyGoals,
        };
        if (auth.currentUser && profileCreatedInCloudRef.current) {
          const uid = auth.currentUser.uid;
          const path = `users/${uid}`;
          const safeName = (next.aspirantName || 'Aspirant').trim().slice(0, 80) || 'Aspirant';
          void updateDoc(doc(db, 'users', uid), {
            aspirantName: safeName,
            branch: next.branch,
            targetExam: next.targetExam,
            theme: next.theme,
            font: next.font,
            glassBlur: next.glassBlur,
            dailyGoals: next.dailyGoals.slice(0, 25),
            updatedAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
        }
        return next;
      });
    },
    [],
  );

  // Daily goals helpers
  const toggleDailyGoal = useCallback(
    (goalId: string) => {
      updateProfile({
        dailyGoals: profile.dailyGoals.map((g) => (g.id === goalId ? { ...g, done: !g.done } : g)),
      });
    },
    [profile.dailyGoals, updateProfile],
  );

  const addDailyGoal = useCallback(
    (text: string) => {
      const clean = text.trim().slice(0, 120);
      if (!clean || profile.dailyGoals.length >= 25) return;
      updateProfile({
        dailyGoals: [...profile.dailyGoals, { id: makeSafeId('goal'), text: clean, done: false }],
      });
    },
    [profile.dailyGoals, updateProfile],
  );

  const removeDailyGoal = useCallback(
    (goalId: string) => {
      updateProfile({
        dailyGoals: profile.dailyGoals.filter((g) => g.id !== goalId),
      });
    },
    [profile.dailyGoals, updateProfile],
  );

  // Syllabus Progress & 3-7-21 Spaced Repetition
  const upsertChapterProgress = useCallback(
    (
      chapterId: string,
      subjectId: string,
      branch: ContentBranch,
      updates: Partial<Pick<ChapterProgress, 'status' | 'remarks' | 'revisionStage' | 'nextRevisionDate' | 'lastStudiedDate'>>,
    ) => {
      const safeChapterId = chapterId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
      setSyllabusProgress((prev) => {
        const existing = prev[safeChapterId];
        const nextStatus = updates.status ?? existing?.status ?? 'not_started';
        let nextStage = updates.revisionStage ?? existing?.revisionStage ?? 0;
        let nextRevDate =
          updates.nextRevisionDate !== undefined
            ? updates.nextRevisionDate
            : existing?.nextRevisionDate;
        const lastStudied = updates.lastStudiedDate ?? existing?.lastStudiedDate ?? todayIso();

        // Auto-schedule 3-day revision when transitioning to Mastered
        if (updates.status === 'mastered' && existing?.status !== 'mastered') {
          nextStage = 1;
          nextRevDate = addDaysIso(new Date(), 3);
        } else if (updates.status === 'not_started') {
          nextStage = 0;
          nextRevDate = undefined;
        }

        const merged: ChapterProgress = {
          chapterId: safeChapterId,
          subjectId: subjectId.slice(0, 128),
          branch,
          status: nextStatus,
          remarks: (updates.remarks ?? existing?.remarks ?? '').slice(0, 500),
          revisionStage: Math.max(0, Math.min(4, nextStage)),
          nextRevisionDate: nextRevDate,
          lastStudiedDate: lastStudied,
        };

        if (auth.currentUser && profileCreatedInCloudRef.current) {
          const uid = auth.currentUser.uid;
          const docPath = `users/${uid}/syllabusProgress/${safeChapterId}`;
          const docRef = doc(db, 'users', uid, 'syllabusProgress', safeChapterId);
          const payloadBase: Record<string, unknown> = {
            status: merged.status,
            remarks: merged.remarks,
            revisionStage: merged.revisionStage,
            updatedAt: serverTimestamp(),
          };
          if (merged.nextRevisionDate) payloadBase.nextRevisionDate = merged.nextRevisionDate;
          if (merged.lastStudiedDate) payloadBase.lastStudiedDate = merged.lastStudiedDate;

          if (remoteDocIdsRef.current.syllabus.has(safeChapterId)) {
            void updateDoc(docRef, payloadBase).catch((err) =>
              handleFirestoreError(err, OperationType.UPDATE, docPath),
            );
          } else {
            remoteDocIdsRef.current.syllabus.add(safeChapterId);
            void setDoc(docRef, {
              ownerId: uid,
              chapterId: merged.chapterId,
              subjectId: merged.subjectId,
              branch: merged.branch,
              ...payloadBase,
              createdAt: serverTimestamp(),
            }).catch((err) => handleFirestoreError(err, OperationType.CREATE, docPath));
          }
        }

        return { ...prev, [safeChapterId]: merged };
      });
    },
    [],
  );

  // Advance 3 -> 7 -> 21 -> Retained revision queue
  const completeRevisionCheckpoint = useCallback(
    (chapterId: string) => {
      const current = syllabusProgress[chapterId];
      if (!current) return;
      const stage = current.revisionStage || 1;
      let nextStage = stage + 1;
      let nextDate: string | undefined;
      if (stage === 1) {
        nextStage = 2;
        nextDate = addDaysIso(new Date(), 7);
      } else if (stage === 2) {
        nextStage = 3;
        nextDate = addDaysIso(new Date(), 21);
      } else {
        nextStage = 4;
        nextDate = undefined;
      }
      upsertChapterProgress(chapterId, current.subjectId, current.branch, {
        revisionStage: nextStage,
        nextRevisionDate: nextDate,
        lastStudiedDate: todayIso(),
      });
    },
    [syllabusProgress, upsertChapterProgress],
  );

  // Study Logs
  const addStudyLog = useCallback(
    (entry: Omit<StudyLog, 'id'>) => {
      const id = makeSafeId('log');
      const fullLog: StudyLog = {
        ...entry,
        id,
        topic: entry.topic.trim().slice(0, 200),
        takeaways: entry.takeaways.trim().slice(0, 1000),
        durationMinutes: Math.max(1, Math.min(1440, Math.round(entry.durationMinutes))),
        pyqsSolved: Math.max(0, Math.min(2000, Math.round(entry.pyqsSolved))),
        confidence: Math.max(1, Math.min(5, Math.round(entry.confidence))),
      };
      setStudyLogs((prev) => [fullLog, ...prev]);

      // Automatically schedule 3-day spaced repetition if a chapter was logged and not yet queued
      if (fullLog.chapterId) {
        const existingProg = syllabusProgress[fullLog.chapterId];
        if (!existingProg || existingProg.revisionStage === 0) {
          upsertChapterProgress(
            fullLog.chapterId,
            fullLog.subjectId,
            existingProg?.branch ?? fullLog.branch,
            {
              status: existingProg?.status === 'mastered' ? 'mastered' : 'revising',
              revisionStage: 1,
              nextRevisionDate: addDaysIso(new Date(), 3),
              lastStudiedDate: fullLog.loggedDate,
            },
          );
        }
      }

      if (auth.currentUser && profileCreatedInCloudRef.current) {
        const uid = auth.currentUser.uid;
        const docPath = `users/${uid}/studyLogs/${id}`;
        const payload: Record<string, unknown> = {
          ownerId: uid,
          subjectId: fullLog.subjectId.slice(0, 128),
          subjectName: fullLog.subjectName.slice(0, 120),
          topic: fullLog.topic,
          activityType: fullLog.activityType,
          durationMinutes: fullLog.durationMinutes,
          pyqsSolved: fullLog.pyqsSolved,
          confidence: fullLog.confidence,
          takeaways: fullLog.takeaways,
          branch: fullLog.branch,
          loggedDate: fullLog.loggedDate,
          createdAt: serverTimestamp(),
        };
        if (fullLog.chapterId) payload.chapterId = fullLog.chapterId.slice(0, 128);
        void setDoc(doc(db, 'users', uid, 'studyLogs', id), payload).catch((err) =>
          handleFirestoreError(err, OperationType.CREATE, docPath),
        );
      }
    },
    [syllabusProgress, upsertChapterProgress],
  );

  const deleteStudyLog = useCallback((logId: string) => {
    setStudyLogs((prev) => prev.filter((l) => l.id !== logId));
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const docPath = `users/${uid}/studyLogs/${logId}`;
      void deleteDoc(doc(db, 'users', uid, 'studyLogs', logId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, docPath),
      );
    }
  }, []);

  // Mock Scores
  const addMockScore = useCallback((scoreEntry: Omit<MockScore, 'id'>) => {
    const id = makeSafeId('mock');
    const clean: MockScore = {
      ...scoreEntry,
      id,
      title: scoreEntry.title.trim().slice(0, 160),
      maxScore: Math.max(1, Math.min(2000, Number(scoreEntry.maxScore) || 100)),
      score: Math.max(-500, Math.min(2000, Number(scoreEntry.score) || 0)),
      accuracy: Math.max(0, Math.min(100, Number(scoreEntry.accuracy) || 0)),
      correctCount: Math.max(0, Math.round(scoreEntry.correctCount)),
      wrongCount: Math.max(0, Math.round(scoreEntry.wrongCount)),
      skippedCount: Math.max(0, Math.round(scoreEntry.skippedCount)),
      timeTakenMinutes: Math.max(0, Math.min(600, Math.round(scoreEntry.timeTakenMinutes))),
    };
    setMockScores((prev) => [clean, ...prev]);

    if (auth.currentUser && profileCreatedInCloudRef.current) {
      const uid = auth.currentUser.uid;
      const docPath = `users/${uid}/mockScores/${id}`;
      void setDoc(doc(db, 'users', uid, 'mockScores', id), {
        ownerId: uid,
        title: clean.title,
        examType: clean.examType,
        branch: clean.branch,
        score: clean.score,
        maxScore: clean.maxScore,
        accuracy: clean.accuracy,
        correctCount: clean.correctCount,
        wrongCount: clean.wrongCount,
        skippedCount: clean.skippedCount,
        timeTakenMinutes: clean.timeTakenMinutes,
        date: clean.date,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, docPath));
    }
  }, []);

  const deleteMockScore = useCallback((scoreId: string) => {
    setMockScores((prev) => prev.filter((s) => s.id !== scoreId));
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const docPath = `users/${uid}/mockScores/${scoreId}`;
      void deleteDoc(doc(db, 'users', uid, 'mockScores', scoreId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, docPath),
      );
    }
  }, []);

  // Question Bank & Mistake Book
  const addQuestionsToBank = useCallback((items: Array<Omit<QuestionItem, 'id' | 'isMistake' | 'wrongCount'>>) => {
    const created: QuestionItem[] = items.map((item) => ({
      ...item,
      id: makeSafeId('q'),
      subject: item.subject.trim().slice(0, 120) || 'General Engineering',
      topic: item.topic.trim().slice(0, 160),
      questionText: item.questionText.trim().slice(0, 1500),
      options: [
        String(item.options[0] || 'Option A').slice(0, 500),
        String(item.options[1] || 'Option B').slice(0, 500),
        String(item.options[2] || 'Option C').slice(0, 500),
        String(item.options[3] || 'Option D').slice(0, 500),
      ],
      correctIndex: Math.max(0, Math.min(3, Math.round(item.correctIndex))),
      explanation: item.explanation.trim().slice(0, 2000),
      sourceName: item.sourceName.trim().slice(0, 160),
      isMistake: false,
      wrongCount: 0,
    }));

    setQuestionBank((prev) => [...created, ...prev]);

    if (auth.currentUser && profileCreatedInCloudRef.current) {
      const uid = auth.currentUser.uid;
      for (const q of created) {
        const docPath = `users/${uid}/questionBank/${q.id}`;
        remoteDocIdsRef.current.questions.add(q.id);
        void setDoc(doc(db, 'users', uid, 'questionBank', q.id), {
          ownerId: uid,
          subject: q.subject,
          topic: q.topic,
          examType: q.examType,
          branch: q.branch,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          sourceName: q.sourceName,
          isMistake: false,
          wrongCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, docPath));
      }
    }
    return created.length;
  }, []);

  const updateQuestionMistakeState = useCallback(
    (questionId: string, isMistake: boolean, lastWrongChoice?: number) => {
      setQuestionBank((prev) =>
        prev.map((q) => {
          if (q.id !== questionId) return q;
          const nextWrongCount = isMistake ? q.wrongCount + 1 : q.wrongCount;
          const updated: QuestionItem = {
            ...q,
            isMistake,
            lastWrongChoice: isMistake ? lastWrongChoice : undefined,
            wrongCount: nextWrongCount,
          };

          if (auth.currentUser && profileCreatedInCloudRef.current) {
            const uid = auth.currentUser.uid;
            const docPath = `users/${uid}/questionBank/${q.id}`;
            const docRef = doc(db, 'users', uid, 'questionBank', q.id);
            if (remoteDocIdsRef.current.questions.has(q.id)) {
              const patch: Record<string, unknown> = {
                isMistake,
                wrongCount: nextWrongCount,
                updatedAt: serverTimestamp(),
              };
              if (typeof lastWrongChoice === 'number') {
                patch.lastWrongChoice = lastWrongChoice;
              }
              void updateDoc(docRef, patch).catch((err) =>
                handleFirestoreError(err, OperationType.UPDATE, docPath),
              );
            } else {
              remoteDocIdsRef.current.questions.add(q.id);
              const fullDoc: Record<string, unknown> = {
                ownerId: uid,
                subject: updated.subject,
                topic: updated.topic,
                examType: updated.examType,
                branch: updated.branch,
                questionText: updated.questionText,
                options: updated.options,
                correctIndex: updated.correctIndex,
                explanation: updated.explanation,
                sourceName: updated.sourceName,
                isMistake: updated.isMistake,
                wrongCount: updated.wrongCount,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              };
              if (typeof updated.lastWrongChoice === 'number') {
                fullDoc.lastWrongChoice = updated.lastWrongChoice;
              }
              void setDoc(docRef, fullDoc).catch((err) =>
                handleFirestoreError(err, OperationType.CREATE, docPath),
              );
            }
          }

          return updated;
        }),
      );
    },
    [],
  );

  const deleteQuestion = useCallback((questionId: string) => {
    setQuestionBank((prev) => prev.filter((q) => q.id !== questionId));
    if (auth.currentUser) {
      const uid = auth.currentUser.uid;
      const docPath = `users/${uid}/questionBank/${questionId}`;
      remoteDocIdsRef.current.questions.delete(questionId);
      void deleteDoc(doc(db, 'users', uid, 'questionBank', questionId)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, docPath),
      );
    }
  }, []);

  // Chapter Visual Notes & Q&A
  const saveChapterNote = useCallback((note: ChapterNote) => {
    const safeId = note.chapterId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
    const cleaned: ChapterNote = {
      ...note,
      chapterId: safeId,
      subjectId: note.subjectId.slice(0, 128),
      chapterTitle: note.chapterTitle.slice(0, 200),
      tldr: note.tldr.slice(0, 2000),
      plainNotes: note.plainNotes.slice(0, 20000),
      conceptCards: note.conceptCards.slice(0, 30),
      diagrams: note.diagrams.slice(0, 12),
      comparisonTables: note.comparisonTables.slice(0, 10),
      qaHistory: note.qaHistory.slice(0, 40),
      updatedAtIso: new Date().toISOString(),
    };

    setChapterNotes((prev) => ({ ...prev, [safeId]: cleaned }));

    if (auth.currentUser && profileCreatedInCloudRef.current) {
      const uid = auth.currentUser.uid;
      const docPath = `users/${uid}/chapterNotes/${safeId}`;
      const docRef = doc(db, 'users', uid, 'chapterNotes', safeId);

      if (remoteDocIdsRef.current.notes.has(safeId)) {
        void updateDoc(docRef, {
          tldr: cleaned.tldr,
          plainNotes: cleaned.plainNotes,
          conceptCards: cleaned.conceptCards,
          diagrams: cleaned.diagrams,
          comparisonTables: cleaned.comparisonTables,
          qaHistory: cleaned.qaHistory,
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, docPath));
      } else {
        remoteDocIdsRef.current.notes.add(safeId);
        void setDoc(docRef, {
          ownerId: uid,
          subjectId: cleaned.subjectId,
          chapterId: cleaned.chapterId,
          chapterTitle: cleaned.chapterTitle,
          branch: cleaned.branch,
          tldr: cleaned.tldr,
          plainNotes: cleaned.plainNotes,
          conceptCards: cleaned.conceptCards,
          diagrams: cleaned.diagrams,
          comparisonTables: cleaned.comparisonTables,
          qaHistory: cleaned.qaHistory,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch((err) => handleFirestoreError(err, OperationType.CREATE, docPath));
      }
    }
  }, []);

  // Push local state up to cloud on demand
  const pushAllToCloud = useCallback(async () => {
    if (!auth.currentUser) return;
    const uid = auth.currentUser.uid;
    setSyncStatus('syncing');
    const ok = await ensureCloudProfile(uid, profile);
    if (!ok) return;

    try {
      await updateDoc(doc(db, 'users', uid), {
        aspirantName: (profile.aspirantName || 'Aspirant').trim().slice(0, 80) || 'Aspirant',
        branch: profile.branch,
        targetExam: profile.targetExam,
        theme: profile.theme,
        font: profile.font,
        glassBlur: profile.glassBlur,
        dailyGoals: profile.dailyGoals.slice(0, 25),
        updatedAt: serverTimestamp(),
      });
      setSyncStatus('synced');
      setSyncMessage('All devices synced.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
      setSyncStatus('error');
      setSyncMessage('Manual sync failed.');
    }
  }, [ensureCloudProfile, profile]);

  // Full JSON Backup Export & Restore
  const exportBackupJson = useCallback((): string => {
    const backup: StudyBookBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      profile,
      syllabusProgress,
      studyLogs,
      mockScores,
      questionBank,
      chapterNotes,
    };
    return JSON.stringify(backup, null, 2);
  }, [profile, syllabusProgress, studyLogs, mockScores, questionBank, chapterNotes]);

  const restoreBackupJson = useCallback(
    (jsonText: string): { ok: boolean; message: string } => {
      try {
        const parsed = JSON.parse(jsonText) as Partial<StudyBookBackup>;
        if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
          return { ok: false, message: 'Invalid StudyBook backup file.' };
        }
        const restoredProfile: UserProfile = {
          ...DEFAULT_PROFILE,
          ...parsed.profile,
          dailyGoals: Array.isArray(parsed.profile.dailyGoals)
            ? parsed.profile.dailyGoals.slice(0, 25)
            : DEFAULT_DAILY_GOALS,
        };
        setProfile(restoredProfile);
        if (parsed.syllabusProgress) setSyllabusProgress(parsed.syllabusProgress);
        if (Array.isArray(parsed.studyLogs)) setStudyLogs(parsed.studyLogs);
        if (Array.isArray(parsed.mockScores)) setMockScores(parsed.mockScores);
        if (Array.isArray(parsed.questionBank)) setQuestionBank(parsed.questionBank);
        if (parsed.chapterNotes) setChapterNotes(parsed.chapterNotes);
        return { ok: true, message: 'Backup restored successfully.' };
      } catch {
        return { ok: false, message: 'Could not parse JSON backup file.' };
      }
    },
    [],
  );

  return {
    profile,
    syllabusProgress,
    studyLogs,
    mockScores,
    questionBank,
    chapterNotes,
    authUser,
    authReady,
    syncStatus,
    syncMessage,
    signInWithGoogle,
    signOutCloud,
    pushAllToCloud,
    updateProfile,
    toggleDailyGoal,
    addDailyGoal,
    removeDailyGoal,
    upsertChapterProgress,
    completeRevisionCheckpoint,
    addStudyLog,
    deleteStudyLog,
    addMockScore,
    deleteMockScore,
    addQuestionsToBank,
    updateQuestionMistakeState,
    deleteQuestion,
    saveChapterNote,
    exportBackupJson,
    restoreBackupJson,
  };
}
