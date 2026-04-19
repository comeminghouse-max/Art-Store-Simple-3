import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "wouter";
import { useGetArtwork, useListArtworks, getGetArtworkQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ArrowRight, ShoppingBag, Check, X, ZoomIn, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useScrollToTop, saveScrollPosition } from "@/hooks/use-scroll";
import NotFound from "./not-found";

type PrintSize = "A5" | "A4" | "A3";
type PrintPrices = { A5: number; A4: number; A3: number };

const PRINT_SIZE_LABELS: Record<PrintSize, { label: string; sub: string }> = {
  A5: { label: "A5", sub: '5.8 × 8.3"' },
  A4: { label: "A4", sub: '8.3 × 11.7"' },
  A3: { label: "A3", sub: '11.7 × 16.5"' },
};

function parsePrintPrices(dimensions: string): PrintPrices | null {
  try {
    const p = JSON.parse(dimensions);
    if (p && "A5" in p && "A4" in p && "A3" in p) return p;
  } catch {}
  return null;
}

type ArtworkWithTags = {
  id: number; title: string; description: string; category: string;
  price: number; imageUrl: string; detailImages: string[]; tags: string[];
  available: boolean; year: number; dimensions: string; medium: string; featured: boolean;
  editionTotal?: number; editionSold?: number;
};

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) {
  const [current, setCurrent] = useState(initialIndex);
  const [animKey, setAnimKey] = useState(0);
  const [direction, setDirection] = useState<"left" | "right">("right");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const go = useCallback((dir: "prev" | "next") => {
    setDirection(dir === "next" ? "right" : "left");
    setAnimKey(k => k + 1);
    setCurrent(c => dir === "next" ? (c + 1) % images.length : (c - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [go, onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center" onClick={onClose}>
      <style>{`
        @keyframes lbR{from{opacity:0;transform:translateX(60px)}to{opacity:1;transform:translateX(0)}}
        @keyframes lbL{from{opacity:0;transform:translateX(-60px)}to{opacity:1;transform:translateX(0)}}
        .lb-r{animation:lbR 0.35s cubic-bezier(.25,.46,.45,.94) forwards}
        .lb-l{animation:lbL 0.35s cubic-bezier(.25,.46,.45,.94) forwards}
      `}</style>
      <button onClick={onClose} className="absolute top-5 right-5 z-10 text-white/70 hover:text-white p-2"><X size={32} strokeWidth={1} /></button>
      {images.length > 1 && <div className="absolute top-5 left-1/2 -translate-x-1/2 text-white/50 text-xs uppercase tracking-widest">{current + 1} / {images.length}</div>}
      {images.length > 1 && <button onClick={e => { e.stopPropagation(); go("prev"); }} className="absolute left-4 md:left-8 text-white/50 hover:text-white p-3 z-10"><ArrowLeft size={36} strokeWidth={1} /></button>}
      <div className="w-full h-full flex items-center justify-center px-16 md:px-24"
        onClick={e => e.stopPropagation()}
        onTouchStart={e => setTouchStartX(e.touches[0].clientX)}
        onTouchEnd={e => { if (touchStartX === null) return; const d = touchStartX - e.changedTouches[0].clientX; if (Math.abs(d) > 50) go(d > 0 ? "next" : "prev"); setTouchStartX(null); }}>
        <img key={animKey} src={images[current]} alt="" className={`max-w-full max-h-[90vh] object-contain select-none ${direction === "right" ? "lb-r" : "lb-l"}`} draggable={false} />
      </div>
      {images.length > 1 && <button onClick={e => { e.stopPropagation(); go("next"); }} className="absolute right-4 md:right-8 text-white/50 hover:text-white p-3 z-10"><ArrowRight size={36} strokeWidth={1} /></button>}
      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {images.map((_, i) => <button key={i} onClick={e => { e.stopPropagation(); setDirection(i > current ? "right" : "left"); setAnimKey(k => k + 1); setCurrent(i); }} className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/30"}`} />)}
        </div>
      )}
    </div>
  );
}

// ── Infinite Print Slider ─────────────────────────────────────────────────────
function PrintInfiniteSlider({ currentId }: { currentId: number }) {
  const { data: rawAll } = useListArtworks({ available: true } as any);
  const all = Array.isArray(rawAll) ? (rawAll as ArtworkWithTags[]) : [];
  const prints = all.filter(a => a.category === "print" && a.featured && a.id !== currentId);
  const [isPaused, setIsPaused] = useState(false);
  const [activeTilt, setActiveTilt] = useState<{ idx: number; rx: number; ry: number } | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current); }, []);
  if (prints.length === 0) return null;
  const doubled = [...prints, ...prints];
  const cardWidth = 260; const gap = 24;
  const totalWidth = prints.length * (cardWidth + gap);
  const duration = prints.length * 10;

  const pauseAndScheduleResume = () => {
    setIsPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => { setIsPaused(false); setActiveTilt(null); }, 4000);
  };

  const handleTrackMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    pauseAndScheduleResume();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const cardEl = el?.closest("[data-card-idx]") as HTMLElement | null;
    if (!cardEl) { setActiveTilt(null); return; }
    const idx = parseInt(cardEl.dataset.cardIdx || "0", 10);
    const rect = cardEl.getBoundingClientRect();
    const ry = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 9;
    const rx = -((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * 5;
    setActiveTilt({ idx, rx, ry });
  };

  const handleTrackMouseLeave = () => { setActiveTilt(null); pauseAndScheduleResume(); };

  return (
    <section className="mt-24 pt-16 border-t border-border overflow-hidden">
      <style>{`
        @keyframes infiniteScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-${totalWidth}px)} }
        .slider-track { animation: infiniteScroll ${duration}s linear infinite; will-change: transform; }
        .slider-track.paused { animation-play-state: paused; }
      `}</style>
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">Fine Art Prints</p>
        <h2 className="font-serif text-3xl">You May Also Like</h2>
      </div>
      <div className="relative select-none" onMouseMove={handleTrackMouseMove} onMouseLeave={handleTrackMouseLeave}>
        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to right, hsl(var(--background)), transparent)" }} />
        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 pointer-events-none" style={{ background: "linear-gradient(to left, hsl(var(--background)), transparent)" }} />
        <div className={`slider-track flex${isPaused ? " paused" : ""}`} style={{ gap: `${gap}px` }}>
          {doubled.map((artwork, idx) => {
            const prices = parsePrintPrices(artwork.dimensions);
            const fromPrice = prices ? Math.min(prices.A5, prices.A4, prices.A3) : artwork.price;
            const isActive = activeTilt?.idx === idx;
            const rx = isActive ? activeTilt!.rx : 0; const ry = isActive ? activeTilt!.ry : 0;
            return (
              <div key={`${artwork.id}-${idx}`} data-card-idx={idx} className="flex-shrink-0" style={{ width: `${cardWidth}px` }}>
                <Link href={`/artwork/${artwork.id}`} onClick={() => saveScrollPosition(window.location.pathname)} className="group block"
                  style={{ display: "block", transform: `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${isActive ? 1.03 : 1})`, transition: "transform 0.6s ease-out" }}>
                  <div className="relative overflow-hidden bg-muted" style={{ height: `${Math.round(cardWidth * 4 / 3)}px` }}>
                    <img src={artwork.imageUrl} alt={artwork.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105" loading="lazy" draggable={false} style={{ pointerEvents: "none" }} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
                  </div>
                  <div className="mt-4 flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base leading-tight group-hover:italic transition-all duration-300 truncate">{artwork.title}</h3>
                      <p className="text-muted-foreground text-xs mt-1">Fine Art Print</p>
                    </div>
                    <p className="text-sm font-medium tracking-wide flex-shrink-0 whitespace-nowrap">From ${fromPrice.toLocaleString()}</p>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Related Originals ─────────────────────────────────────────────────────────
function RelatedOriginals({ currentId, currentTags }: { currentId: number; currentTags: string[] }) {
  const { data: rawAll } = useListArtworks({ available: true } as any);
  const all = Array.isArray(rawAll) ? (rawAll as ArtworkWithTags[]) : [];
  const related = all.filter(a => a.id !== currentId && a.category !== "print")
    .map(a => ({ ...a, overlap: (a.tags || []).filter(t => currentTags.includes(t)).length }))
    .sort((a, b) => b.overlap - a.overlap).slice(0, 4);
  if (related.length === 0) return null;
  return (
    <section className="mt-24 pt-16 border-t border-border">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground mb-2">You may also like</p>
        <h2 className="font-serif text-3xl">Related Works</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-14">
        {related.map((artwork, i) => (
          <Link key={artwork.id} href={`/artwork/${artwork.id}`} onClick={() => saveScrollPosition(window.location.pathname)} className="group block">
            <div className="relative overflow-hidden bg-muted animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${i * 150}ms` }}>
              <div className="aspect-[3/4]">
                <img src={artwork.imageUrl} alt={artwork.title} loading="lazy" className="object-cover w-full h-full transition-transform duration-700 ease-out group-hover:scale-105" />
              </div>
              {!artwork.available && <div className="absolute top-4 left-4 bg-black/70 text-white px-5 py-2 text-sm uppercase tracking-widest font-medium">Sold</div>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
            <div className="mt-4 flex justify-between items-baseline gap-2">
              <div className="min-w-0">
                <h3 className="font-serif text-lg group-hover:italic transition-all duration-300 truncate">{artwork.title}</h3>
                <p className="text-muted-foreground text-sm mt-1">{artwork.medium}, {artwork.year}</p>
              </div>
              <p className="text-sm font-medium tracking-wide flex-shrink-0">${artwork.price.toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Print Size Selector ───────────────────────────────────────────────────────
function PrintSizeSelector({ prices, selected, onChange }: { prices: PrintPrices; selected: PrintSize; onChange: (s: PrintSize) => void }) {
  return (
    <div className="mb-8">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Select Size</p>
      <div className="flex gap-3">
        {(["A5", "A4", "A3"] as PrintSize[]).map(size => {
          const isSelected = selected === size;
          return (
            <button key={size} onClick={() => onChange(size)}
              className={`flex-1 py-3 px-2 border text-center transition-all duration-200 ${isSelected ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/60 text-muted-foreground hover:text-foreground"}`}>
              <div className={`text-sm font-medium uppercase tracking-widest ${isSelected ? "text-background" : ""}`}>{PRINT_SIZE_LABELS[size].label}</div>
              <div className={`text-xs mt-0.5 ${isSelected ? "text-background/70" : "text-muted-foreground"}`}>{PRINT_SIZE_LABELS[size].sub}</div>
              <div className={`text-sm font-medium mt-1 ${isSelected ? "text-background" : "text-foreground"}`}>${prices[size].toLocaleString()}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Quantity Selector (chỉ cho Print) ────────────────────────────────────────
function QuantitySelector({ value, onChange, max }: { value: number; onChange: (n: number) => void; max?: number }) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quantity</p>
      <div className="flex items-center border border-border w-fit">
        <button
          onClick={() => onChange(Math.max(1, value - 1))}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Minus size={14} strokeWidth={1.5} />
        </button>
        <span className="w-12 text-center text-sm font-medium tabular-nums">{value}</span>
        <button
          onClick={() => onChange(max ? Math.min(max, value + 1) : value + 1)}
          className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          disabled={max !== undefined && value >= max}
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      </div>
      {max !== undefined && value >= max && (
        <p className="text-xs text-amber-500 mt-2">Maximum available quantity reached</p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ArtworkDetail() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [activeIndex, setActiveIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<PrintSize>("A5");
  const [quantity, setQuantity] = useState(1);
  const { addItem, items } = useCart();
  useScrollToTop();

  const { data: artwork, isLoading, isError } = useGetArtwork(id, {
    query: { enabled: !!id, queryKey: getGetArtworkQueryKey(id) },
  });

  // Reset quantity khi đổi size
  useEffect(() => { setQuantity(1); }, [selectedSize]);

  if (isError) return <NotFound />;
  if (isLoading || !artwork) {
    return (
      <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          <div className="lg:col-span-7"><Skeleton className="w-full aspect-[3/4] rounded-none" /></div>
          <div className="lg:col-span-5 space-y-8 pt-8">
            <Skeleton className="w-3/4 h-12" /><Skeleton className="w-1/2 h-6" />
            <Skeleton className="w-full h-32" /><Skeleton className="w-full h-12" />
          </div>
        </div>
      </main>
    );
  }

  const artworkWithTags = artwork as unknown as ArtworkWithTags;
  const allImages = [artwork.imageUrl, ...(artwork.detailImages || [])];
  const activeImage = allImages[activeIndex] ?? artwork.imageUrl;
  const thumbnailLabels = ["Overview", "Framed", "Detail 1", "Detail 2", "Detail 3", "Detail 4"];
  const isPrint = artwork.category === "print";
  const printPrices = isPrint ? parsePrintPrices(artworkWithTags.dimensions) : null;
  const unitPrice = printPrices ? printPrices[selectedSize] : artwork.price;
  const displayPrice = isPrint ? unitPrice * quantity : artwork.price;

  // Edition info
  const editionTotal = artworkWithTags.editionTotal ?? 50;
  const editionSold = artworkWithTags.editionSold ?? 0;
  const editionRemaining = editionTotal - editionSold;
  const isSoldOut = isPrint && editionRemaining <= 0;

  const cartId = isPrint
    ? artwork.id * 10 + (selectedSize === "A5" ? 1 : selectedSize === "A4" ? 2 : 3)
    : artwork.id;
  const alreadyInCart = items.some(i => i.artworkId === cartId);

  const handleThumbnailClick = (index: number) => {
    if (index === activeIndex) return;
    setActiveIndex(index); setAnimKey(prev => prev + 1);
  };

  return (
    <main className="w-full pt-32 pb-24 px-6 md:px-12 min-h-screen">
      <style>{`
        @keyframes slideInFromLeft { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        .slide-in-image { animation: slideInFromLeft 0.4s cubic-bezier(.25,.46,.45,.94) forwards; }
      `}</style>

      {lightboxOpen && <Lightbox images={allImages} initialIndex={activeIndex} onClose={() => setLightboxOpen(false)} />}

      <div className="container mx-auto">
        <button onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-12 animate-in fade-in slide-in-from-left-4 duration-500">
          <ArrowLeft size={16} strokeWidth={1} /> Back to Gallery
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 items-start">
          {/* Image Column */}
          <div className="lg:col-span-7 lg:sticky lg:top-32 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative bg-muted overflow-hidden w-[55%] mx-auto aspect-[3/4] cursor-zoom-in group" onClick={() => setLightboxOpen(true)}>
              {(isSoldOut || !artwork.available) && (
                <div className="absolute top-3 left-3 z-10 bg-black/80 text-white text-xs uppercase tracking-widest px-3 py-1.5 font-medium">
                  {isSoldOut ? "Sold Out" : "Sold"}
                </div>
              )}
              <img key={animKey} src={activeImage} alt={artwork.title} className="absolute inset-0 w-full h-full object-contain slide-in-image" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn size={28} strokeWidth={1} className="text-white opacity-0 group-hover:opacity-80 transition-opacity duration-300 drop-shadow-lg" />
              </div>
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center">
                {allImages.map((img, i) => {
                  const isActive = activeIndex === i;
                  return (
                    <button key={i} onClick={() => handleThumbnailClick(i)}
                      className={`relative flex-shrink-0 w-16 h-16 bg-muted overflow-hidden transition-all duration-300 border-2 ${isActive ? "border-foreground" : "border-transparent hover:border-foreground/30"}`}
                      title={thumbnailLabels[i] || `Image ${i + 1}`}>
                      <img src={img} alt={`${artwork.title} — ${thumbnailLabels[i] || i + 1}`}
                        className={`w-full h-full object-cover transition-all duration-300 ${isActive ? "scale-105" : "hover:scale-105"}`} />
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-foreground transition-transform duration-300 origin-left ${isActive ? "scale-x-100" : "scale-x-0"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="lg:col-span-5 flex flex-col pt-4 lg:pt-12 animate-in fade-in slide-in-from-right-8 duration-700 delay-200 fill-mode-both">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground">
                {isPrint ? "Fine Art Print" : artwork.category}
              </span>
              {isSoldOut && <span className="text-xs uppercase tracking-widest bg-red-500/10 text-red-500 px-2 py-0.5">Sold Out</span>}
              {!artwork.available && !isSoldOut && <span className="text-xs uppercase tracking-widest bg-muted text-muted-foreground px-2 py-0.5">Sold</span>}
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight mb-4">{artwork.title}</h1>

            {/* Giá — nhân quantity nếu là print */}
            <p className="text-2xl font-light tracking-wide mb-8 transition-all duration-200">
              ${displayPrice.toLocaleString()}
              {isPrint && quantity > 1 && (
                <span className="text-sm text-muted-foreground ml-2">
                  ({quantity} × ${unitPrice.toLocaleString()})
                </span>
              )}
              {isPrint && quantity === 1 && (
                <span className="text-sm text-muted-foreground ml-2">
                  — {PRINT_SIZE_LABELS[selectedSize].label} ({PRINT_SIZE_LABELS[selectedSize].sub})
                </span>
              )}
            </p>

            <div className="h-px w-full bg-border mb-8" />

            {isPrint && printPrices && (
              <PrintSizeSelector prices={printPrices} selected={selectedSize} onChange={s => { setSelectedSize(s); setQuantity(1); }} />
            )}

            <div className="grid grid-cols-2 gap-y-4 text-sm mb-12">
              <div className="text-muted-foreground">Medium</div>
              <div className="font-medium text-right">{artwork.medium}</div>
              {!isPrint && (
                <>
                  <div className="text-muted-foreground">Dimensions</div>
                  <div className="font-medium text-right">{artwork.dimensions}</div>
                </>
              )}
              <div className="text-muted-foreground">Year</div>
              <div className="font-medium text-right">{artwork.year}</div>
              {/* Edition info cho Print */}
              {isPrint && (
                <>
                  <div className="text-muted-foreground">Edition</div>
                  <div className={`font-medium text-right ${editionRemaining <= 5 && editionRemaining > 0 ? "text-amber-500" : ""}`}>
                    {editionRemaining > 0 ? `${editionRemaining}/${editionTotal} remaining` : "Sold Out"}
                  </div>
                </>
              )}
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium text-right">
                {isSoldOut
                  ? <span className="text-red-400">Sold Out</span>
                  : artwork.available
                    ? <span className="text-green-600 dark:text-green-400">Available</span>
                    : <span className="text-red-400">Sold</span>}
              </div>
            </div>

            <div className="prose prose-sm dark:prose-invert font-light leading-relaxed text-muted-foreground mb-12">
              <p>{artwork.description}</p>
            </div>

            {/* Buttons */}
            {(artwork.available && !isSoldOut) ? (
              <div className="space-y-3">
                {/* Quantity selector — chỉ cho Print */}
                {isPrint && (
                  <QuantitySelector
                    value={quantity}
                    onChange={setQuantity}
                    max={editionRemaining}
                  />
                )}

                <button
                  onClick={() => {
                    if (!alreadyInCart) {
                      addItem({
                        artworkId: cartId,
                        title: isPrint ? `${artwork.title} (${selectedSize})` : artwork.title,
                        price: unitPrice,
                        imageUrl: artwork.imageUrl,
                        medium: isPrint
                          ? `Fine Art Print — ${selectedSize} (${PRINT_SIZE_LABELS[selectedSize].sub})`
                          : artwork.medium,
                      }, isPrint ? quantity : 1);
                    }
                    setAddedToCart(true);
                    setTimeout(() => setAddedToCart(false), 2000);
                  }}
                  className={`w-full py-4 px-6 text-center text-sm uppercase tracking-widest font-medium transition-all duration-300 flex items-center justify-center gap-3 ${
                    addedToCart || alreadyInCart
                      ? "bg-green-600 text-white"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  {addedToCart || alreadyInCart
                    ? <><Check size={16} strokeWidth={2} /> Added to Cart</>
                    : <><ShoppingBag size={16} strokeWidth={1.5} /> Add to Cart</>}
                </button>

                {(addedToCart || alreadyInCart) && (
                  <button onClick={() => window.history.back()}
                    className="w-full py-3 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" strokeWidth={1} /> Continue Shopping
                  </button>
                )}
                <Link href={`/contact?inquiry=Artwork: ${artwork.title}`}
                  className="w-full py-3 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group">
                  Inquire Directly <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-full py-4 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground">
                  {isSoldOut ? "This edition is sold out" : "This work has been sold"}
                </div>
                <Link href={`/contact?inquiry=Commission similar to: ${artwork.title}`}
                  className="w-full py-3 px-6 border border-border text-center text-sm uppercase tracking-widest text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-3 group">
                  Request Similar Work <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" strokeWidth={1} />
                </Link>
              </div>
            )}
          </div>
        </div>

        {isPrint
          ? <PrintInfiniteSlider currentId={artwork.id} />
          : <RelatedOriginals currentId={artwork.id} currentTags={artworkWithTags.tags || []} />
        }
      </div>
    </main>
  );
}
