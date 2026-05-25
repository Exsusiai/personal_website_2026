/**
 * URL allowlists for content rendered from Notion. Because anyone with edit
 * access to the Notion workspace can paste arbitrary text, we treat anything
 * that ends up in an `href` or `<Image src>` on the public site as untrusted.
 */

const ALLOWED_LINK_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * Returns the original URL if its scheme is on the allowlist, else null.
 * Use a null return to fall back to plain text (don't render an `<a>` at all).
 */
export function safeHref(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // The dummy base only matters for protocol-relative URLs; an absolute URL
    // overrides it. Bare strings without a scheme fail the protocol check.
    const u = new URL(url);
    return ALLOWED_LINK_SCHEMES.has(u.protocol) ? url : null;
  } catch {
    return null;
  }
}

/**
 * Hosts allowed for `<Image>` rendering. Must stay in sync with
 * `next.config.ts > images.remotePatterns`. A mismatch here would still let an
 * unknown-host image reach `<Image>` and crash the page at render time.
 */
const ALLOWED_IMG_HOSTS = new Set<string>([
  'prod-files-secure.s3.us-west-2.amazonaws.com',
  's3.us-west-2.amazonaws.com',
  'www.notion.so',
  'images.unsplash.com',
]);

export function isAllowedImageHost(url: string): boolean {
  try {
    return ALLOWED_IMG_HOSTS.has(new URL(url).host);
  } catch {
    return false;
  }
}
