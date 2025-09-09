import fs from 'fs';
import path from 'path';

type TemplateResult = { subject?: string; text?: string; html?: string };

const cache = new Map<string, TemplateResult>();

function interpolate(input: string, vars: Record<string, unknown>): string {
  return input.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ''));
}

export function renderEmailTemplate(name: string, vars: Record<string, unknown>): TemplateResult | null {
  try {
    if (cache.has(name)) {
      const cached = cache.get(name)!;
      return {
        subject: cached.subject ? interpolate(cached.subject, vars) : undefined,
        text: cached.text ? interpolate(cached.text, vars) : undefined,
        html: cached.html ? interpolate(cached.html, vars) : undefined,
      };
    }
    const baseDir = path.resolve(__dirname, '../../templates/email', name);
    const subjectPath = path.join(baseDir, 'subject.txt');
    const textPath = path.join(baseDir, 'text.txt');
    const htmlPath = path.join(baseDir, 'html.html');

    const result: TemplateResult = {};
    if (fs.existsSync(subjectPath)) result.subject = fs.readFileSync(subjectPath, 'utf8');
    if (fs.existsSync(textPath)) result.text = fs.readFileSync(textPath, 'utf8');
    if (fs.existsSync(htmlPath)) result.html = fs.readFileSync(htmlPath, 'utf8');

    if (!result.subject && !result.text && !result.html) return null;
    cache.set(name, result);
    return {
      subject: result.subject ? interpolate(result.subject, vars) : undefined,
      text: result.text ? interpolate(result.text, vars) : undefined,
      html: result.html ? interpolate(result.html, vars) : undefined,
    };
  } catch {
    return null;
  }
}

