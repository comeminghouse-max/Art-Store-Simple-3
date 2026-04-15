const DOMAIN = "https://ca7d2e55-8cda-4bcc-a7c7-c34bb5591aea-00-3mrritpnjm4h0.kirk.replit.dev";

const artworks = [
  { id: 1, title: "Bloom", medium: "Oil on linen", year: 2024, price: 1950, imageUrl: `${DOMAIN}/images/artwork6.png`, available: true },
  { id: 2, title: "The Dark Wood", medium: "Oil on canvas", year: 2024, price: 2100, imageUrl: `${DOMAIN}/images/artwork5.png`, available: true },
  { id: 3, title: "Primary Study No. 3", medium: "Acrylic on panel", year: 2023, price: 1500, imageUrl: `${DOMAIN}/images/artwork4.png`, available: true },
  { id: 4, title: "Morning Shore", medium: "Oil on linen", year: 2024, price: 1800, imageUrl: `${DOMAIN}/images/artwork2.png`, available: true },
  { id: 5, title: "Tidal Memory", medium: "Oil on canvas", year: 2024, price: 2400, imageUrl: `${DOMAIN}/images/artwork1.png`, available: true },
];

export function Editorial() {
  const [featured] = artworks;
  const rest = artworks.slice(1);

  return (
    <div className="min-h-screen bg-[#f5f2ee] px-8 pt-16 pb-20 font-sans">
      {/* Header */}
      <div className="mb-14">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-3">Gallery / Original Works</p>
        <h1 className="font-serif text-5xl text-stone-900 leading-tight">Original Works</h1>
      </div>

      {/* Featured hero + sidebar grid */}
      <div className="flex gap-6 mb-6">
        {/* Featured piece — large */}
        <div className="flex-[2] group cursor-pointer">
          <div className="relative overflow-hidden bg-stone-200" style={{ aspectRatio: "4/3" }}>
            <img
              src={featured.imageUrl}
              alt={featured.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
              style={{ transform: "scale(1)", transition: "transform 700ms ease" }}
              onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.03)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
              <span className="text-white/80 text-xs uppercase tracking-widest">Featured</span>
            </div>
          </div>
          <div className="mt-5 flex justify-between items-baseline">
            <div>
              <h2 className="font-serif text-2xl text-stone-900">{featured.title}</h2>
              <p className="text-stone-400 text-sm mt-1">{featured.medium}, {featured.year}</p>
            </div>
            <p className="text-stone-700 font-medium">${featured.price.toLocaleString()}</p>
          </div>
        </div>

        {/* Supporting 2-up column */}
        <div className="flex-[1] flex flex-col gap-6">
          {rest.slice(0, 2).map((art) => (
            <div key={art.id} className="group cursor-pointer flex-1">
              <div className="relative overflow-hidden bg-stone-200 h-full min-h-[180px]">
                <img
                  src={art.imageUrl}
                  alt={art.title}
                  className="w-full h-full object-cover"
                  style={{ transform: "scale(1)", transition: "transform 700ms ease" }}
                  onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                  onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
                />
              </div>
              <div className="mt-3 flex justify-between items-baseline">
                <div>
                  <h3 className="font-serif text-base text-stone-900 group-hover:italic transition-all">{art.title}</h3>
                  <p className="text-stone-400 text-xs mt-0.5">{art.medium}</p>
                </div>
                <p className="text-stone-600 text-sm">${art.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row — 3 equal */}
      <div className="grid grid-cols-3 gap-6">
        {rest.slice(2).map((art) => (
          <div key={art.id} className="group cursor-pointer">
            <div className="relative overflow-hidden bg-stone-200" style={{ aspectRatio: "3/4" }}>
              <img
                src={art.imageUrl}
                alt={art.title}
                className="w-full h-full object-cover"
                style={{ transform: "scale(1)", transition: "transform 700ms ease" }}
                onMouseEnter={e => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={e => (e.currentTarget.style.transform = "scale(1)")}
              />
            </div>
            <div className="mt-4 flex justify-between items-baseline">
              <div>
                <h3 className="font-serif text-lg text-stone-900 group-hover:italic transition-all">{art.title}</h3>
                <p className="text-stone-400 text-xs mt-1">{art.medium}, {art.year}</p>
              </div>
              <p className="text-stone-600 text-sm font-medium">${art.price.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Label */}
      <div className="mt-16 pt-8 border-t border-stone-200 flex justify-between items-center">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-300">Variant A</p>
        <p className="text-xs text-stone-400 italic">Editorial — size hierarchy, featured + supporting</p>
      </div>
    </div>
  );
}
