import { useGetFeaturedArtworks } from "@workspace/api-client-react";
import { ArtworkCard } from "@/components/artwork-card";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: featuredArtworks, isLoading } = useGetFeaturedArtworks();

  return (
    <main className="w-full">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center pt-24 pb-12 px-6 md:px-12 relative overflow-hidden">
        {/* Subtle background element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] bg-secondary/50 rounded-full blur-[100px] -z-10" />
        
        <div className="max-w-4xl text-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tighter text-foreground">
            Stillness & <br/><span className="italic font-light text-muted-foreground">Luminosity</span>
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            An intimate collection of contemporary original artwork exploring the intersection of memory, landscape, and emotion.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link 
              href="/gallery" 
              className="group flex items-center gap-3 text-sm uppercase tracking-widest font-medium border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
            >
              Enter Gallery
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Artworks */}
      <section className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl">Selected Works</h2>
              <p className="text-muted-foreground mt-4 font-light max-w-md">
                Recent pieces exploring depth, texture, and the quiet moments between thoughts.
              </p>
            </div>
            <Link 
              href="/gallery" 
              className="text-sm uppercase tracking-widest font-medium hover:text-muted-foreground transition-colors"
            >
              View All Works
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[3/4] rounded-none" />
                  <Skeleton className="w-2/3 h-6" />
                  <Skeleton className="w-1/3 h-4" />
                </div>
              ))
            ) : featuredArtworks && featuredArtworks.length > 0 ? (
              featuredArtworks.slice(0, 3).map((artwork, i) => (
                <ArtworkCard key={artwork.id} artwork={artwork} index={i} priority={i === 0} />
              ))
            ) : (
              <p className="text-muted-foreground italic col-span-full">No featured artworks available.</p>
            )}
          </div>
        </div>
      </section>

      {/* Artist Intro snippet */}
      <section className="py-32 px-6 md:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 fill-mode-both">
              <img 
                src="/images/studio.png" 
                alt="Artist Studio" 
                className="w-full aspect-square object-cover grayscale-[0.2]"
              />
            </div>
            <div className="order-1 md:order-2 space-y-8 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 fill-mode-both">
              <h2 className="font-serif text-4xl">The Studio</h2>
              <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
                <p>
                  Every piece begins in the quiet hours of the morning. The studio is a place of synthesis—where observed landscapes meet internal emotional states.
                </p>
                <p>
                  Working primarily in oils and natural pigments, the process is one of layering and reduction, building history into the canvas until the final image emerges.
                </p>
              </div>
              <div className="pt-4">
                <Link 
                  href="/about" 
                  className="group inline-flex items-center gap-3 text-sm uppercase tracking-widest font-medium border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
                >
                  Read Biography
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
