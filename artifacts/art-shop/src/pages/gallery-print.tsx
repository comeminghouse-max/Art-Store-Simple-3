import { useListArtworks } from "@workspace/api-client-react";
import { ArtworkCard } from "@/components/artwork-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollRestoration } from "@/hooks/use-scroll";

const printDetails = [
  { label: "Paper", value: "300gsm fine art matte" },
  { label: "Inks", value: "Archival pigment inks" },
  { label: "Sizes", value: "A5, A4, A3 — or custom on request" },
  { label: "Editions", value: "Limited to 50 per artwork, signed and numbered" },
  { label: "Shipping", value: "Rolled in archival tube, worldwide delivery" },
];

export default function GalleryPrint() {
  const { data: rawArtworks, isLoading } = useListArtworks({ category: "print" } as any);
  const artworks = Array.isArray(rawArtworks) ? rawArtworks : [];
  useScrollRestoration(!isLoading);

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">

        {/* Header */}
        <header className="mb-16 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-4">Gallery</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-6">Fine Art Prints</h1>
          <p className="text-muted-foreground font-light leading-relaxed">
            Museum-quality reproductions of original works. Each print is produced on archival materials,
            signed and numbered in a limited edition.
          </p>
        </header>

        {/* Print specs — removed pricing line, adjusted bottom margin */}
        <section className="mb-16 max-w-2xl mx-auto animate-in fade-in duration-700 delay-150 fill-mode-both">
          <div className="border-t border-border/50">
            {printDetails.map((detail) => (
              <div
                key={detail.label}
                className="flex justify-between items-baseline py-4 border-b border-border/30"
              >
                <span className="text-xs uppercase tracking-widest text-muted-foreground">
                  {detail.label}
                </span>
                <span className="text-sm font-light text-right max-w-xs">{detail.value}</span>
              </div>
            ))}
          </div>
          {/* Dòng "Prints start from $120" đã được xóa */}
        </section>

        {/* Artwork grid */}
        <h2 className="font-serif text-2xl text-center mb-12 animate-in fade-in duration-700 delay-200 fill-mode-both">
          Available as Prints
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[3/4] rounded-none" />
                <Skeleton className="w-2/3 h-6" />
                <Skeleton className="w-1/3 h-4" />
              </div>
            ))
          ) : artworks.length > 0 ? (
            artworks.map((artwork, i) => (
              <ArtworkCard key={artwork.id} artwork={artwork} index={i} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <p className="text-muted-foreground italic text-lg">No prints available at this time.</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
