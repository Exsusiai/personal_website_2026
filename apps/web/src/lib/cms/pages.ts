import { getBlockChildren, type NotionBlock } from './blocks';
import { getNotionClient, withRetry } from './notion-client';
import { getEnv } from '@/lib/env';

export async function getAboutBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_ABOUT);
}

export async function getNowBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_NOW);
}

export async function getContactBlocks(): Promise<NotionBlock[]> {
  return getBlockChildren(getEnv().NOTION_PAGE_CONTACT);
}

export async function getPageMeta(pageId: string) {
  const client = getNotionClient();
  return withRetry(() => client.pages.retrieve({ page_id: pageId }));
}
