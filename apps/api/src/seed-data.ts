import type { Repository } from "./db/repository";
import type { PostService } from "./services/post-service";

const demoPosts = [
  {
    userId: "demo-user-1",
    payload: {
      type: "LOST",
      petType: "DOG",
      title: "Missing brown beagle",
      shortDesc: "Friendly beagle ran from the park.",
      size: "M",
      colors: ["brown", "white"],
      collar: true,
      collarColor: "red",
      breed: "Beagle",
      marksText: "white patch on chest",
      lastSeen: { lat: 40.7306, lng: -73.9866, label: "Union Square" },
      lastSeenTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      radiusKm: 5,
      photos: [
        {
          storagePath: "demo/beagle-1.jpg",
          takenAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      ],
      sightings: [],
      contactMethod: "IN_APP",
      contactPhone: "+12125550111",
      hidePhone: true,
      revealPhoneOnContact: true,
      showApproximateLocation: true,
      status: "ACTIVE"
    }
  },
  {
    userId: "demo-user-2",
    payload: {
      type: "FOUND",
      petType: "DOG",
      title: "Found beagle near Union Square",
      shortDesc: "Brown/white dog with red collar.",
      size: "M",
      colors: ["brown", "white"],
      collar: true,
      collarColor: "red",
      breed: "Beagle",
      marksText: "white chest patch",
      lastSeen: { lat: 40.7321, lng: -73.988, label: "Near 14th St" },
      lastSeenTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      radiusKm: 4,
      photos: [
        {
          storagePath: "demo/beagle-2.jpg",
          takenAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        }
      ],
      sightings: [
        {
          lat: 40.7315,
          lng: -73.9873,
          label: "Dog run",
          seenAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
          note: "Walking east"
        }
      ],
      contactMethod: "WHATSAPP",
      contactPhone: "+12125550122",
      hidePhone: true,
      revealPhoneOnContact: true,
      showApproximateLocation: true,
      status: "ACTIVE"
    }
  },
  {
    userId: "demo-user-3",
    payload: {
      type: "FOUND",
      petType: "CAT",
      title: "Found gray cat",
      shortDesc: "Calm gray cat hanging near coffee shop.",
      size: "S",
      colors: ["gray"],
      collar: false,
      collarColor: null,
      breed: "Unknown",
      marksText: "striped tail",
      lastSeen: { lat: 40.7422, lng: -73.9927, label: "Chelsea" },
      lastSeenTime: new Date(Date.now() - 10 * 60 * 60 * 1000),
      radiusKm: 3,
      photos: [
        {
          storagePath: "demo/cat-1.jpg",
          takenAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
        }
      ],
      sightings: [],
      contactMethod: "IN_APP",
      contactPhone: null,
      hidePhone: true,
      revealPhoneOnContact: false,
      showApproximateLocation: true,
      status: "ACTIVE"
    }
  }
] as const;

export async function seedDemoData(postService: PostService, repository: Repository): Promise<void> {
  const existing = await repository.listUserPosts("demo-user-1");
  if (existing.length > 0) {
    return;
  }

  for (const entry of demoPosts) {
    await repository.upsertUser({ id: entry.userId });
    await postService.createPost(entry.userId, entry.payload);
  }
}
