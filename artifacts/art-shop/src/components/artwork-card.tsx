import { Link, useLocation } from "wouter";
import type { Artwork } from "@workspace/api-client-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { saveScrollPosition } from "@/hooks/use-scroll";

interface ArtworkCardProps {
  artwork: Artwork & {
    editionTotal?: number;
    editionSold?: number;
  };
  index?: number;
  priority?: boolean;
}

function parsePrintMinPrice(dimensions: string): number | null {
  try {
    const p = JSON.parse(dimensions);
    if (p && "A5" in p) {
      const prices = [p.A5, p.A4, p.A3].filter((v: number) => v > 0);
      return prices.length > 0 ? Math.min(...prices) : null;
    }
  } catch {}
  return null;
}

export function ArtworkCard({ artwork, index = 0, priority = false }: ArtworkCardProps) {
  const [location] = useLocation();

  const isPrint = artwork.category === "print";
  const minPrice = isPrint ? parsePrintMinPrice(artwork.dimensions) : null;
  const displayPrice = isPrint
    ? (minPrice != null ? `From $${minPrice.toLocaleString()}` : "—")
    : `$${artwork.price.toLocaleString()}`;

  const editionTotal = artwork.editionTotal ?? 50;
  const editionSold = artwork.editionSold ?? 0;
  const editionRemaining = editionTotal - editionSold;
  const isSoldOut = isPrint && editionRemaining <= 0;

  return (
    <Link
      href={`/artwork/${artwork.id}`}
      className="group block"
      onClick={() => saveScrollPosition(location)}
    >
      <div
        className="relative overflow-hidden bg-muted animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <AspectRatio ratio={3 / 4}>
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading={priority ? "eager" : "lazy"}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </AspectRatio>

        {/* Sold badge */}
        {(!artwork.available || isSoldOut) && (
          <div className="absolute top-4 left-4 bg-black/70 text-white px-5 py-2 text-sm uppercase tracking-widest font-medium">
            {isSoldOut ? "Sold Out" : "Sold"}
          </div>
        )}

        {/* Edition remaining badge cho Print — chỉ hiện khi còn ít (≤10) */}
        {isPrint && artwork.available && !isSoldOut && editionRemaining <= 10 && (
          <div className="absolute top-4 right-4 bg-black/70 text-amber-300 px-3 py-1 text-xs uppercase tracking-widest font-medium">
            {editionRemaining} left
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
      </div>

      <div className="mt-6 flex justify-between items-start gap-3">
        <div className="min-w-0">
          <h3 className="font-serif text-xl group-hover:italic transition-all duration-300 truncate">
            {artwork.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <p className="text-muted-foreground text-sm">
              {isPrint ? "Fine Art Print" : artwork.medium}, {artwork.year}
            </p>
            {/* Edition info — phân cách bằng đường dọc */}
            {isPrint && (
              <>
                <span className="text-muted-foreground/30 text-sm">|</span>
                <p className={`text-xs ${editionRemaining <= 5 && editionRemaining > 0 ? "text-amber-400" : "text-muted-foreground"}`}>
                  {isSoldOut ? "Sold Out" : `${editionRemaining}/${editionTotal} remaining`}
                </p>
              </>
            )}
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide flex-shrink-0">
          {displayPrice}
        </p>
      </div>
    </Link>
  );
}
