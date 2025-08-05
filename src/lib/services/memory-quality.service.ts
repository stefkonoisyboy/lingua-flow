import { IMemoryQualityService } from "../di/interfaces/service.interfaces";
import { Database } from "../types/database.types";

export class MemoryQualityService implements IMemoryQualityService {
  calculateQualityScore(
    source: "human" | "ai_applied" | "ai_generated" | "human_corrected",
    usageCount: number = 0,
    ageInDays: number = 0
  ) {
    // Base quality scores by source
    const baseScores = {
      human: 1.0,
      human_corrected: 0.95,
      ai_applied: 0.8,
      ai_generated: 0.7,
    };

    let qualityScore = baseScores[source];

    // Boost based on usage (frequently used entries are more valuable)
    const usageBoost = Math.min(usageCount * 0.02, 0.1); // Max 10% boost
    qualityScore += usageBoost;

    // Slight decay based on age (older entries may be less relevant)
    const ageDecay = Math.min(ageInDays * 0.001, 0.05); // Max 5% decay
    qualityScore -= ageDecay;

    // Ensure score stays within bounds
    return Math.max(0.0, Math.min(1.0, qualityScore));
  }

  shouldPromoteEntry(
    entry: Database["public"]["Tables"]["translation_memory"]["Row"]
  ) {
    const usageCount = entry.usage_count || 0;
    const qualityScore = entry.quality_score || 0;
    const createdAt = new Date(entry.created_at || "");

    const ageInDays =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Promote if:
    // 1. High usage (more than 5 times used)
    // 2. High quality (above 0.8)
    // 3. Recent (less than 30 days old)
    return usageCount >= 5 && qualityScore >= 0.8 && ageInDays <= 30;
  }

  shouldDemoteEntry(
    entry: Database["public"]["Tables"]["translation_memory"]["Row"]
  ) {
    const usageCount = entry.usage_count || 0;
    const qualityScore = entry.quality_score || 0;
    const createdAt = new Date(entry.created_at || "");

    const ageInDays =
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

    // Demote if:
    // 1. Low usage (less than 2 times used)
    // 2. Low quality (below 0.5)
    // 3. Old (more than 90 days old)
    return usageCount < 2 && qualityScore < 0.5 && ageInDays > 90;
  }

  // Helper method to calculate age in days
  private calculateAgeInDays(createdAt: string | null) {
    if (!createdAt) {
      return 0;
    }

    const createdDate = new Date(createdAt);
    const now = new Date();

    return (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  // Helper method to get quality level description
  getQualityLevel(score: number) {
    if (score >= 0.9) {
      return "excellent";
    }

    if (score >= 0.8) {
      return "good";
    }

    if (score >= 0.6) {
      return "fair";
    }

    if (score >= 0.4) {
      return "poor";
    }

    return "very_poor";
  }

  // Helper method to determine if entry should be cleaned up
  shouldCleanupEntry(
    entry: Database["public"]["Tables"]["translation_memory"]["Row"]
  ) {
    const usageCount = entry.usage_count || 0;
    const qualityScore = entry.quality_score || 0;
    const ageInDays = this.calculateAgeInDays(entry.created_at);

    // Clean up if:
    // 1. Never used AND low quality AND old
    return usageCount === 0 && qualityScore < 0.3 && ageInDays > 180;
  }
}
