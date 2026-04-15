const DOMAIN = "https://ca7d2e55-8cda-4bcc-a7c7-c34bb5591aea-00-3mrritpnjm4h0.kirk.replit.dev";

const artworks = [
  { id: 1, title: "Bloom", medium: "Oil on linen", year: 2024, price: 1950, dimensions: "70 × 90 cm", imageUrl: `${DOMAIN}/images/artwork6.png`, category: "Still Life" },
  { id: 2, title: "The Dark Wood", medium: "Oil on canvas", year: 2024, price: 2100, dimensions: "90 × 65 cm", imageUrl: `${DOMAIN}/images/artwork5.png`, category: "Landscape" },
  { id: 3, title: "Tidal Memory", medium: "Oil on canvas", year: 2024, price: 2400, dimensions: "80 × 60 cm", imageUrl: `${DOMAIN}/images/artwork1.png`, category: "Abstract" },
  { id: 4, title: "Morning Shore", medium: "Oil on linen", year: 2024, price: 1800, dimensions: "100 × 70 cm", imageUrl: `${DOMAIN}/images/artwork2.png`, category: "Landscape" },
];

export function Cinematic() {
  return (
    <div className="min-h-screen bg-[#f8f6f2] font-sans">
      {/* Header */}
      <div className="px-12 pt-14 pb-12 border-b border-stone-200">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">Gallery / Original Works</p>
        <h1 className="font-serif text-4xl text-stone-900">Original Works</h1>
      </div>

      {/* Cinematic rows */}
      <div>
        {artworks.map((art, i) => (
          <div
            key={art.id}
            className="flex border-b border-stone-100 group cursor-pointer"
            style={{ minHeight: "280px" }}
          >
            {/* Image — alternates side */}
            <div
              className="overflow-hidden bg-stone-100 shrink-0"
              style={{
                width: "52%",
                order: i % 2 === 0 ? 0 : 1,
              }}
            >
              <img
                src={art.imageUrl}
                alt={art.title}
                className="w-full h-full object-cover"
                style={{
                  transform: "scale(1)",
                  transition: "transform 800ms ease",
                  display: "block",
                  minHeight: "280px"
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.04)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              />
            </div>

            {/* Metadata panel */}
            <div
              className="flex flex-col justify-center px-12 py-10 flex-1"
              style={{ order: i % 2 === 0 ? 1 : 0 }}
            >
              <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-4">
                {String(i + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")} — {art.category}
              </p>
              <h2 className="font-serif text-3xl text-stone-900 mb-4 group-hover:italic transition-all duration-300">
                {art.title}
              </h2>
              <div className="space-y-2 mb-8">
                <p className="text-stone-500 text-sm">{art.medium}, {art.year}</p>
                <p className="text-stone-400 text-sm">{art.dimensions}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-serif text-2xl text-stone-900">${art.price.toLocaleString()}</p>
                <span className="text-xs uppercase tracking-[0.2em] text-stone-400 border-b border-stone-300 pb-0.5 group-hover:text-stone-700 group-hover:border-stone-700 transition-colors">
                  Inquire
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Label */}
      <div className="px-12 py-8 flex justify-between items-center">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Variant B</p>
        <p className="text-xs text-stone-400 italic">Cinematic — full-width rows, alternating image/text</p>
      </div>
    </div>
  );
}
