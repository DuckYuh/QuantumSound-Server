import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const genres = [
    { name: "Pop", slug: "pop" },
    { name: "Rock", slug: "rock" },
    { name: "Hip Hop", slug: "hip-hop" },
    { name: "Rap", slug: "rap" },
    { name: "Trap", slug: "trap" },
    { name: "R&B", slug: "rnb" },
    { name: "Jazz", slug: "jazz" },
    { name: "Blues", slug: "blues" },
    { name: "Electronic", slug: "electronic" },
    { name: "House", slug: "house" },
    { name: "Techno", slug: "techno" },
    { name: "Dubstep", slug: "dubstep" },
    { name: "Metal", slug: "metal" },
    { name: "Punk", slug: "punk" },
    { name: "Indie", slug: "indie" },
    { name: "Alternative", slug: "alternative" },
    { name: "Lo-fi", slug: "lo-fi" },
    { name: "Ambient", slug: "ambient" },
    { name: "Classical", slug: "classical" },
    { name: "Country", slug: "country" },
    { name: "Folk", slug: "folk" },
    { name: "Soul", slug: "soul" },
    { name: "Funk", slug: "funk" },
    { name: "Reggae", slug: "reggae" },
    { name: "V-pop", slug: "v-pop" },
    { name: "C-pop", slug: "c-pop" },
    { name: "K-pop", slug: "k-pop" },
    { name: "J-pop", slug: "j-pop" },
    { name: "USUK", slug: "usuk" },
    { name: "Latin", slug: "latin" },
    { name: "Acoustic", slug: "acoustic" },
    { name: "Instrumental", slug: "instrumental" },
    { name: "Soundtrack", slug: "soundtrack" }
  ];

  await prisma.genre.createMany({
    data: genres,
    skipDuplicates: true,
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());