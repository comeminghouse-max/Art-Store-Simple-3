import { useParams, Link } from "wouter";
import { useGetArtwork, getGetArtworkQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight } from "lucide-react";
import NotFound from "./not-found";

export default function ArtworkDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: artwork, isLoading, isError } = useGetArtwork(id, {
    query: {
      enabled: !!id,
      queryKey: getGetArtworkQueryKey(id)
    }
  });

  if (isError) return <NotFound />;

  if (isLoading || !artwork) {
    return (
      <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <div className="lg:col-span-7">
            <Skeleton className="w-full aspect-[3/4] rounded-none" />
          </div>
          <div className="lg:col-span-5 space-y-8 pt-8">
            <Skeleton className="w-3/4 h-12" />
            <Skeleton className="w-1/2 h-6" />
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-12" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <div className="container mx-auto">
        <Link 
          href="/gallery" 
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 animate-in fade-in slide-in-from-left-4 duration-500"
        >
          <ArrowLeft size={16} strokeWidth={1} />
          Back to Gallery
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* Image Column */}
          <div className="lg:col-span-7 lg:sticky lg:top-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative bg-muted">
              <img 
                src={artwork.imageUrl} 
                alt={artwork.title}
                className="w-full h-auto object-contain max-h-[80vh]"
              />
            </div>
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-12 animate-in fade-in slide-in-from-right-8 duration-700 delay-200 fill-mode-both">
            <div className="mb-4">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">{artwork.category}</span>
            </div>
            
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">
              {artwork.title}
            </h1>
            
            <p className="text-2xl font-light tracking-wide mb-8">
              ${artwork.price.toLocaleString()}
            </p>

            <div className="h-px w-full bg-border mb-8" />

            <div className="grid grid-cols-2 gap-y-4 text-sm mb-12">
              <div className="text-muted-foreground">Medium</div>
              <div className="font-medium text-right">{artwork.medium}</div>
              
              <div className="text-muted-foreground">Dimensions</div>
              <div className="font-medium text-right">{artwork.dimensions}</div>
              
              <div className="text-muted-foreground">Year</div>
              <div className="font-medium text-right">{artwork.year}</div>
              
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium text-right">
                {artwork.available ? (
                  <span className="text-green-600 dark:text-green-400">Available</span>
                ) : (
                  <span className="text-muted-foreground">Sold / Archived</span>
                )}
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert font-light leading-relaxed text-muted-foreground mb-12">
              <p>{artwork.description}</p>
            </div>

            {artwork.available ? (
              <Link 
                href={`/contact?inquiry=Artwork: ${artwork.title}`}
                className="w-full py-4 px-6 bg-foreground text-background text-center text-sm uppercase tracking-widest font-medium hover:bg-foreground/90 transition-colors flex items-center justify-center gap-3 group"
              >
                Inquire to Purchase
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
              </Link>
            ) : (
              <div className="w-full py-4 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground">
                Currently Unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
