import type { NotionBlock } from './blocks';

const WORDS_PER_MIN = 250;

function blockToText(block: NotionBlock): string {
  const payload = (block as Record<string, unknown>)[block.type] as
    | { rich_text?: { plain_text: string }[] }
    | undefined;
  const richArr = payload?.rich_text ?? [];
  return richArr.map((r) => r.plain_text).join('');
}

export function estimateReadingTime(blocks: NotionBlock[]): number {
  let text = '';
  const walk = (b: NotionBlock) => {
    text += ' ' + blockToText(b);
    b.children?.forEach(walk);
  };
  blocks.forEach(walk);
  // Chinese chars vs English words: treat ~3 chars as 1 word
  const words = text.trim().length / 3;
  return Math.max(1, Math.ceil(words / WORDS_PER_MIN));
}
