import { useListArtworks } from "@workspace/api-client-react";
import { ArtworkCard } from "@/components/artwork-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollRestoration } from "@/hooks/use-scroll";

export default function GalleryOriginal() {
  const { data: rawArtworks, isLoading } = useListArtworks({ available: true });
  const artworks = (Array.isArray(rawArtworks) ? rawArtworks : []).filter(a => a.category !== "print");
  useScrollRestoration(!isLoading && artworks.length > 0);

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">
        <header className="mb-16 md:mb-24 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Gallery</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Original Works</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Each piece is a unique, hand-painted original. Once sold, it belongs entirely to one collector.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
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
              <p className="text-muted-foreground italic text-lg">No original works available at this time.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
