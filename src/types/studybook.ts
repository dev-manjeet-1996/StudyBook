export type Branch = 'civil' | 'mechanical';
export type ContentBranch = 'civil' | 'mechanical' | 'nontech';
export type TargetExam = 'combo' | 'ssc_je' | 'rrb_je';
export type ExamPattern = 'ssc_je' | 'rrb_je';
export type ThemeMode = 'day' | 'night';
export type FontFamily = 'jakarta' | 'manrope' | 'dm';
export type AppTab = 'home' | 'syllabus' | 'mocks' | 'notes';
export type ChapterStatus = 'not_started' | 'revising' | 'mastered';
export type ActivityType = 'Concept Study' | 'PYQ Practice' | 'Revision' | 'Mock Analysis' | 'Formula Drill';

export interface DailyGoal {
  id: string;
  text: string;
  done: boolean;
}

export interface UserProfile {
  aspirantName: string;
  branch: Branch;
  targetExam: TargetExam;
  theme: ThemeMode;
  font: FontFamily;
  glassBlur: boolean;
  dailyGoals: DailyGoal[];
}

export interface SyllabusChapter {
  id: string;
  title: string;
  weightage: 'High' | 'Medium' | 'Core';
}

export interface SyllabusSubject {
  id: string;
  name: string;
  shortName: string;
  category: 'technical' | 'nontech';
  branch: ContentBranch;
  exams: ExamPattern[];
  chapters: SyllabusChapter[];
}

export interface ChapterProgress {
  chapterId: string;
  subjectId: string;
  branch: ContentBranch;
  status: ChapterStatus;
  remarks: string;
  /** 0 = none, 1 = 3-day queued, 2 = 7-day queued, 3 = 21-day queued, 4 = fully retained */
  revisionStage: number;
  nextRevisionDate?: string;
  lastStudiedDate?: string;
}

export interface StudyLog {
  id: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  chapterId?: string;
  activityType: ActivityType;
  durationMinutes: number;
  pyqsSolved: number;
  confidence: number;
  takeaways: string;
  branch: Branch;
  loggedDate: string;
}

export interface MockScore {
  id: string;
  title: string;
  examType: ExamPattern;
  branch: Branch;
  score: number;
  maxScore: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenMinutes: number;
  date: string;
}

export interface QuestionItem {
  id: string;
  subject: string;
  topic: string;
  examType: ExamPattern;
  branch: ContentBranch;
  questionText: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  sourceName: string;
  isMistake: boolean;
  lastWrongChoice?: number;
  wrongCount: number;
}

export interface ConceptCard {
  title: string;
  summary: string;
  formulas: string[];
  memoryTrick: string;
}

export interface SvgDiagram {
  title: string;
  caption: string;
  svg: string;
}

export interface ComparisonTable {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface QaItem {
  id: string;
  question: string;
  answer: string;
  askedAt: string;
}

export interface ChapterNote {
  chapterId: string;
  subjectId: string;
  chapterTitle: string;
  branch: ContentBranch;
  tldr: string;
  plainNotes: string;
  conceptCards: ConceptCard[];
  diagrams: SvgDiagram[];
  comparisonTables: ComparisonTable[];
  qaHistory: QaItem[];
  updatedAtIso?: string;
}

export interface StudyBookBackup {
  version: number;
  exportedAt: string;
  profile: UserProfile;
  syllabusProgress: Record<string, ChapterProgress>;
  studyLogs: StudyLog[];
  mockScores: MockScore[];
  questionBank: QuestionItem[];
  chapterNotes: Record<string, ChapterNote>;
}
