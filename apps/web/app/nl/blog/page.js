import Link from 'next/link';
import { blogPosts } from '@/lib/blog';
import { Clock, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Blog - Aircooling',
  description: 'Gidsen, tips en nieuws over airconditioning, verwarming, koeling en ventilatie.',
};

export default function BlogNLPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#F7FAFB] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-[#CC0A0A] uppercase tracking-widest mb-3">Onze blog</p>
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#293133] mb-4">
            Gidsen &amp; HVAC-tips
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Onze aanbevelingen om uw klimaatcomfort te optimaliseren en uw installaties te onderhouden.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {blogPosts.map((post) => (
              <Link key={post.slug} href={`/nl/blog/${post.slug}`} className="block group">
                <article className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                  <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                    <time>
                      {new Date(post.date).toLocaleDateString('nl-BE', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {post.readingTime}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-[#293133] mb-3 group-hover:text-[#1B3B8A] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed mb-4">{post.excerpt}</p>
                  <span className="inline-flex items-center gap-1 text-[#1B3B8A] font-semibold text-sm group-hover:gap-2 transition-all">
                    Artikel lezen <ArrowRight className="w-4 h-4" />
                  </span>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
