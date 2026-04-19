import { useGetFeaturedArtworks } from "@workspace/api-client-react";
import { ArtworkCard } from "@/components/artwork-card";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: rawFeaturedArtworks, isLoading } = useGetFeaturedArtworks();
  const featuredArtworks = Array.isArray(rawFeaturedArtworks) ? rawFeaturedArtworks : [];

  return (
    <main className="w-full">
      {/* ── Hero Section ── */}
      <section
        className="flex items-center justify-center px-6 md:px-12 relative overflow-hidden"
        style={{ minHeight: "55vh", paddingTop: "7rem", paddingBottom: "5rem" }}
      >
        {/* Layer 1: Base */}
        <div className="absolute inset-0 -z-30" style={{ backgroundColor: "hsl(var(--background))" }} />

        {/* Layer 2: Canvas weave */}
        <div
          className="absolute inset-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.055) 2px,
                rgba(255,255,255,0.055) 3px
              ),
              repeating-linear-gradient(
                90deg,
                transparent,
                transparent 2px,
                rgba(255,255,255,0.038) 2px,
                rgba(255,255,255,0.038) 3px
              )
            `,
            backgroundSize: "3px 3px",
          }}
        />

        {/* Layer 3: Diagonal weave */}
        <div
          className="absolute inset-0 -z-20 pointer-events-none"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 4px,
                rgba(255,255,255,0.022) 4px,
                rgba(255,255,255,0.022) 5px
              ),
              repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 4px,
                rgba(255,255,255,0.015) 4px,
                rgba(255,255,255,0.015) 5px
              )
            `,
            backgroundSize: "6px 6px",
          }}
        />

        {/* Layer 4: Film grain */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            opacity: 0.09,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='256' height='256' filter='url(%23g)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "140px 140px",
            mixBlendMode: "overlay",
          }}
        />

        {/* Layer 5: Lump texture */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            opacity: 0.06,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='t'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.35' numOctaves='6' seed='2' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23t)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
            backgroundSize: "300px 300px",
            mixBlendMode: "soft-light",
          }}
        />

        {/* Layer 6: Vignette */}
        <div
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: `radial-gradient(
              ellipse 75% 80% at 50% 50%,
              transparent 25%,
              rgba(0,0,0,0.20) 62%,
              rgba(0,0,0,0.48) 100%
            )`,
          }}
        />

        {/* Layer 7: Warm center glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 pointer-events-none"
          style={{
            width: "42vw",
            height: "42vw",
            background: "radial-gradient(circle, rgba(195,158,105,0.08) 0%, transparent 70%)",
          }}
        />

        {/* Hero text */}
        <div className="max-w-4xl text-center z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tighter text-foreground">
            Soul &amp; <br />
            <span className="italic font-light text-muted-foreground">Canvas</span>
          </h1>
          <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-xl mx-auto font-light leading-relaxed">
            Capturing the unique spirit of individuals through the timeless medium of oil painting.
          </p>
        </div>
      </section>

      {/* ── About the Artist ── */}
      <section className="py-32 px-6 md:px-12">
        <div className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24 items-start">

            {/* Portrait */}
            <div className="md:col-span-5 order-2 md:order-1 animate-in fade-in slide-in-from-left-8 duration-1000 delay-300 fill-mode-both">
              <img
                src="/images/portrait-1.png"
                alt="Portrait of the artist"
                className="w-full aspect-[3/4] object-cover grayscale-[0.3]"
              />
              <div className="mt-4 text-sm text-muted-foreground text-center italic">
                
              </div>
            </div>

            {/* Text */}
            <div className="md:col-span-7 order-1 md:order-2 space-y-6 animate-in fade-in slide-in-from-right-8 duration-1000 delay-300 fill-mode-both">
              <h2 className="font-serif text-4xl">About the Artist</h2>

              <p className="font-serif text-xl md:text-2xl text-foreground leading-snug">
                "I paint to capture the silent moments between memory and reality—the textures of places we've been and the emotional residue they leave behind."
              </p>

              <div className="space-y-4 text-muted-foreground font-light leading-relaxed">
                <p>
                  Based out of a quiet, light-filled studio, the work is born from a practice of deep
                  observation. Rather than painting literal landscapes, the focus is on atmospheric
                  abstraction. What does a specific quality of light feel like? How does the fog over
                  a valley translate to the heavy drag of oil paint on canvas?
                </p>
                <p>
                  The creative process is heavily physical. Large canvases are layered with oil paints,
                  cold wax, and dry pigments, then scraped back, carved into, and rebuilt. This process
                  of accumulation and excavation gives the work a sense of history—as if the painting
                  itself has weathered time.
                </p>
                <p>
                  The intention is not to overwhelm the viewer, but to invite them into a space of
                  stillness. In a hyper-connected world, these paintings serve as anchors—objects that
                  demand slow looking and quiet reflection.
                </p>
              </div>

              <div className="pt-4">
                <Link
                  href="/contact"
                  className="group inline-flex items-center gap-3 text-sm uppercase tracking-widest font-medium border-b border-foreground pb-1 hover:text-muted-foreground hover:border-muted-foreground transition-colors"
                >
                  Get in Touch
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── Featured Artworks ── */}
      <section className="py-24 px-6 md:px-12 bg-secondary/30">
        <div className="container mx-auto">
         

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-[3/4] rounded-none" />
                  <Skeleton className="w-2/3 h-6" />
                  <Skeleton className="w-1/3 h-4" />
                </div>
              ))
                       ) : (
              <p className="text-muted-foreground italic col-span-full"></p>
            )}
          </div>
        </div>
      </section>

    </main>
  );
}
