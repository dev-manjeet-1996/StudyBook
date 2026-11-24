import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the server environment.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function callWithExponentialBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= maxRetries) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isRetryable =
        msg.includes('429') ||
        msg.includes('500') ||
        msg.includes('502') ||
        msg.includes('503') ||
        msg.includes('504') ||
        msg.includes('RESOURCE_EXHAUSTED') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('fetch failed');
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = Math.min(8000, 700 * Math.pow(2, attempt) + Math.floor(Math.random() * 250));
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }
  throw lastError;
}

function sanitizeSvgMarkup(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  let svg = rawSvg.trim();
  const svgStart = svg.indexOf('<svg');
  const svgEnd = svg.lastIndexOf('</svg>');
  if (svgStart === -1 || svgEnd === -1) return '';
  svg = svg.slice(svgStart, svgEnd + 6);

  // Strip dangerous tags and event handlers
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  svg = svg.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  svg = svg.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/javascript:/gi, '');

  // Ensure standard monochrome viewBox
  if (!/viewBox\s*=/i.test(svg)) {
    svg = svg.replace('<svg', '<svg viewBox="0 0 420 180"');
  }
  return svg;
}

function parseJsonSafe<T>(text: string | undefined, fallback: T): T {
  if (!text) return fallback;
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '45mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', model: MODEL_NAME });
  });

  // 1. Multi-Format Answer Key Extractor (PDF text / HTML response sheet / Image)
  app.post('/api/ai/extract-questions', async (req: Request, res: Response) => {
    try {
      const {
        textContent = '',
        images = [],
        examType = 'ssc_je',
        branch = 'civil',
        sourceName = 'Uploaded Answer Key',
      } = req.body as {
        textContent?: string;
        images?: { mimeType: string; data: string }[];
        examType?: 'ssc_je' | 'rrb_je';
        branch?: 'civil' | 'mechanical' | 'nontech';
        sourceName?: string;
      };

      const trimmedText = typeof textContent === 'string' ? textContent.slice(0, 90000) : '';
      const validImages = Array.isArray(images)
        ? images
            .filter(
              (img) =>
                img &&
                typeof img.data === 'string' &&
                img.data.length > 0 &&
                typeof img.mimeType === 'string' &&
                (img.mimeType.startsWith('image/') || img.mimeType === 'application/pdf'),
            )
            .slice(0, 6)
        : [];

      if (!trimmedText.trim() && validImages.length === 0) {
        return res.status(400).json({ error: 'Provide extracted text, a PDF, or at least one image to parse questions.' });
      }

      const ai = getGeminiClient();

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      for (const img of validImages) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
      parts.push({
        text: `You are an expert Indian Engineering Competitive Exam (SSC JE & RRB JE) Question Bank Extractor.
Extract ALL valid multiple-choice questions (MCQs) from the provided official answer key, response sheet, PDF text, or image.

Target Exam Pattern: ${examType === 'rrb_je' ? 'RRB JE' : 'SSC JE'}
Default Branch: ${branch}
Source Label: ${sourceName}

Rules:
1. Ignore header metadata, candidate details, roll numbers, exam center names, watermarks, "Chosen Option", and coaching ads.
2. Each question MUST have exactly 4 clean options (A, B, C, D) without leading "1."/"A)" clutter unless needed for clarity.
3. Determine the exact zero-based correctIndex (0=A, 1=B, 2=C, 3=D) from the official green tick / correct option marker or verified engineering principles if unmarked.
4. Provide a concise, exam-ready explanation citing relevant IS codes, formulas, or reasoning shortcuts.
5. Classify subject cleanly (e.g., Building Materials, Soil Mechanics, RCC Design, Thermodynamics, SOM, Fluid Mechanics, General Intelligence & Reasoning, General Awareness, General Science, Mathematics).
6. Extract up to 40 high-quality MCQs cleanly.

SOURCE CONTENT:
${trimmedText}`,
      });

      const response = await callWithExponentialBackoff(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      questionText: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      correctIndex: { type: Type.INTEGER },
                      subject: { type: Type.STRING },
                      topic: { type: Type.STRING },
                      branch: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                    },
                    required: ['questionText', 'options', 'correctIndex', 'subject', 'topic', 'explanation'],
                  },
                },
              },
              required: ['questions'],
            },
          },
        }),
      );

      const parsed = parseJsonSafe<{
        questions: Array<{
          questionText: string;
          options: string[];
          correctIndex: number;
          subject: string;
          topic: string;
          branch?: string;
          explanation: string;
        }>;
      }>(response.text, { questions: [] });

      const sanitized = (parsed.questions || [])
        .filter((q) => q && typeof q.questionText === 'string' && Array.isArray(q.options) && q.options.length >= 2)
        .map((q) => {
          const opts = q.options.slice(0, 4).map((o) => String(o || '').trim());
          while (opts.length < 4) opts.push(`Option ${String.fromCharCode(65 + opts.length)}`);
          const normalizedBranch =
            q.branch === 'civil' || q.branch === 'mechanical' || q.branch === 'nontech' ? q.branch : branch;
          return {
            questionText: q.questionText.trim().slice(0, 1400),
            options: opts.map((o) => o.slice(0, 480)),
            correctIndex: Math.max(0, Math.min(3, Number(q.correctIndex) || 0)),
            subject: (q.subject || 'General Engineering').trim().slice(0, 110),
            topic: (q.topic || 'Core Concept').trim().slice(0, 150),
            branch: normalizedBranch,
            examType,
            explanation: (q.explanation || 'Verified via official key and engineering fundamentals.').trim().slice(0, 1800),
            sourceName: String(sourceName).slice(0, 150),
          };
        });

      return res.json({ questions: sanitized });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to extract questions from source.';
      console.error('[extract-questions] error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // 2. Live Class PDF / Board Screenshot -> Visual Notes & Monochrome SVG Diagram Studio
  app.post('/api/ai/convert-notes', async (req: Request, res: Response) => {
    try {
      const {
        textContent = '',
        images = [],
        subjectName = 'Engineering',
        chapterTitle = 'Lecture Notes',
        branch = 'civil',
      } = req.body as {
        textContent?: string;
        images?: { mimeType: string; data: string }[];
        subjectName?: string;
        chapterTitle?: string;
        branch?: string;
      };

      const trimmedText = typeof textContent === 'string' ? textContent.slice(0, 100000) : '';
      const validImages = Array.isArray(images)
        ? images
            .filter(
              (img) =>
                img &&
                typeof img.data === 'string' &&
                img.data.length > 0 &&
                typeof img.mimeType === 'string' &&
                (img.mimeType.startsWith('image/') || img.mimeType === 'application/pdf'),
            )
            .slice(0, 6)
        : [];

      if (!trimmedText.trim() && validImages.length === 0) {
        return res.status(400).json({ error: 'Upload a live class PDF, board screenshot, or paste lecture notes.' });
      }

      const ai = getGeminiClient();

      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
      for (const img of validImages) {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
      }
      parts.push({
        text: `You are an elite SSC JE & RRB JE Indian Engineering Exam Visual Notes Architect.
Convert the teacher's live-class PDF text or board screenshots into crisp, exam-focused structured Visual Notes.

Branch: ${branch}
Subject: ${subjectName}
Chapter: ${chapterTitle}

CRITICAL FILTERING RULES:
- Aggressively discard promotional slides, coaching batch announcements, discount codes, Telegram/YouTube subscribe slides, "Welcome Students", "Like & Share", and "Thank You" slides.
- Focus 100% on high-yield exam concepts, IS Codes (IS 456, IS 800, IS 10262, IS 2720, etc.), standard formulas, units, limiting values, and numerical shortcuts.

OUTPUT STRUCTURE:
1. tldr: A sharp 2-3 sentence executive summary of the lecture.
2. conceptCards: 4 to 8 numbered core concepts. Each card has:
   - title: concise concept title
   - summary: crystal-clear explanation in 2-4 sentences
   - formulas: array of exact formulas, IS code clauses, or standard numeric limits
   - memoryTrick: a punchy mnemonic or exam trap alert
3. diagrams: 1 to 3 clean inline monochrome SVG technical engineering diagrams!
   - STRICT SVG REQUIREMENTS:
     * Must start with <svg viewBox="0 0 420 180" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
     * Pure monochrome: use ONLY stroke="currentColor" (with stroke-opacity 0.25 to 1), fill="none" or fill="currentColor" with low fill-opacity (0.06 to 0.14) for hatching/shading, and text with fill="currentColor" stroke="none" font-size="11" font-family="monospace".
     * Draw crisp engineering schematics (e.g., beam loading & SFD/BMD, stress-strain curve, Mohr's circle, T-s / P-v thermodynamic cycle, cross-section reinforcement, flow profile, truss joint, or concept schematic relevant to the lecture).
     * Keep all coordinates cleanly inside 12..408 (x) and 14..168 (y) with no overlapping labels.
4. comparisonTables: 1 to 2 structured comparison tables (title, headers, rows) for easily confused concepts, IS code grades, or cycle/material properties.
5. plainNotes: Clean bulleted plain-text revision sheet (markdown-free clean bullets using "• ") that the aspirant can edit directly.

LECTURE SOURCE MATERIAL:
${trimmedText}`,
      });

      const response = await callWithExponentialBackoff(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                tldr: { type: Type.STRING },
                conceptCards: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      summary: { type: Type.STRING },
                      formulas: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      memoryTrick: { type: Type.STRING },
                    },
                    required: ['title', 'summary', 'formulas', 'memoryTrick'],
                  },
                },
                diagrams: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      caption: { type: Type.STRING },
                      svg: { type: Type.STRING },
                    },
                    required: ['title', 'caption', 'svg'],
                  },
                },
                comparisonTables: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      headers: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      rows: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                      },
                    },
                    required: ['title', 'headers', 'rows'],
                  },
                },
                plainNotes: { type: Type.STRING },
              },
              required: ['tldr', 'conceptCards', 'diagrams', 'comparisonTables', 'plainNotes'],
            },
          },
        }),
      );

      const parsed = parseJsonSafe<{
        tldr: string;
        conceptCards: Array<{ title: string; summary: string; formulas: string[]; memoryTrick: string }>;
        diagrams: Array<{ title: string; caption: string; svg: string }>;
        comparisonTables: Array<{ title: string; headers: string[]; rows: string[][] }>;
        plainNotes: string;
      }>(response.text, {
        tldr: '',
        conceptCards: [],
        diagrams: [],
        comparisonTables: [],
        plainNotes: '',
      });

      const cleanDiagrams = (parsed.diagrams || [])
        .map((d) => ({
          title: String(d.title || 'Engineering Diagram').slice(0, 120),
          caption: String(d.caption || '').slice(0, 260),
          svg: sanitizeSvgMarkup(d.svg || ''),
        }))
        .filter((d) => d.svg.length > 20)
        .slice(0, 8);

      return res.json({
        tldr: String(parsed.tldr || '').slice(0, 1800),
        conceptCards: (parsed.conceptCards || []).slice(0, 20).map((c) => ({
          title: String(c.title || 'Concept').slice(0, 140),
          summary: String(c.summary || '').slice(0, 800),
          formulas: Array.isArray(c.formulas) ? c.formulas.slice(0, 8).map((f) => String(f).slice(0, 220)) : [],
          memoryTrick: String(c.memoryTrick || '').slice(0, 320),
        })),
        diagrams: cleanDiagrams,
        comparisonTables: (parsed.comparisonTables || []).slice(0, 6).map((t) => ({
          title: String(t.title || 'Comparison').slice(0, 120),
          headers: Array.isArray(t.headers) ? t.headers.slice(0, 6).map((h) => String(h).slice(0, 80)) : [],
          rows: Array.isArray(t.rows)
            ? t.rows.slice(0, 15).map((r) => (Array.isArray(r) ? r.slice(0, 6).map((cell) => String(cell).slice(0, 180)) : []))
            : [],
        })),
        plainNotes: String(parsed.plainNotes || '').slice(0, 18000),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to convert lecture into visual notes.';
      console.error('[convert-notes] error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // 3. Grounded Doubt Q&A Solver
  app.post('/api/ai/solve-doubt', async (req: Request, res: Response) => {
    try {
      const {
        question = '',
        chapterTitle = '',
        subjectName = '',
        branch = 'civil',
        tldr = '',
        plainNotes = '',
        conceptCards = [],
        recentHistory = [],
      } = req.body as {
        question?: string;
        chapterTitle?: string;
        subjectName?: string;
        branch?: string;
        tldr?: string;
        plainNotes?: string;
        conceptCards?: Array<{ title: string; summary: string; formulas: string[] }>;
        recentHistory?: Array<{ question: string; answer: string }>;
      };

      if (!question.trim()) {
        return res.status(400).json({ error: 'Enter a doubt or concept question first.' });
      }

      const ai = getGeminiClient();

      const cardsContext = (conceptCards || [])
        .slice(0, 12)
        .map((c, idx) => `${idx + 1}. ${c.title}: ${c.summary} | Formulas: ${(c.formulas || []).join('; ')}`)
        .join('\n');

      const historyContext = (recentHistory || [])
        .slice(-5)
        .map((h) => `Q: ${h.question}\nA: ${h.answer}`)
        .join('\n\n');

      const prompt = `You are a concise, authoritative SSC JE & RRB JE Engineering Faculty Mentor (${branch.toUpperCase()}).
Answer the aspirant's doubt grounded primarily in their current chapter notes below, supplementing with standard Indian engineering textbooks and IS codes (IS 456, IS 800, IS 2720, standard thermodynamic tables) where needed.

Chapter: ${subjectName} — ${chapterTitle}
TL;DR: ${tldr}
Concept Cards:
${cardsContext || 'None yet'}

Plain Revision Notes:
${plainNotes.slice(0, 6000) || 'None yet'}

Recent Q&A Thread:
${historyContext || 'None'}

Aspirant's Doubt:
${question.trim()}

Respond clearly in structured plain text with:
1. Direct Answer (1-2 crisp sentences)
2. Formula / IS Code Reference (if applicable)
3. Exam Shortcut or Common Trap to avoid in SSC JE / RRB JE.`;

      const response = await callWithExponentialBackoff(() =>
        ai.models.generateContent({
          model: MODEL_NAME,
          contents: prompt,
        }),
      );

      return res.json({ answer: (response.text || 'Unable to generate an answer right now.').trim() });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to resolve doubt.';
      console.error('[solve-doubt] error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // 4. Multi-Turn StudyBook AI Mentor Chatbot (Streaming SSE via ai.chats)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const {
        history = [],
        message = '',
        persona = 'mentor',
        context = {},
      } = req.body as {
        history?: Array<{ role: 'user' | 'model'; text: string }>;
        message?: string;
        persona?: 'mentor' | 'formula' | 'coach';
        context?: {
          aspirantName?: string;
          branch?: string;
          targetExam?: string;
          masteryPercent?: number;
          mistakeCount?: number;
        };
      };

      const trimmedMessage = typeof message === 'string' ? message.trim() : '';
      if (!trimmedMessage) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const branchLabel = context.branch === 'mechanical' ? 'Mechanical Engineering' : 'Civil Engineering';
      const examLabel =
        context.targetExam === 'ssc_je'
          ? 'SSC JE 2026'
          : context.targetExam === 'rrb_je'
            ? 'RRB JE 2026'
            : 'Combo: RRB JE + SSC JE 2026';
      const aspirant = (context.aspirantName || 'Aspirant').slice(0, 60);
      const mastery = Number.isFinite(context.masteryPercent) ? context.masteryPercent : 0;
      const mistakes = Number.isFinite(context.mistakeCount) ? context.mistakeCount : 0;

      let selectedModel = 'gemini-4-hydrogen';
      let roleDirective = '';

      if (persona === 'formula') {
        selectedModel = 'gemini-3.1-flash-lite';
        roleDirective = `You are StudyBook's Quick Formula & IS Code Assistant for Indian Engineering Exams (${branchLabel}, ${examLabel}).
Respond rapidly and concisely with exact formulas, SI units, Indian Standard code clauses (IS 456:2000, IS 800:2007, IS 10262, IS 2720, standard thermodynamic/fluid tables), and short memory mnemonics. Keep answers crisp, structured, and directly exam-usable.`;
      } else if (persona === 'coach') {
        selectedModel = 'gemini-4-hydrogen';
        roleDirective = `You are StudyBook's CBT Mock Strategy & Mistake Coach for ${aspirant} preparing for ${examLabel} (${branchLabel}).
Current profile snapshot: Syllabus Mastery ${mastery}%, Mistake Book items: ${mistakes}.
Specialize in TCS iON CBT time allocation, accuracy vs. attempt optimization under negative marking (-0.25 for SSC JE, -0.33 for RRB JE), eliminating silly numerical errors, and converting weak chapters into guaranteed marks. Be practical, structured, and concise.`;
      } else {
        selectedModel = 'gemini-4-hydrogen';
        roleDirective = `You are StudyBook's Senior Engineering Faculty Mentor for ${aspirant} preparing for ${examLabel} (${branchLabel}).
Current profile snapshot: Syllabus Mastery ${mastery}%, Mistake Book items: ${mistakes}.
Explain core engineering concepts, solve numericals step-by-step with clear units, cite Indian Standard codes where relevant, and give structured revision plans tailored to SSC JE and RRB JE syllabi. Keep formatting clean, scannable, and free of fluff.`;
      }

      const sanitizedHistory = Array.isArray(history)
        ? history
            .filter(
              (turn) =>
                turn &&
                (turn.role === 'user' || turn.role === 'model') &&
                typeof turn.text === 'string' &&
                turn.text.trim().length > 0,
            )
            .slice(-24)
            .map((turn) => ({
              role: turn.role,
              parts: [{ text: turn.text.slice(0, 8000) }],
            }))
        : [];

      const ai = getGeminiClient();
      const chat = ai.chats.create({
        model: selectedModel,
        history: sanitizedHistory,
        config: {
          systemInstruction: roleDirective,
        },
      });

      const streamResponse = await callWithExponentialBackoff(() =>
        chat.sendMessageStream({ message: trimmedMessage.slice(0, 6000) }),
      );

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of streamResponse) {
        const textChunk = chunk.text;
        if (textChunk) {
          res.write(`data: ${JSON.stringify({ chunk: textChunk })}\n\n`);
        }
      }

      res.write(`data: ${JSON.stringify({ done: true, model: selectedModel })}\n\n`);
      return res.end();
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : 'Chat response failed.';
      console.error('[chat] error:', errMessage);
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: errMessage })}\n\n`);
        return res.end();
      }
      return res.status(500).json({ error: errMessage });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`StudyBook server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
