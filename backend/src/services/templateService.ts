import fs from 'fs';
import path from 'path';

type TemplateResult = { subject?: string; text?: string; html?: string; title?: string; body?: string };

const cache = new Map<string, TemplateResult>();

function cacheKey(channel: string, name: string): string {
  return `${channel}:${name}`;
}

function interpolate(input: string, vars: Record<string, unknown>): string {
  return input.replace(/{{\s*(\w+)\s*}}/g, (_, key) => String(vars[key] ?? ''));
}

function loadTemplate(channel: 'email' | 'push', name: string): TemplateResult | null {
  const key = cacheKey(channel, name);
  if (cache.has(key)) {
    return cache.get(key)!;
  }
  const baseDir = path.resolve(__dirname, `../../templates/${channel}`, name);
  const result: TemplateResult = {};
  if (channel === 'email') {
    const subjectPath = path.join(baseDir, 'subject.txt');
    const textPath = path.join(baseDir, 'text.txt');
    const htmlPath = path.join(baseDir, 'html.html');
    if (fs.existsSync(subjectPath)) result.subject = fs.readFileSync(subjectPath, 'utf8');
    if (fs.existsSync(textPath)) result.text = fs.readFileSync(textPath, 'utf8');
    if (fs.existsSync(htmlPath)) result.html = fs.readFileSync(htmlPath, 'utf8');
  } else {
    const titlePath = path.join(baseDir, 'title.txt');
    const bodyPath = path.join(baseDir, 'body.txt');
    if (fs.existsSync(titlePath)) result.title = fs.readFileSync(titlePath, 'utf8');
    if (fs.existsSync(bodyPath)) result.body = fs.readFileSync(bodyPath, 'utf8');
  }
  if (!result.subject && !result.text && !result.html && !result.title && !result.body) {
    return null;
  }
  cache.set(key, result);
  return result;
}

export function renderEmailTemplate(name: string, vars: Record<string, unknown>): TemplateResult | null {
  try {
    const tpl = loadTemplate('email', name);
    if (!tpl) return null;
    return {
      subject: tpl.subject ? interpolate(tpl.subject, vars) : undefined,
      text: tpl.text ? interpolate(tpl.text, vars) : undefined,
      html: tpl.html ? interpolate(tpl.html, vars) : undefined,
    };
  } catch {
    return null;
  }
}

export function renderPushTemplate(name: string, vars: Record<string, unknown>): TemplateResult | null {
  try {
    const tpl = loadTemplate('push', name);
    if (!tpl) return null;
    return {
      title: tpl.title ? interpolate(tpl.title, vars) : undefined,
      body: tpl.body ? interpolate(tpl.body, vars) : undefined,
    };
  } catch {
    return null;
  }
}

