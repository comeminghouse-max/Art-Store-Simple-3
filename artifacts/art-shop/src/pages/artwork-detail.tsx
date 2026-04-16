import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetArtwork, getGetArtworkQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/cart-context";
import NotFound from "./not-found";

function ImageTransition({ src, alt }: { src: string; alt: string }) {
  const [displayed, setDisplayed] = useState(src);
  const [next, setNext] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (src === displayed && phase === "idle") return;
    if (src === displayed) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setNext(src);
    setPhase("out");

    timeoutRef.current = setTimeout(() => {
      setDisplayed(src);
      setNext(null);
      setPhase("in");

      timeoutRef.current = setTimeout(() => {
        setPhase("idle");
      }, 350);
    }, 250);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [src]);

  const mainStyle: React.CSSProperties = {
    transition: "opacity 250ms ease, transform 250ms ease",
    opacity: phase === "out" ? 0 : 1,
    transform: phase === "out" ? "scale(1.015)" : phase === "in" ? "scale(1.005)" : "scale(1)",
  };

  return (
    <div className="relative w-full h-full">
      <img
        src={displayed}
        alt={alt}
        style={mainStyle}
        className="w-full h-auto object-contain max-h-[72vh] block"
      />
      {next && phase === "out" && (
        <img
          src={next}
          alt={alt}
          className="absolute inset-0 w-full h-auto object-contain max-h-[72vh] opacity-0"
        />
      )}
    </div>
  );
}

export default function ArtworkDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, items } = useCart();

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
            <div className="flex gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-none" />
              ))}
            </div>
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

  const allImages = [artwork.imageUrl, ...(artwork.detailImages || [])];
  const activeImage = allImages[activeIndex] ?? artwork.imageUrl;
  const thumbnailLabels = ["Overview", "Framed", "Detail 1", "Detail 2"];

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
            {/* Main image with transition */}
            <div className="relative bg-muted overflow-hidden">
              <ImageTransition src={activeImage} alt={artwork.title} />
            </div>

            {/* Thumbnail strip */}
            <div className="flex gap-3 mt-4">
              {Array.from({ length: 4 }).map((_, i) => {
                const img = allImages[i] ?? artwork.imageUrl;
                const isActive = activeIndex === i;
                const hasRealImage = i < allImages.length;

                return (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={`relative flex-1 aspect-square bg-muted overflow-hidden transition-all duration-300 border-2 ${
                      isActive
                        ? "border-foreground"
                        : "border-transparent hover:border-foreground/30"
                    }`}
                    title={thumbnailLabels[i]}
                  >
                    <img
                      src={img}
                      alt={`${artwork.title} — ${thumbnailLabels[i]}`}
                      className={`w-full h-full object-cover transition-all duration-300 ${
                        hasRealImage ? "opacity-100" : "opacity-40"
                      } ${isActive ? "scale-105" : "hover:scale-105"}`}
                    />
                    {/* Hover label */}
                    <div className="absolute inset-0 flex items-end justify-center pb-1.5 opacity-0 hover:opacity-100 transition-opacity duration-200 bg-black/25">
                      <span className="text-white text-[9px] uppercase tracking-wider font-medium">
                        {thumbnailLabels[i]}
                      </span>
                    </div>
                    {/* Active underline */}
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 bg-foreground transition-transform duration-300 origin-left ${
                        isActive ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </button>
                );
              })}
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
              <div className="space-y-3">
                <button
                  onClick={() => {
                    const alreadyInCart = items.some((i) => i.artworkId === artwork.id);
                    if (!alreadyInCart) {
                      addItem({
                        artworkId: artwork.id,
                        title: artwork.title,
                        price: artwork.price,
                        imageUrl: artwork.imageUrl,
                        medium: artwork.medium,
                      });
                    }
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                  className={`w-full py-4 px-6 text-center text-sm uppercase tracking-widest font-medium transition-all duration-300 flex items-center justify-center gap-3 ${
                    addedToCart || items.some((i) => i.artworkId === artwork.id)
                      ? "bg-green-600 text-white"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  {addedToCart || items.some((i) => i.artworkId === artwork.id) ? (
                    <>
                      <Check size={16} strokeWidth={2} />
                      Added to Cart
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={16} strokeWidth={1.5} />
                      Add to Cart
                    </>
                  )}
                </button>
                <Link
                  href={`/contact?inquiry=Artwork: ${artwork.title}`}
                  className="w-full py-3 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group"
                >
                  Inquire Directly
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              </div>
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
