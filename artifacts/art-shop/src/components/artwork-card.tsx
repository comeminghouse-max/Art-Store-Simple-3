import { Link } from "wouter";
import type { Artwork } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ArtworkCardProps {
  artwork: Artwork;
  index?: number;
  priority?: boolean;
}

export function ArtworkCard({ artwork, index = 0, priority = false }: ArtworkCardProps) {
  return (
    <Link href={`/artwork/${artwork.id}`} className="group block">
      <div 
        className="relative overflow-hidden bg-muted animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
        style={{ animationDelay: `${index * 150}ms` }}
      >
        <AspectRatio ratio={3/4}>
          <img
            src={artwork.imageUrl}
            alt={artwork.title}
            loading={priority ? "eager" : "lazy"}
            className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </AspectRatio>
        {!artwork.available && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm text-foreground px-3 py-1 text-xs uppercase tracking-widest font-medium">
            Sold
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/10" />
      </div>
      
      <div className="mt-6 flex justify-between items-baseline">
        <div>
          <h3 className="font-serif text-xl group-hover:italic transition-all duration-300">{artwork.title}</h3>
          <p className="text-muted-foreground text-sm mt-1">{artwork.medium}, {artwork.year}</p>
        </div>
        <p className="text-sm font-medium tracking-wide">
          ${artwork.price.toLocaleString()}
        </p>
      </div>
    </Link>
  );
}
