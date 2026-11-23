/**
 * Client-side sanitizer for inline monochrome engineering SVG diagrams.
 * Strips script/foreignObject/event handlers and enforces monochrome responsive rendering.
 */
export function sanitizeInlineSvg(rawSvg: string): string {
  if (!rawSvg || typeof rawSvg !== 'string') return '';
  const start = rawSvg.indexOf('<svg');
  const end = rawSvg.lastIndexOf('</svg>');
  if (start === -1 || end === -1) return '';

  let svg = rawSvg.slice(start, end + 6);
  svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
  svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  svg = svg.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
  svg = svg.replace(/<style[\s\S]*?<\/style>/gi, '');
  svg = svg.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/javascript:/gi, '');

  if (!/viewBox\s*=/i.test(svg)) {
    svg = svg.replace('<svg', '<svg viewBox="0 0 420 180"');
  }
  return svg;
}
