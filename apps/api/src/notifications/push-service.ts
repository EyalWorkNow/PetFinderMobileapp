import { Expo } from "expo-server-sdk";
import type { AppConfig } from "../config";
import type { Repository } from "../db/repository";

export interface HighMatchNotificationInput {
  userId: string;
  matchId: string;
  score: number;
  counterpartPostId: string;
}

export class PushNotificationService {
  private readonly expo = new Expo();

  constructor(
    private readonly repository: Repository,
    private readonly config: AppConfig
  ) {}

  async notifyHighMatch(input: HighMatchNotificationInput): Promise<boolean> {
    if (!this.config.EXPO_PUSH_ENABLED) {
      return false;
    }

    const sentInLastDay = await this.repository.countPushDeliveriesInLast24h(input.userId);
    if (sentInLastDay >= this.config.PUSH_MAX_PER_DAY) {
      return false;
    }

    const tokens = await this.repository.listPushTokens(input.userId);
    const validTokens = tokens
      .map((entry) => entry.expoToken)
      .filter((token) => Expo.isExpoPushToken(token));

    if (validTokens.length === 0) {
      return false;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      title: "High match found",
      body: `We found a ${Math.round(input.score * 100)}% match for one of your posts.`,
      data: {
        matchId: input.matchId,
        counterpartPostId: input.counterpartPostId,
        score: input.score
      }
    }));

    const chunks = this.expo.chunkPushNotifications(messages);
    let delivered = false;

    for (const chunk of chunks) {
      const tickets = await this.expo.sendPushNotificationsAsync(chunk);
      if (tickets.some((ticket) => ticket.status === "ok")) {
        delivered = true;
      }
    }

    if (delivered) {
      await this.repository.recordPushDelivery({ userId: input.userId, matchId: input.matchId });
    }

    return delivered;
  }
}
