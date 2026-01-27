'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import Card from '@/components/Card';
import { FALLBACK_REVIEWS } from '@/lib/reviews';

const FALLBACK_SUMMARY = '4.9/5 · Basé sur 77 avis Google';

export default function GoogleReviews() {
  const [reviews, setReviews] = useState(FALLBACK_REVIEWS);
  const [source, setSource] = useState('fallback');
  const [summary, setSummary] = useState(FALLBACK_SUMMARY);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const loadReviews = async () => {
      try {
        const response = await fetch('/api/google-reviews', {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to fetch reviews');
        }

        if (isActive && Array.isArray(data.reviews) && data.reviews.length > 0) {
          setReviews(data.reviews);
          setSource(data.source === 'google' ? 'google' : 'fallback');
          if (data.source === 'google' && data.averageRating && data.totalRatings) {
            setSummary(`${data.averageRating}/5 · Basé sur ${data.totalRatings} avis`);
          } else {
            setSummary(FALLBACK_SUMMARY);
          }
        }
      } catch (error) {
        console.error('Google reviews fetch error:', error);
        if (isActive) {
          setReviews(FALLBACK_REVIEWS);
          setSource('fallback');
          setSummary(FALLBACK_SUMMARY);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadReviews();

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  return (
    <>
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-airDark mb-3">
          {source === 'google' ? 'Avis Google' : 'Avis clients'}
        </h2>
        <div className="flex justify-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-airAccent text-airAccent" />
          ))}
        </div>
        <p className="text-gray-600">{summary}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.slice(0, 3).map((review, index) => (
          <ReviewCard key={`${review.authorName || 'review'}-${index}`} review={review} />
        ))}
      </div>
    </>
  );
}

function ReviewCard({ review }) {
  const metaParts = [review.relativeTimeDescription, review.badge].filter(Boolean);
  const metaText = metaParts.join(' · ');

  return (
    <Card className="h-full">
      <div className="flex gap-1 mb-3">
        {[...Array(review.rating || 5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-airAccent text-airAccent" />
        ))}
      </div>
      <p className="text-gray-700 mb-4 leading-relaxed">
        "{review.text || 'Service au top, je recommande.'}"
      </p>
      <div className="pt-4 border-t border-airBorder">
        <p className="font-semibold text-airDark">{review.authorName || 'Client vérifié'}</p>
        <p className="text-sm text-gray-500">{metaText || 'Avis client'}</p>
      </div>
    </Card>
  );
}
