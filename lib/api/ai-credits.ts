import { apiClient } from "./config";

export interface AiCredits {
    data: {
        baseCreditsRemaining: number;
        [key: string]: unknown;
    };
}

export async function getMyCredits(): Promise<AiCredits> {
    const response = await apiClient.get<AiCredits>("/ai-credits/my-credits");
    return response.data;
}
