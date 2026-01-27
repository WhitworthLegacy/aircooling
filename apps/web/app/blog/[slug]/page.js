import { notFound } from 'next/navigation';
import Link from 'next/link';
import { blogPosts, getBlogPost } from '@/lib/blog';
import { ArrowLeft, Clock } from 'lucide-react';

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} - Aircooling`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <main>
      <section className="bg-[#F7FAFB] py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[#1B3B8A] font-medium mb-8 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
            <time>
              {new Date(post.date).toLocaleDateString('fr-BE', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </time>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {post.readingTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-[#293133] leading-tight">
            {post.title}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            {post.content.map((block, i) => {
              if (block.startsWith('## ')) {
                return (
                  <h2 key={i} className="text-2xl font-bold text-airDark mt-12 mb-4">
                    {block.slice(3)}
                  </h2>
                );
              }
              if (block.startsWith('### ')) {
                return (
                  <h3 key={i} className="text-xl font-semibold text-airDark mt-8 mb-3">
                    {block.slice(4)}
                  </h3>
                );
              }
              return (
                <p key={i} className="text-gray-600 leading-relaxed mb-5">
                  {block}
                </p>
              );
            })}
          </div>

          <div className="mt-16 pt-8 border-t border-gray-200">
            <p className="text-gray-500 mb-4">Besoin d&apos;un professionnel ?</p>
            <Link href="/devis" className="inline-flex items-center gap-2 bg-airPrimary text-white font-semibold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all">
              Demander un devis gratuit
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
