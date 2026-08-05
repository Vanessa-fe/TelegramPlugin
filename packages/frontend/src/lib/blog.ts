import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import readingTime from 'reading-time';

const contentDirectory = path.join(process.cwd(), 'content/blog');

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  readingTime: string;
  content: string;
  featured?: boolean;
}

export interface BlogPostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  author: {
    name: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
  readingTime: string;
  featured?: boolean;
}

export function getAllPosts(): BlogPostMetadata[] {
  try {
    if (!fs.existsSync(contentDirectory)) {
      return [];
    }

    const files = fs.readdirSync(contentDirectory);
    const mdxFiles = files.filter((file) => file.endsWith('.mdx'));

    const posts = mdxFiles
      .map((filename) => {
        const slug = filename.replace(/\.mdx$/, '');
        const filePath = path.join(contentDirectory, filename);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const { data, content } = matter(fileContent);

        return {
          slug,
          title: data.title || 'Sans titre',
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          author: data.author || { name: 'Sublynk' },
          category: data.category || 'Non classé',
          tags: data.tags || [],
          image: data.image,
          imageAlt: data.imageAlt,
          readingTime: readingTime(content).text,
          featured: data.featured || false,
        } as BlogPostMetadata;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return posts;
  } catch (error) {
    console.error('Error loading blog posts:', error);
    return [];
  }
}

export function getPostBySlug(slug: string): BlogPost | null {
  try {
    if (!fs.existsSync(contentDirectory)) {
      return null;
    }

    const filePath = path.join(contentDirectory, `${slug}.mdx`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || 'Sans titre',
      description: data.description || '',
      date: data.date || new Date().toISOString(),
      author: data.author || { name: 'Sublynk' },
      category: data.category || 'Non classé',
      tags: data.tags || [],
      image: data.image,
      imageAlt: data.imageAlt,
      readingTime: readingTime(content).text,
      content,
      featured: data.featured || false,
    };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

export function getPostsByCategory(category: string): BlogPostMetadata[] {
  const allPosts = getAllPosts();
  return allPosts.filter(
    (post) => post.category.toLowerCase() === category.toLowerCase(),
  );
}

export function getPostsByTag(tag: string): BlogPostMetadata[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) =>
    post.tags.some((t) => t.toLowerCase() === tag.toLowerCase()),
  );
}

export function getFeaturedPosts(): BlogPostMetadata[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.featured);
}

export function getAllCategories(): string[] {
  const allPosts = getAllPosts();
  const categories = allPosts.map((post) => post.category);
  return Array.from(new Set(categories)).sort();
}

export function getAllTags(): string[] {
  const allPosts = getAllPosts();
  const tags = allPosts.flatMap((post) => post.tags);
  return Array.from(new Set(tags)).sort();
}
