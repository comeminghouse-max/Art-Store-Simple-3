import { useState } from "react";

const DOMAIN = "https://ca7d2e55-8cda-4bcc-a7c7-c34bb5591aea-00-3mrritpnjm4h0.kirk.replit.dev";

const artworks = [
  { id: 1, title: "Bloom", medium: "Oil on linen", year: 2024, price: 1950, imageUrl: `${DOMAIN}/images/artwork6.png` },
  { id: 2, title: "The Dark Wood", medium: "Oil on canvas", year: 2024, price: 2100, imageUrl: `${DOMAIN}/images/artwork5.png` },
  { id: 3, title: "Primary Study No. 3", medium: "Acrylic on panel", year: 2023, price: 1500, imageUrl: `${DOMAIN}/images/artwork4.png` },
  { id: 4, title: "Morning Shore", medium: "Oil on linen", year: 2024, price: 1800, imageUrl: `${DOMAIN}/images/artwork2.png` },
  { id: 5, title: "Tidal Memory", medium: "Oil on canvas", year: 2024, price: 2400, imageUrl: `${DOMAIN}/images/artwork1.png` },
  { id: 6, title: "Golden Hour", medium: "Oil on canvas", year: 2023, price: 3200, imageUrl: `${DOMAIN}/images/artwork3.png` },
];

export function DarkRoom() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: "#111010" }}>
      {/* Header */}
      <div className="px-10 pt-12 pb-10">
        <p className="text-[10px] uppercase tracking-[0.3em] mb-3" style={{ color: "#555" }}>Gallery / Original Works</p>
        <h1 className="font-serif text-4xl" style={{ color: "#e8e4df" }}>Original Works</h1>
      </div>

      {/* Grid */}
      <div className="px-10 pb-10 grid grid-cols-3 gap-3">
        {artworks.map((art) => (
          <div
            key={art.id}
            className="relative cursor-pointer"
            style={{ aspectRatio: "3/4" }}
            onMouseEnter={() => setHovered(art.id)}
            onMouseLeave={() => setHovered(null)}
          >
            {/* Image */}
            <img
              src={art.imageUrl}
              alt={art.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{
                filter: hovered === art.id ? "brightness(0.5)" : "brightness(0.85)",
                transition: "filter 500ms ease, transform 600ms ease",
                transform: hovered === art.id ? "scale(1.03)" : "scale(1)"
              }}
            />

            {/* Ambient glow on hover */}
            {hovered === art.id && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: "inset 0 0 60px rgba(255,255,255,0.04)",
                }}
              />
            )}

            {/* Metadata — only visible on hover */}
            <div
              className="absolute inset-0 flex flex-col justify-end p-5"
              style={{
                opacity: hovered === art.id ? 1 : 0,
                transition: "opacity 350ms ease",
              }}
            >
              <h3
                className="font-serif text-xl mb-1"
                style={{ color: "#f0ece7" }}
              >
                {art.title}
              </h3>
              <p className="text-xs mb-3" style={{ color: "#888" }}>
                {art.medium}, {art.year}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: "#c9c0b6" }}>
                  ${art.price.toLocaleString()}
                </p>
                <span
                  className="text-[10px] uppercase tracking-widest pb-0.5"
                  style={{ color: "#888", borderBottom: "1px solid #555" }}
                >
                  View
                </span>
              </div>
            </div>

            {/* Subtle number always visible */}
            <div
              className="absolute top-4 left-4 text-[10px] uppercase tracking-widest transition-opacity duration-300"
              style={{
                color: "#444",
                opacity: hovered === art.id ? 0 : 1,
              }}
            >
              {String(art.id).padStart(2, "0")}
            </div>
          </div>
        ))}
      </div>

      {/* Label */}
      <div
        className="px-10 py-6 flex justify-between items-center"
        style={{ borderTop: "1px solid #222" }}
      >
        <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: "#333" }}>Variant C</p>
        <p className="text-xs italic" style={{ color: "#444" }}>Dark Room — immersive, metadata on hover only</p>
      </div>
    </div>
  );
}
