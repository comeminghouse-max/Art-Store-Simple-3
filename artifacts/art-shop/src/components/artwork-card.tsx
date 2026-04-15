import { Link } from "wouter";
import type { Artwork } from "@workspace/api-client-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ArtworkCardProps {
  artwork: Artwork;
  index?: number;
  priority?: boolean;
}

const options = [
  {
    label: "Original",
    description: "One of a kind",
  },
  {
    label: "Commission",
    description: "Made for you",
  },
  {
    label: "Print",
    description: "Fine art print",
  },
];

export function ArtworkCard({ artwork, index = 0, priority = false }: ArtworkCardProps) {
  return (
    <div
      className="group block animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="relative overflow-hidden bg-muted">
        <AspectRatio ratio={3 / 4}>
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading={priority ? "eager" : "lazy"}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </AspectRatio>

        {!artwork.available && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1 text-xs uppercase tracking-widest font-medium z-20">
            Sold
          </div>
        )}

        {/* Hover overlay with 3 options */}
        <div className="absolute inset-0 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-400 z-10">
          {options.map((option, i) => (
            <Link
              key={option.label}
              href={
                option.label === "Original"
                  ? `/artwork/${artwork.id}`
                  : `/contact?subject=${encodeURIComponent(`${option.label}: ${artwork.title}`)}`
              }
              className="flex-1 flex flex-col items-center justify-center bg-black/60 backdrop-blur-[2px] hover:bg-black/75 transition-colors duration-200 cursor-pointer border-b border-white/10 last:border-b-0"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span className="text-white text-sm uppercase tracking-[0.2em] font-medium">
                {option.label}
              </span>
              <span className="text-white/60 text-xs mt-1 tracking-wider">
                {option.description}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-between items-baseline">
        <div>
          <Link href={`/artwork/${artwork.id}`}>
            <h3 className="font-serif text-xl group-hover:italic transition-all duration-300 cursor-pointer">
              {artwork.title}
            </h3>
          </Link>
          <p className="text-muted-foreground text-sm mt-1">
            {artwork.medium}, {artwork.year}
          </p>
        </div>
        <p className="text-sm font-medium tracking-wide">
          ${artwork.price.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
