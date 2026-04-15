import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const galleryItems = [
  {
    href: "/gallery/original",
    label: "Original",
    description: "One-of-a-kind paintings",
  },
  {
    href: "/gallery/commission",
    label: "Commission",
    description: "Custom work, made for you",
  },
  {
    href: "/gallery/print",
    label: "Print",
    description: "Fine art reproduction prints",
  },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGalleryEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setGalleryOpen(true);
  };

  const handleGalleryLeave = () => {
    timeoutRef.current = setTimeout(() => setGalleryOpen(false), 150);
  };

  const isGalleryActive = location.startsWith("/gallery");

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-500",
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-b border-border/50 py-4"
          : "bg-transparent py-6"
      )}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-tight z-50 relative">
          STUDIO
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-8 items-center">
          <Link
            href="/"
            className={cn(
              "text-sm tracking-wide uppercase transition-colors hover:text-foreground/70",
              location === "/" ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            Home
          </Link>

          {/* Gallery with dropdown */}
          <div
            ref={galleryRef}
            className="relative"
            onMouseEnter={handleGalleryEnter}
            onMouseLeave={handleGalleryLeave}
          >
            <button
              className={cn(
                "flex items-center gap-1 text-sm tracking-wide uppercase transition-colors hover:text-foreground/70",
                isGalleryActive ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              Gallery
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                className={cn(
                  "transition-transform duration-200",
                  galleryOpen ? "rotate-180" : "rotate-0"
                )}
              />
            </button>

            {/* Dropdown */}
            <div
              className={cn(
                "absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200",
                galleryOpen
                  ? "opacity-100 pointer-events-auto translate-y-0"
                  : "opacity-0 pointer-events-none -translate-y-1"
              )}
            >
              <div className="bg-background border border-border/60 shadow-lg min-w-[200px] py-2">
                {galleryItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setGalleryOpen(false)}
                    className={cn(
                      "flex flex-col px-5 py-3 hover:bg-muted/60 transition-colors group",
                      location === item.href && "bg-muted/40"
                    )}
                  >
                    <span
                      className={cn(
                        "text-sm uppercase tracking-widest font-medium transition-colors",
                        location === item.href
                          ? "text-foreground"
                          : "text-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {item.description}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <Link
            href="/about"
            className={cn(
              "text-sm tracking-wide uppercase transition-colors hover:text-foreground/70",
              location === "/about" ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            About
          </Link>

          <Link
            href="/contact"
            className={cn(
              "text-sm tracking-wide uppercase transition-colors hover:text-foreground/70",
              location === "/contact" ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            Contact
          </Link>
        </nav>

        {/* Mobile Toggle */}
        <button
          className="md:hidden z-50 relative text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? (
            <X size={24} strokeWidth={1} />
          ) : (
            <Menu size={24} strokeWidth={1} />
          )}
        </button>

        {/* Mobile Nav */}
        <div
          className={cn(
            "fixed inset-0 bg-background z-40 flex flex-col items-center justify-center gap-6 transition-opacity duration-300 md:hidden",
            mobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          )}
        >
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70",
              location === "/" ? "text-foreground italic" : "text-muted-foreground"
            )}
          >
            Home
          </Link>

          <div className="flex flex-col items-center gap-2">
            <span className="text-xl font-serif text-muted-foreground tracking-tight">Gallery</span>
            <div className="flex flex-col items-center gap-1">
              {galleryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "text-lg font-serif tracking-tight transition-colors hover:text-foreground/70",
                    location === item.href ? "text-foreground italic" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <Link
            href="/about"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70",
              location === "/about" ? "text-foreground italic" : "text-muted-foreground"
            )}
          >
            About
          </Link>

          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className={cn(
              "text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70",
              location === "/contact" ? "text-foreground italic" : "text-muted-foreground"
            )}
          >
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
