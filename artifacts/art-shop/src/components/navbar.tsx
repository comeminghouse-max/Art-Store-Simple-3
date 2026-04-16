import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, ShoppingBag, LogIn, LogOut, User } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { useCart } from "@/context/cart-context";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const galleryItems = [
  { href: "/gallery/original", label: "Original", description: "One-of-a-kind paintings" },
  { href: "/gallery/commission", label: "Commission", description: "Custom work, made for you" },
  { href: "/gallery/print", label: "Print", description: "Fine art reproduction prints" },
];

export function Navbar() {
  const [location] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const galleryRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { count, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
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
    <>
      <header
        className={cn(
          "fixed top-0 w-full z-50 transition-all duration-500",
          isScrolled
            ? "bg-background/90 backdrop-blur-md border-b border-border/50 py-4"
            : "bg-transparent py-6"
        )}
      >
        <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl tracking-tight relative z-50">
            STUDIO
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8 items-center">
            <Link href="/" className={cn("text-sm tracking-wide uppercase transition-colors hover:text-foreground/70", location === "/" ? "text-foreground font-medium" : "text-muted-foreground")}>
              Home
            </Link>

            <div ref={galleryRef} className="relative" onMouseEnter={handleGalleryEnter} onMouseLeave={handleGalleryLeave}>
              <button className={cn("flex items-center gap-1 text-sm tracking-wide uppercase transition-colors hover:text-foreground/70", isGalleryActive ? "text-foreground font-medium" : "text-muted-foreground")}>
                Gallery
                <ChevronDown size={14} strokeWidth={1.5} className={cn("transition-transform duration-200", galleryOpen ? "rotate-180" : "rotate-0")} />
              </button>
              <div className={cn("absolute top-full left-1/2 -translate-x-1/2 pt-4 transition-all duration-200", galleryOpen ? "opacity-100 pointer-events-auto translate-y-0" : "opacity-0 pointer-events-none -translate-y-1")}>
                <div className="bg-background border border-border/60 shadow-lg min-w-[200px] py-2">
                  {galleryItems.map((item) => (
                    <Link key={item.href} href={item.href} onClick={() => setGalleryOpen(false)}
                      className={cn("flex flex-col px-5 py-3 hover:bg-muted/60 transition-colors group", location === item.href && "bg-muted/40")}>
                      <span className={cn("text-sm uppercase tracking-widest font-medium", location === item.href ? "text-foreground" : "text-foreground group-hover:text-foreground")}>
                        {item.label}
                      </span>
                      <span className="text-xs text-muted-foreground mt-0.5">{item.description}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <Link href="/about" className={cn("text-sm tracking-wide uppercase transition-colors hover:text-foreground/70", location === "/about" ? "text-foreground font-medium" : "text-muted-foreground")}>
              About
            </Link>
            <Link href="/contact" className={cn("text-sm tracking-wide uppercase transition-colors hover:text-foreground/70", location === "/contact" ? "text-foreground font-medium" : "text-muted-foreground")}>
              Contact
            </Link>

            {/* Cart */}
            <button onClick={openCart} className="relative text-muted-foreground hover:text-foreground transition-colors" aria-label="Open cart">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center font-medium">
                  {count}
                </span>
              )}
            </button>

            {/* User menu */}
            {isLoaded && (
              <Show when="signed-in">
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {user?.imageUrl ? (
                      <img src={user.imageUrl} alt={user.fullName || "User"} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <User size={20} strokeWidth={1.5} />
                    )}
                  </button>
                  {userMenuOpen && (
                    <div className="absolute top-full right-0 pt-3">
                      <div className="bg-background border border-border/60 shadow-lg min-w-[160px] py-2">
                        <div className="px-4 py-2 border-b border-border/40 mb-1">
                          <p className="text-xs font-medium truncate">{user?.fullName || user?.primaryEmailAddress?.emailAddress}</p>
                        </div>
                        <button
                          onClick={() => { signOut(); setUserMenuOpen(false); }}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                        >
                          <LogOut size={14} strokeWidth={1.5} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Show>
            )}

            {isLoaded && (
              <Show when="signed-out">
                <Link href="/sign-in" className="flex items-center gap-1.5 text-sm uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
                  <LogIn size={16} strokeWidth={1.5} />
                  Sign in
                </Link>
              </Show>
            )}
          </nav>

          {/* Mobile right side */}
          <div className="flex items-center gap-4 md:hidden z-[51] relative">
            <button onClick={openCart} className="relative text-foreground" aria-label="Open cart">
              <ShoppingBag size={20} strokeWidth={1.5} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 w-4 h-4 bg-foreground text-background text-[9px] rounded-full flex items-center justify-center font-medium">
                  {count}
                </span>
              )}
            </button>
            <button
              className="text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? <X size={24} strokeWidth={1} /> : <Menu size={24} strokeWidth={1} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-background z-[49] flex flex-col items-center justify-center gap-6 transition-opacity duration-300 md:hidden",
          mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      >
        <Link href="/" onClick={() => setMobileMenuOpen(false)} className={cn("text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70", location === "/" ? "text-foreground italic" : "text-muted-foreground")}>
          Home
        </Link>
        <div className="flex flex-col items-center gap-2">
          <span className="text-xl font-serif text-muted-foreground tracking-tight">Gallery</span>
          <div className="flex flex-col items-center gap-1">
            {galleryItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                className={cn("text-lg font-serif tracking-tight transition-colors hover:text-foreground/70", location === item.href ? "text-foreground italic" : "text-muted-foreground")}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
        <Link href="/about" onClick={() => setMobileMenuOpen(false)} className={cn("text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70", location === "/about" ? "text-foreground italic" : "text-muted-foreground")}>
          About
        </Link>
        <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className={cn("text-3xl font-serif tracking-tight transition-colors hover:text-foreground/70", location === "/contact" ? "text-foreground italic" : "text-muted-foreground")}>
          Contact
        </Link>

        {/* Mobile auth */}
        <Show when="signed-out">
          <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 text-xl font-serif text-muted-foreground hover:text-foreground transition-colors">
            <LogIn size={18} strokeWidth={1.5} />
            Sign in
          </Link>
        </Show>
        <Show when="signed-in">
          <button
            onClick={() => { signOut(); setMobileMenuOpen(false); }}
            className="flex items-center gap-2 text-xl font-serif text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Sign out
          </button>
        </Show>
      </div>
    </>
  );
}
