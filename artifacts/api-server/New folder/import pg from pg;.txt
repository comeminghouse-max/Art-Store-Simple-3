import pg from "pg";

const client = new pg.Client({
  connectionString: "postgresql://postgres:password@localhost:5432/artshop"
});

await client.connect();

const artworks = [
  {
    title: "Sunset Over Mountains",
    description: "A beautiful sunset painting with warm orange and red tones.",
    category: "original",
    price: "1200.00",
    image_url: "/assets/artwork1.png",
    detail_images: "[]",
    available: true,
    year: 2024,
    dimensions: "60x80cm",
    medium: "Oil on canvas",
    featured: true
  },
  {
    title: "Abstract Flow",
    description: "Dynamic abstract composition with flowing lines and colors.",
    category: "original",
    price: "950.00",
    image_url: "/assets/artwork2.png",
    detail_images: "[]",
    available: true,
    year: 2024,
    dimensions: "50x70cm",
    medium: "Acrylic on canvas",
    featured: false
  },
  {
    title: "Forest Path",
    description: "A serene forest path bathed in morning light.",
    category: "original",
    price: "1500.00",
    image_url: "/assets/artwork5.png",
    detail_images: "[]",
    available: true,
    year: 2023,
    dimensions: "70x90cm",
    medium: "Oil on canvas",
    featured: true
  },
  {
    title: "Floral Bouquet",
    description: "Vibrant flowers in a classic vase composition.",
    category: "original",
    price: "800.00",
    image_url: "/assets/artwork6.png",
    detail_images: "[]",
    available: true,
    year: 2024,
    dimensions: "40x50cm",
    medium: "Oil on canvas",
    featured: false
  },
  {
    title: "Mondrian Study",
    description: "A modern geometric composition inspired by Dutch masters.",
    category: "print",
    price: "300.00",
    image_url: "/assets/artwork4.png",
    detail_images: "[]",
    available: true,
    year: 2023,
    dimensions: "50x50cm",
    medium: "Digital print",
    featured: false
  },
  {
    title: "Portrait in Light",
    description: "Expressive portrait capturing natural light and shadow.",
    category: "commission",
    price: "2000.00",
    image_url: "/assets/artwork3.png",
    detail_images: "[]",
    available: true,
    year: 2024,
    dimensions: "60x80cm",
    medium: "Oil on canvas",
    featured: true
  }
];

for (const artwork of artworks) {
  await client.query(
    `INSERT INTO artworks (title, description, category, price, image_url, detail_images, available, year, dimensions, medium, featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
    [artwork.title, artwork.description, artwork.category, artwork.price,
     artwork.image_url, artwork.detail_images, artwork.available,
     artwork.year, artwork.dimensions, artwork.medium, artwork.featured]
  );
}

console.log("Seed data inserted successfully!");
await client.end();