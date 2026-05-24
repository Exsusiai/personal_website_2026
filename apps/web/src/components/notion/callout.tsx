import { RichText, type RichTextItem } from './rich-text';
import type { NotionBlock } from '@/lib/cms/blocks';

interface Props {
  block: NotionBlock;
}

export function Callout({ block }: Props) {
  const callout = (block as {
    callout?: { rich_text?: RichTextItem[]; icon?: { type: 'emoji'; emoji: string } };
  }).callout;
  const spans = (callout?.rich_text ?? []) as RichTextItem[];
  const emoji = callout?.icon?.type === 'emoji' ? callout.icon.emoji : '💡';

  return (
    <aside className="my-4 flex gap-3 rounded border-l-2 border-[var(--color-accent)] bg-[var(--color-surface)] p-4">
      <span className="text-lg leading-tight">{emoji}</span>
      <div className="flex-1">
        <RichText spans={spans} />
      </div>
    </aside>
  );
}
