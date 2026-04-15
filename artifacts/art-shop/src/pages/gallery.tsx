import { useState } from "react";
import { useListArtworks, useListCategories } from "@workspace/api-client-react";
import { ArtworkCard } from "@/components/artwork-card";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<string | undefined>();
  
  const { data: categories } = useListCategories();
  
  const { data: artworks, isLoading } = useListArtworks(
    activeCategory ? { category: activeCategory } : undefined
  );

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">
        <header className="mb-16 md:mb-24 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Gallery</h1>
          <p className="text-muted-foreground font-light">
            A complete catalog of available and archived works.
          </p>
        </header>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-16 animate-in fade-in duration-700 delay-200 fill-mode-both">
          <button
            onClick={() => setActiveCategory(undefined)}
            className={cn(
              "text-sm uppercase tracking-widest transition-colors pb-1 border-b",
              !activeCategory ? "text-foreground border-foreground font-medium" : "text-muted-foreground border-transparent hover:text-foreground"
            )}
          >
            All Works
          </button>
          
          {categories?.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "text-sm uppercase tracking-widest transition-colors pb-1 border-b",
                activeCategory === category ? "text-foreground border-foreground font-medium" : "text-muted-foreground border-transparent hover:text-foreground"
              )}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[3/4] rounded-none" />
                <Skeleton className="w-2/3 h-6" />
                <Skeleton className="w-1/3 h-4" />
              </div>
            ))
          ) : artworks && artworks.length > 0 ? (
            artworks.map((artwork, i) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={i} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <p className="text-muted-foreground italic text-lg">No artworks found in this category.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
