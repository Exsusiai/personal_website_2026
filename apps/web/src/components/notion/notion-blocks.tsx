import React from 'react';
import type { NotionBlock } from '@/lib/cms/blocks';
import { NotionBlockRenderer, setNotionBlocksComponent } from './notion-block';

// Wire the circular reference so NotionBlockRenderer can render child blocks.
// This runs at module-load time (once) and is safe — both modules are now loaded.
setNotionBlocksComponent(NotionBlocks);

interface NotionBlocksProps {
  blocks: NotionBlock[];
}

/**
 * Renders a flat list of Notion blocks, grouping consecutive list items into
 * <ul> / <ol> wrappers and recursing into child blocks.
 */
export function NotionBlocks({ blocks }: NotionBlocksProps): React.JSX.Element {
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];

    if (block.type === 'bulleted_list_item') {
      // Collect run of consecutive bulleted list items
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'bulleted_list_item') {
        group.push(blocks[i]);
        i++;
      }
      elements.push(
        <ul key={`ul-${group[0].id}`} className="my-4 list-disc pl-6">
          {group.map((b) => (
            <NotionBlockRenderer key={b.id} block={b} />
          ))}
        </ul>,
      );
      continue;
    }

    if (block.type === 'numbered_list_item') {
      // Collect run of consecutive numbered list items
      const group: NotionBlock[] = [];
      while (i < blocks.length && blocks[i].type === 'numbered_list_item') {
        group.push(blocks[i]);
        i++;
      }
      elements.push(
        <ol key={`ol-${group[0].id}`} className="my-4 list-decimal pl-6">
          {group.map((b) => (
            <NotionBlockRenderer key={b.id} block={b} />
          ))}
        </ol>,
      );
      continue;
    }

    elements.push(<NotionBlockRenderer key={block.id} block={block} />);
    i++;
  }

  return <>{elements}</>;
}
