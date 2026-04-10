import Link from 'next/link';

export interface Recipe {
  id: string;
  title: string;
  coverImageUrl?: string;
  region?: { name: string; country?: string };
  averageRating?: number;
  ratingCount?: number;
  isFamilyRecipe?: boolean;
  flavorSpectrum?: Record<string, number>;
  prepTimeMins?: number;
  dietaryTags?: string[];
}

const FLAVOR_COLORS: Record<string, string> = {
  spicy: 'bg-primary',
  sweet: 'bg-tertiary-fixed-dim',
  savory: 'bg-tertiary',
  earthy: 'bg-on-surface-variant',
};

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link href={`/recipes/${recipe.id}`} className="block group hover-lift">
      <div className="bg-surface-container-lowest rounded-[1.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all border border-outline/10">
        {/* Image */}
        <div className="relative h-48 bg-surface-container-high overflow-hidden">
          {recipe.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={recipe.coverImageUrl}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-surface-container to-surface-container-high">
              🍽️
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 via-transparent to-transparent" />

          {recipe.isFamilyRecipe && (
            <span className="absolute top-3 left-3 bg-tertiary-fixed text-on-tertiary-fixed font-label text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-lg">
              👵 Family Recipe
            </span>
          )}

          {recipe.region && (
            <span className="absolute bottom-3 left-3 bg-surface/20 backdrop-blur-md text-white font-label text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full border border-outline/20">
              {recipe.region.name}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-headline font-bold text-on-surface tracking-tight leading-tight line-clamp-2 text-sm">
            {recipe.title}
          </h3>

          {/* Rating */}
          {recipe.averageRating != null && (
            <div className="flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="font-label text-xs font-bold text-on-surface-variant">{recipe.averageRating.toFixed(1)}</span>
              {recipe.ratingCount != null && (
                <span className="font-label text-[10px] text-on-surface-variant">({recipe.ratingCount})</span>
              )}
            </div>
          )}

          {/* Flavor spectrum */}
          {recipe.flavorSpectrum && Object.keys(recipe.flavorSpectrum).length > 0 && (
            <div className="mt-3">
              <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">Flavor</p>
              <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                {Object.entries(recipe.flavorSpectrum)
                  .filter(([, v]) => v > 0)
                  .map(([key, val]) => (
                    <div
                      key={key}
                      className={`${FLAVOR_COLORS[key] || 'bg-outline'} rounded-full`}
                      style={{ width: `${val}%` }}
                      title={`${key}: ${val}%`}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Prep time */}
          {recipe.prepTimeMins && (
            <div className="flex items-center gap-1 mt-2 text-on-surface-variant">
              <span className="material-symbols-outlined text-xs">timer</span>
              <span className="font-label text-[10px] font-bold uppercase tracking-widest">{recipe.prepTimeMins}m prep</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
