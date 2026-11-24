import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker via Vite-resolved module URL
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).toString();
} catch {
  // Fallback handled gracefully via native PDF base64 attachment below
}

export interface ParsedFilePayload {
  textContent: string;
  images: { mimeType: string; data: string }[];
  pageCount?: number;
  usedVisionPdf?: boolean;
}

const MAX_INLINE_PDF_BYTES = 18 * 1024 * 1024; // 18 MB raw -> ~24 MB base64

export async function fileToBase64(
  file: File,
  fallbackMime = 'application/octet-stream',
): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error(`Could not encode file "${file.name}".`));
        return;
      }
      resolve({
        mimeType: file.type || fallbackMime,
        data: result.slice(commaIdx + 1),
      });
    };
    reader.onerror = () => reject(new Error(`Failed to read file "${file.name}".`));
    reader.readAsDataURL(file);
  });
}

export async function fileToBase64Image(file: File): Promise<{ mimeType: string; data: string }> {
  return fileToBase64(file, 'image/png');
}

async function renderPdfPagesAsImages(
  file: File,
  maxPages = 5,
): Promise<{ mimeType: string; data: string }[]> {
  const rendered: { mimeType: string; data: string }[] = [];
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const count = Math.min(pdf.numPages, maxPages);

  for (let pageNum = 1; pageNum <= count; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.35 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(1600, Math.floor(viewport.width));
    canvas.height = Math.min(1600, Math.floor(viewport.height));
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx !== -1) {
      rendered.push({
        mimeType: 'image/jpeg',
        data: dataUrl.slice(commaIdx + 1),
      });
    }
  }
  return rendered;
}

export async function extractTextFromPdf(
  file: File,
  maxPages = 35,
): Promise<{ text: string; pageCount: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const totalPages = Math.min(pdf.numPages, maxPages);
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= totalPages; pageNum += 1) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const lines: string[] = [];
    for (const item of content.items) {
      if ('str' in item && typeof item.str === 'string') {
        lines.push(item.str);
      }
    }
    const joined = lines.join(' ').replace(/\s+/g, ' ').trim();
    if (joined) {
      pageTexts.push(`--- Page ${pageNum} ---\n${joined}`);
    }
  }

  return {
    text: pageTexts.join('\n\n'),
    pageCount: pdf.numPages,
  };
}

export async function extractTextFromHtml(file: File): Promise<string> {
  const rawHtml = await file.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(rawHtml, 'text/html');

  // Remove script & style noise
  doc.querySelectorAll('script, style, noscript').forEach((node) => node.remove());

  // Preserve TCS iON / SSC JE response sheet correct option cues when green tick / rightAns class exists
  doc.querySelectorAll('.rightAns, .right-ans, [class*="right"], [class*="correct"]').forEach((el) => {
    el.prepend(doc.createTextNode(' [OFFICIAL CORRECT ANSWER] '));
  });

  const bodyText = (doc.body?.innerText || doc.body?.textContent || '')
    .replace(/\t+/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return bodyText;
}

export async function parseUploadedFiles(files: FileList | File[]): Promise<ParsedFilePayload> {
  const fileArr = Array.from(files);
  const textParts: string[] = [];
  const images: { mimeType: string; data: string }[] = [];
  let pageCount = 0;
  let usedVisionPdf = false;

  for (const file of fileArr) {
    const lower = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || lower.endsWith('.pdf');
    const isHtml = file.type === 'text/html' || lower.endsWith('.html') || lower.endsWith('.htm');
    const isImage =
      file.type.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp)$/i.test(lower);

    if (isPdf) {
      let extractedText = '';
      try {
        const res = await extractTextFromPdf(file);
        pageCount += res.pageCount;
        extractedText = res.text.trim();
      } catch {
        // PDF.js failed (e.g., worker blocked or scanned PDF) — fall through to native Gemini PDF vision
        extractedText = '';
      }

      const compactLength = extractedText.replace(/\s+/g, '').length;
      if (compactLength >= 120) {
        textParts.push(`[PDF: ${file.name}]\n${extractedText}`);
      } else {
        // Scanned / smartboard image-based PDF (extremely common in live coaching PDFs)
        // Send the PDF natively to Gemini multimodal vision, or render pages if file is huge.
        usedVisionPdf = true;
        if (extractedText) {
          textParts.push(`[PDF Partial Text: ${file.name}]\n${extractedText}`);
        }
        if (file.size <= MAX_INLINE_PDF_BYTES) {
          const pdfPayload = await fileToBase64(file, 'application/pdf');
          images.push({
            mimeType: 'application/pdf',
            data: pdfPayload.data,
          });
        } else {
          try {
            const pageImgs = await renderPdfPagesAsImages(file, 5);
            images.push(...pageImgs);
          } catch {
            throw new Error(
              `"${file.name}" is larger than 18 MB and contains scanned slides. Please compress or split the PDF first.`,
            );
          }
        }
      }
    } else if (isHtml) {
      const htmlText = await extractTextFromHtml(file);
      if (htmlText.trim()) {
        textParts.push(`[HTML Response Sheet: ${file.name}]\n${htmlText}`);
      }
    } else if (isImage) {
      const img = await fileToBase64Image(file);
      images.push(img);
    } else {
      const plain = await file.text();
      if (plain.trim()) {
        textParts.push(`[Text: ${file.name}]\n${plain}`);
      }
    }
  }

  return {
    textContent: textParts.join('\n\n'),
    images,
    pageCount,
    usedVisionPdf,
  };
}
