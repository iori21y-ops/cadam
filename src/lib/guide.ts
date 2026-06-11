import { readFile, readdir } from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

const GUIDE_DIR = path.join(process.cwd(), 'content', 'guide');

export interface GuideMeta {
  title: string;
  slug: string;
  category: string;
  description: string;
  publishedAt: string;
}

export interface GuideArticle extends GuideMeta {
  content: string;
}

// 카테고리 코드 → 한글 라벨 (목록 그룹 헤더용)
export const GUIDE_CATEGORY_LABELS: Record<string, string> = {
  contract: '계약·만기',
  insurance: '보험·사고',
  cost: '비용·세금',
  guide: '입문 가이드',
};

export function guideCategoryLabel(code: string): string {
  return GUIDE_CATEGORY_LABELS[code] ?? code;
}

function parseFile(raw: string, fallbackSlug: string): GuideArticle {
  const { data, content } = matter(raw);
  return {
    title: String(data.title ?? ''),
    slug: String(data.slug ?? fallbackSlug),
    category: String(data.category ?? 'guide'),
    description: String(data.description ?? ''),
    publishedAt: String(data.publishedAt ?? ''),
    content,
  };
}

export async function getAllGuides(): Promise<GuideArticle[]> {
  let files: string[];
  try {
    files = await readdir(GUIDE_DIR);
  } catch {
    return [];
  }
  const mdFiles = files.filter((f) => f.endsWith('.md'));
  const articles = await Promise.all(
    mdFiles.map(async (file) => {
      const raw = await readFile(path.join(GUIDE_DIR, file), 'utf-8');
      return parseFile(raw, file.replace(/\.md$/, ''));
    })
  );
  // 최신순 정렬
  return articles.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export async function getGuideBySlug(slug: string): Promise<GuideArticle | null> {
  const all = await getAllGuides();
  return all.find((a) => a.slug === slug) ?? null;
}
