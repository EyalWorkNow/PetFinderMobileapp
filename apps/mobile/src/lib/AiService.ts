/**
 * AiService.ts
 * A simulated engine for pet computer vision and matching logic.
 * In a production environment, this would call specialized Vision APIs.
 */

export interface AiPrediction {
    breed: string;
    size: "S" | "M" | "L" | "UNKNOWN";
    primaryColor: string;
    confidence: number;
}

export interface MatchResult {
    postId: string;
    similarity: number; // 0 to 1
    matchedTraits: string[];
}

export const AiService = {
    /**
     * Simulates image analysis to predict pet traits.
     */
    async predictTraits(imageUri: string, petType: string): Promise<AiPrediction> {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (petType === "DOG") {
            return {
                breed: "Golden Retriever Mix",
                size: "M",
                primaryColor: "gold",
                confidence: 0.94
            };
        } else if (petType === "CAT") {
            return {
                breed: "Domestic Shorthair",
                size: "S",
                primaryColor: "orange",
                confidence: 0.88
            };
        }

        return {
            breed: "Mixed Breed",
            size: "M",
            primaryColor: "black",
            confidence: 0.75
        };
    },

    /**
     * Simulates matching a new post against a database of existing posts.
     */
    async findMatches(newPost: any, existingPosts: any[]): Promise<MatchResult[]> {
        return existingPosts
            .map(post => {
                let score = 0;
                const matchedTraits: string[] = [];

                // Simple heuristic matching
                if (post.petType === newPost.petType) {
                    score += 0.3;
                    if (post.breed === newPost.breed) {
                        score += 0.3;
                        matchedTraits.push("Breed");
                    }
                    if (post.size === newPost.size) {
                        score += 0.2;
                        matchedTraits.push("Size");
                    }
                    // Color overlap
                    const colorOverlap = (post.colors || []).filter((c: string) => (newPost.colors || []).includes(c));
                    if (colorOverlap.length > 0) {
                        score += 0.2;
                        matchedTraits.push("Color");
                    }
                }

                return {
                    postId: post.id,
                    similarity: Math.min(score, 1),
                    matchedTraits
                };
            })
            .filter(m => m.similarity > 0.6)
            .sort((a, b) => b.similarity - a.similarity);
    }
};
