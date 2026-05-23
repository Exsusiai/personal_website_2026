import { getNotionClient, withRetry } from './notion-client';

export interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
  children?: NotionBlock[];
}

/**
 * Recursively fetch all blocks under a page or block id, including nested children.
 * Notion's API is paginated and shallow; we walk the tree depth-first.
 */
export async function getBlockChildren(blockId: string): Promise<NotionBlock[]> {
  const client = getNotionClient();
  const out: NotionBlock[] = [];
  let cursor: string | undefined;

  do {
    const resp = await withRetry(() =>
      client.blocks.children.list({
        block_id: blockId,
        start_cursor: cursor,
        page_size: 100,
      }),
    );
    for (const block of resp.results) {
      const b = block as unknown as NotionBlock;
      if ((b as { has_children?: boolean }).has_children) {
        b.children = await getBlockChildren(b.id);
      }
      out.push(b);
    }
    cursor = resp.next_cursor ?? undefined;
  } while (cursor);

  return out;
}
