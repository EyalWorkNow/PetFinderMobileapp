import { PostgresRepository } from "../src/db/postgres-repository";
import { appConfig } from "../src/config";
import { PostType, PetType } from "@petfind/shared";

const ISRAEL_CITIES = [
    { name: "Tel Aviv", lat: 32.0853, lng: 34.7818 },
    { name: "Jerusalem", lat: 31.7683, lng: 35.2137 },
    { name: "Haifa", lat: 32.7940, lng: 34.9896 },
    { name: "Rishon LeZion", lat: 31.9730, lng: 34.7925 },
    { name: "Petah Tikva", lat: 32.0840, lng: 34.8878 },
    { name: "Beersheba", lat: 31.2529, lng: 34.7915 },
];

const PET_BREEDS: Record<PetType, string[]> = {
    DOG: ["Golden Retriever", "German Shepherd", "Poodle", "Bulldog", "Beagle"],
    CAT: ["Persian", "Maine Coon", "Siamese", "Ragdoll", "Bengal"],
    PARROT: ["African Grey", "Macaw", "Cockatiel", "Budgie"],
    OTHER: ["Rabbit", "Hamster", "Turtle"],
};

const COLORS = ["Golden", "Black", "White", "Brown", "Grey", "Orange"];

async function run() {
    if (!appConfig.DATABASE_URL) {
        console.error("DATABASE_URL must be set to run the scraper");
        process.exit(1);
    }

    const repo = PostgresRepository.fromConnectionString(appConfig.DATABASE_URL);
    console.log("🚀 Starting Seeder for Supabase...");

    const demoUserId = "demo-israel-seeder";
    await repo.upsertUser({
        id: demoUserId,
        email: "seeder@petfind.me",
    });

    for (let i = 0; i < 50; i++) {
        const city = ISRAEL_CITIES[Math.floor(Math.random() * ISRAEL_CITIES.length)];
        const petType = (["DOG", "CAT", "PARROT", "OTHER"] as PetType[])[Math.floor(Math.random() * 4)];
        const type = (["LOST", "FOUND"] as PostType[])[Math.floor(Math.random() * 2)];
        const breed = PET_BREEDS[petType][Math.floor(Math.random() * PET_BREEDS[petType].length)];

        // Jitter city coordinates within ~5km
        const lat = city.lat + (Math.random() - 0.5) * 0.05;
        const lng = city.lng + (Math.random() - 0.5) * 0.05;

        await repo.createPost({
            userId: demoUserId,
            type,
            petType,
            status: "ACTIVE",
            title: `${type === "LOST" ? "Missing" : "Found"} ${petType}: ${breed}`,
            shortDesc: `Urgent! ${type === "LOST" ? "Lost" : "Found"} near ${city.name}. Very friendly.`,
            size: (["S", "M", "L"] as any)[Math.floor(Math.random() * 3)],
            colors: [COLORS[Math.floor(Math.random() * COLORS.length)]],
            collar: Math.random() > 0.5,
            collarColor: "Red",
            breed,
            lastSeen: {
                lat,
                lng,
                label: `${city.name} Neighborhood`,
            },
            lastSeenTime: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000),
            radiusKm: 5,
            contactMethod: "IN_APP",
            hidePhone: true,
            revealPhoneOnContact: false,
            showApproximateLocation: true,
            photos: [
                { storagePath: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=400" }
            ],
        });

        if (i % 10 === 0) console.log(`✅ Seeded ${i} posts...`);
    }

    console.log("✨ Seeding complete! 50 posts added to Supabase.");
    await repo.close();
}

run().catch((err) => {
    console.error("Failed to seed:", err);
    process.exit(1);
});
