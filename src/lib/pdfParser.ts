import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker via Vite-resolved module URL
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export interface ParsedFilePayload {
  textContent: string;
  images: { mimeType: string; data: string }[];
  pageCount?: number;
}

export async function extractTextFromPdf(file: File, maxPages = 35): Promise<{ text: string; pageCount: number }> {
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

export async function fileToBase64Image(file: File): Promise<{ mimeType: string; data: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      if (commaIdx === -1) {
        reject(new Error('Could not encode image file.'));
        return;
      }
      resolve({
        mimeType: file.type || 'image/png',
        data: result.slice(commaIdx + 1),
      });
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export async function parseUploadedFiles(files: FileList | File[]): Promise<ParsedFilePayload> {
  const fileArr = Array.from(files);
  const textParts: string[] = [];
  const images: { mimeType: string; data: string }[] = [];
  let pageCount = 0;

  for (const file of fileArr) {
    const lower = file.name.toLowerCase();
    if (file.type === 'application/pdf' || lower.endsWith('.pdf')) {
      const res = await extractTextFromPdf(file);
      pageCount += res.pageCount;
      if (res.text.trim()) {
        textParts.push(`[PDF: ${file.name}]\n${res.text}`);
      }
    } else if (file.type === 'text/html' || lower.endsWith('.html') || lower.endsWith('.htm')) {
      const htmlText = await extractTextFromHtml(file);
      if (htmlText.trim()) {
        textParts.push(`[HTML Response Sheet: ${file.name}]\n${htmlText}`);
      }
    } else if (file.type.startsWith('image/')) {
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
  };
}
