// Map Notion property objects to application types — no Notion SDK types exposed.
//
// All parsers accept `undefined` defensively: Notion only includes properties
// that are set on a page, so newly-added schema columns are absent on older
// rows. A parser that throws on undefined would crash the whole resume page
// the moment we add a column to the data source.

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

export function parseTitle(prop: NotionProperty | undefined): string {
  if (!prop) return '';
  const spans = (prop as { title?: RichTextSpan[] }).title ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseRichText(prop: NotionProperty | undefined): string {
  if (!prop) return '';
  const spans = (prop as { rich_text?: RichTextSpan[] }).rich_text ?? [];
  return spans.map((s) => s.plain_text).join('');
}

export function parseSelect(prop: NotionProperty | undefined): string | null {
  if (!prop) return null;
  const sel = (prop as { select?: { name: string } | null }).select;
  return sel?.name ?? null;
}

/**
 * Validate a select value against a closed union. Unknown / renamed options in
 * Notion would otherwise be cast (via `as ResumeType` etc.) into a typed value
 * that later crashes consumers — e.g. `bundle[item.type.toLowerCase()].push(...)`
 * indexes into `undefined`. This helper logs the offending value and returns a
 * safe fallback so the rest of the page can still render.
 */
export function parseEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T,
  fieldName?: string,
): T {
  if (value && (allowed as readonly string[]).includes(value)) {
    return value as T;
  }
  if (value) {
    console.warn(
      `[cms] unknown ${fieldName ?? 'enum'} value: "${value}" — falling back to "${fallback}"`,
    );
  }
  return fallback;
}

export function parseMultiSelect(prop: NotionProperty | undefined): string[] {
  if (!prop) return [];
  const arr = (prop as { multi_select?: { name: string }[] }).multi_select ?? [];
  return arr.map((s) => s.name);
}

export function parseNumber(prop: NotionProperty | undefined): number | null {
  if (!prop) return null;
  return (prop as { number?: number | null }).number ?? null;
}

export function parseCheckbox(prop: NotionProperty | undefined): boolean {
  if (!prop) return false;
  return !!(prop as { checkbox?: boolean }).checkbox;
}

export function parseUrl(prop: NotionProperty | undefined): string | null {
  if (!prop) return null;
  const url = (prop as { url?: string | null }).url;
  return url && url.length > 0 ? url : null;
}

export function parseDate(prop: NotionProperty | undefined): { start: string; end: string | null } | null {
  if (!prop) return null;
  const d = (prop as { date?: { start: string; end: string | null } | null }).date;
  if (!d) return null;
  return { start: d.start, end: d.end ?? null };
}

export function parseFiles(prop: NotionProperty | undefined): string | null {
  if (!prop) return null;
  const files = (prop as { files?: FileObject[] }).files ?? [];
  const first = files[0];
  if (!first) return null;
  if (first.type === 'external') return first.external?.url ?? null;
  if (first.type === 'file') return first.file?.url ?? null;
  return null;
}
