export type Review = {
  authorName: string;
  rating: number;
  text: string;
  relativeTimeDescription?: string;
  profilePhotoUrl?: string;
  badge?: string;
};

export const FALLBACK_REVIEWS: Review[] = [
  {
    authorName: 'Pascal Schoonejans',
    rating: 5,
    text: "J'ai fait appel à eux pour la 2ème fois pour entretenir mes climatiseurs. Boulot parfait, toujours gentils, polis, rapide, efficace. Rien à voir avec les concurrents qui sont venus avant eux !",
    relativeTimeDescription: 'Il y a 5 mois',
    badge: '5 avis',
  },
  {
    authorName: 'Andrea Sorvillo',
    rating: 5,
    text: "Merci beaucoup pour votre super boulot !! Travail parfait, net et très propre. Les installateurs très gentils et respectueux. Je recommande fortement.",
    relativeTimeDescription: 'Il y a 4 ans',
    badge: 'Local Guide · 7 avis · 18 photos',
  },
  {
    authorName: 'Sophie Van Trappen',
    rating: 5,
    text: "Highly professional company. Attractive offer. Delighted to have ordered my air conditioner last weekend and had it installed just a few days later! Very meticulous work.",
    relativeTimeDescription: 'Il y a 1 an',
    badge: '3 avis',
  },
  {
    authorName: 'Sabibi',
    rating: 5,
    text: "Équipe sympathique et très professionnelle. Le service clientèle est au top, toujours prêt à répondre à vos besoins et questions !",
    relativeTimeDescription: 'Il y a 1 an',
    badge: 'Local Guide · 17 avis',
  },
  {
    authorName: 'Paulina van Nugteren',
    rating: 5,
    text: "La société Aircooling a installé deux appareils airclim dans notre appartement. Le travail a été effectué dans le délai et avec grand soin. Nous pouvons absolument recommander cette entreprise !",
    relativeTimeDescription: 'Il y a 1 an',
    badge: '5 avis',
  },
  {
    authorName: 'Avi Davidson',
    rating: 5,
    text: "Équipe très professionnelle et bien aimable. Installation faite de manière très nette. On peut les recommander sans aucun doute.",
    relativeTimeDescription: 'Il y a 2 ans',
    badge: 'Local Guide · 34 avis · 61 photos',
  },
  {
    authorName: 'Dominique Dony',
    rating: 5,
    text: "Equipe de techniciens compétents, consciencieux, aimables, ponctuels, serviables aussi bien en vente qu'en service après-vente. Merci à tous",
    relativeTimeDescription: 'Il y a 1 an',
    badge: '10 avis',
  },
];

type NormalizableReview = {
  author_name?: string;
  authorName?: string;
  rating?: number;
  text?: string;
  relative_time_description?: string;
  relativeTimeDescription?: string;
  profile_photo_url?: string;
  profilePhotoUrl?: string;
  badge?: string;
};

export function normalizeReviews(input: NormalizableReview[] = []): Review[] {
  return input.map((review) => {
    const authorName = review.authorName || review.author_name || 'Client vérifié';
    const rawText = (review.text || '').trim();
    const text = rawText || 'Service au top, je recommande.';

    return {
      authorName,
      rating: review.rating ?? 5,
      text,
      relativeTimeDescription:
        review.relativeTimeDescription || review.relative_time_description,
      profilePhotoUrl: review.profilePhotoUrl || review.profile_photo_url,
      badge: review.badge,
    };
  });
}
