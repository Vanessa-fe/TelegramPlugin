import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Navbar, Footer } from '@/components/marketing';
import { getLocale } from 'next-intl/server';
import { buildMetadata } from '@/lib/metadata';
import {
  generateBreadcrumbSchema,
  generateArticleSchema,
  renderJsonLd,
} from '@/lib/json-ld';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { Calendar, Clock, Tag, ArrowLeft, User } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getPostBySlug(slug, locale);

  if (!post) {
    return {
      title: 'Article non trouvé',
    };
  }

  return buildMetadata({
    canonical: `/blog/${slug}`,
    title: post.title,
    description: post.description,
    locale,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const post = getPostBySlug(slug, locale);

  if (!post) {
    notFound();
  }

  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Blog', url: '/blog' },
    { name: post.title, url: `/blog/${slug}` },
  ];

  const articleSchema = generateArticleSchema({
    title: post.title,
    description: post.description,
    url: `/blog/${slug}`,
    image: post.image,
    datePublished: post.date,
    author: post.author,
    category: post.category,
    tags: post.tags,
  });

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(generateBreadcrumbSchema(breadcrumbItems)),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(articleSchema),
        }}
      />
      <Navbar />

      {/* Article Header */}
      <article className="py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 lg:px-6">
          {/* Back Link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-purple-600 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au blog
          </Link>

          {/* Category */}
          <div className="mb-4">
            <Link
              href={`/blog/category/${post.category.toLowerCase()}`}
              className="inline-block bg-purple-100 text-purple-700 text-sm font-medium px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
            >
              {post.category}
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-6">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-text-secondary mb-8 pb-8 border-b border-border-custom">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5" />
              <span className="font-medium">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>{post.readingTime}</span>
            </div>
          </div>

          {/* Featured Image */}
          {post.image && (
            <div className="mb-12 rounded-2xl overflow-hidden">
              <img
                src={post.image}
                alt={post.imageAlt || post.title}
                className="w-full h-auto"
              />
            </div>
          )}

          {/* Content */}
          <div className="prose prose-lg prose-purple max-w-none">
            <MDXRemote source={post.content} />
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t border-border-custom">
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-5 h-5 text-text-secondary" />
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/blog/tag/${tag.toLowerCase()}`}
                    className="inline-block bg-gray-100 text-text-secondary text-sm px-3 py-1 rounded-full hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      {/* CTA */}
      <section className="py-16 lg:py-20 bg-purple-600">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4">
            Prêt à monétiser votre canal Telegram ?
          </h2>
          <p className="text-purple-200 mb-8 max-w-xl mx-auto">
            Rejoignez des centaines de créateurs qui utilisent Sublynk pour
            gérer leurs abonnements
          </p>
          <Link
            href="/register"
            className="inline-block bg-white hover:bg-purple-50 text-purple-600 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 shadow-md"
          >
            Commencer gratuitement
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
