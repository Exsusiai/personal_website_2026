// Map Notion property objects to application types — no Notion SDK types exposed

interface NotionProperty {
  type: string;
  [key: string]: unknown;
}

interface RichTextSpan { plain_text: string }
interface FileObject {
  type: 'external' | 'file';
  external?: { url: string };
  file?: { url: string };
}

export function parseTitle(prop: NotionProperty): string {
  const spans = (prop as { title?: RichTextSpan[] }).title ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseRichText(prop: NotionProperty): string {
  const spans = (prop as { rich_text?: RichTextSpan[] }).rich_text ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseSelect(prop: NotionProperty): string | null {
  const sel = (prop as { select?: { name: string } | null }).select;
  return sel?.name ?? null;
}

export function parseMultiSelect(prop: NotionProperty): string[] {
  const arr = (prop as { multi_select?: { name: string }[] }).multi_select ?? [];
  return arr.map((s) => s.name);
}

export function parseNumber(prop: NotionProperty): number | null {
  return (prop as { number?: number | null }).number ?? null;
}

export function parseCheckbox(prop: NotionProperty): boolean {
  return !!(prop as { checkbox?: boolean }).checkbox;
}

export function parseUrl(prop: NotionProperty): string | null {
  const url = (prop as { url?: string | null }).url;
  return url && url.length > 0 ? url : null;
}

export function parseDate(prop: NotionProperty): { start: string; end: string | null } | null {
  const d = (prop as { date?: { start: string; end: string | null } | null }).date;
  if (!d) return null;
  return { start: d.start, end: d.end ?? null };
}

export function parseFiles(prop: NotionProperty): string | null {
  const files = (prop as { files?: FileObject[] }).files ?? [];
  const first = files[0];
  if (!first) return null;
  if (first.type === 'external') return first.external?.url ?? null;
  if (first.type === 'file') return first.file?.url ?? null;
  return null;
}
