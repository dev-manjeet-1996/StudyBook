# Master Prompt for Google AI Studio (Build Mode) — StudyBook (Windows & Android PWA)

Copy and paste the entire prompt below into **Google AI Studio** (`aistudio.google.com` → **Build** tab) to generate a complete, installable cross-platform **Windows & Android** study application:

---

```text
Build a complete, responsive, installable Progressive Web App (PWA) called "StudyBook" designed for Indian Engineering Competitive Exam Aspirants (SSC JE & RRB JE — Civil & Mechanical Engineering) that works seamlessly on both Windows Desktop and Android Mobile (including full PWA manifest + service worker support so it can be installed as a standalone Windows app and Android app).

### 1. DESIGN SYSTEM & UI ARCHITECTURE
- **Theme:** Ultra-clean iOS-inspired Monochrome Frosted Glassmorphism (`Day Mode` and `Night Mode` toggle) with zero clutter, rounded `24px` (`rounded-3xl`) cards, subtle hairline borders, and smooth micro-transitions.
- **App Icon:** Custom minimal monochrome SVG icon featuring an open study notebook and fountain pen nib.
- **Top Command Bar:**
  - App Logo & Title ("StudyBook")
  - Branch Switcher (`Civil` / `Mechanical`)
  - Target Exam Filter (`Combo: RRB + SSC JE`, `SSC JE 2026`, `RRB JE 2026`)
  - Settings Gear Button
- **Bottom Floating Glass Pill Dock (4 Tabs Only):**
  1. `Home` (Default start tab on every app launch)
  2. `Syllabus`
  3. `Mocks`
  4. `Notes`

### 2. FIRST-LAUNCH ONBOARDING & PERSONALIZATION
- On first app launch (when no aspirant name is saved), show a sleek welcome modal asking for the user's name and save it.
- Display a personalized time-of-day greeting ("Good Morning/Afternoon/Evening, [Name]") on the `Home` tab paired with rotating exam-focused engineering motivational quotes (without any "JE Aspirant Mode" badge).

### 3. CORE TABS & FEATURES
#### Tab 1: Home (Dashboard)
- **Daily Target Checklist:** Interactive goal pills (e.g., "2h Technical Study", "50 PYQs Solved", "30m Reasoning & Roots") plus a `+ Goal` input to add custom daily targets.
- **4 KPI Summary Cards:** Syllabus Mastery %, Total Study Hours, Average Mock Accuracy %, and Mock Tests Taken.
- **Subject-Wise Mastery Bars:** Horizontal progress bars for every subject in the active stream.
- **Spaced Repetition Revision Queue (3–7–21 Day Rule):** Automatically schedules 3-day, 7-day, and 21-day revision reminders whenever a chapter is marked `Mastered` or logged in a study session.
- **Daily Study Logs:** Modal (`+ Log Session`) and feed to log Subject, Topic, Activity Type, Duration, PYQs solved, Confidence rating, and Key Takeaways.

#### Tab 2: Syllabus
- **Tech / Non-Tech Switcher:** Top filter pill to switch between `All`, `Technical` (Core Civil/Mechanical subjects), and `Non-Tech` (General Intelligence & Reasoning, General Awareness, General Science, Mathematics, Basics of Computers).
- **Subject Drill-Down Pages:** Clicking any subject opens its dedicated chapter list with:
  - 3-state status toggle per chapter: `Not Started` → `Revising` → `Mastered`.
  - Inline chapter remarks input + direct `Notes` button to open that chapter in the `Notes` tab.
  - Built-in Reasoning Quick-Reference tables (1–30 Squares, Cubes, Square Roots, Cube Roots, and Alphabet Place Values / Opposite Pairs).

#### Tab 3: Mocks (TCS iON CBT Arena + Answer Key Extractor + Mistake Book)
- **Score vs. Accuracy Analytics:** Visual comparison bars and manual mock logger (`+ Log Mock Score`).
- **Multi-Format Answer Key Extractor (Gemini 3 Flash):** Upload official SSC JE / RRB JE PDFs (parsed with PDF.js), HTML response sheets, or images to extract MCQs, options A–D, correct answers, and explanations into a verification modal before saving to the Question Bank.
- **Shuffle & Rearrange Questions:** Option to randomize/rearrange question order when starting a mock test.
- **Full-Screen TCS iON CBT Simulator:** Authentic exam hall interface with aspirant profile header, live countdown timer, color-coded Question Status Palette (`Answered`, `Not Answered`, `Marked for Review`, `Answered & Marked`, `Not Visited`), `Mark for Review & Next`, `Clear Response`, `Save & Next`, and automatic negative marking (`-0.25` for SSC JE, `-0.33` for RRB JE).
- **Mistake Book:** Automatically saves wrong/skipped CBT questions and offers a 1-tap "Re-Test Wrong Questions" drill.

#### Tab 4: Notes (Live Class PDF → Visual Notes & SVG Diagram Studio)
- **Live Class PDF Converter (Gemini 3 Flash + PDF.js):** Upload any teacher's live-class PDF or board screenshot, filter out promotional/intro/thank-you slides, and transform the lecture into:
  - Crisp TL;DR Summary
  - Numbered Concept Cards with highlighted formulas/IS codes & memory tricks
  - Clean inline monochrome SVG engineering diagrams (`viewBox="0 0 420 180"`, `stroke="currentColor"`)
  - Structured Comparison Tables
  - Editable plain-text revision notes + Grounded Doubt Q&A solver.

### 4. BACKEND, STORAGE & CROSS-DEVICE SYNC (WINDOWS ↔ ANDROID)
- **Firebase Cloud Sync:** Use Firebase Anonymous/Custom Auth and Firestore (`artifacts/{appId}/users/{userId}/studybook_state/main`) for real-time cross-device synchronization between Windows PC and Android phone.
- **JSON Backup & Restore:** Include one-click `Export Full Backup (.json)` and `Restore Backup` inside Settings, plus Day/Night mode toggle, Font selector, Glass Blur toggle, and Aspirant Name editor.
- **AI Model:** Use `gemini-3-flash-preview` with exponential backoff for all AI extraction, visual note generation, and doubt-solving tasks.
- **PWA Packaging:** Include inline `<link rel="manifest">` data URI and a Service Worker registration script so Chrome/Edge on Windows ("Install StudyBook") and Chrome on Android ("Add to Home Screen / Install App") install it as a standalone native-feeling app.
```

---

### 💡 How to Install on Windows & Android Once Generated:
* **On Windows (Chrome or Edge):** Open your deployed app URL → click the **Install App (`⊕`)** icon on the right side of the address bar → **StudyBook** installs as a standalone Windows desktop app with its own Start Menu & Taskbar icon.
* **On Android (Chrome):** Open your deployed app URL → tap the **⋮ Menu** → **Add to Home screen / Install app** → **StudyBook** installs as an Android app with offline shell caching and real-time Firebase sync to your Windows PC.