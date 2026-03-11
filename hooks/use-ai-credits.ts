import { useQuery } from "@tanstack/react-query";
import { getMyCredits, type AiCredits } from "@/lib/api/ai-credits";

export function useAiCreditsQuery() {
    return useQuery<AiCredits>({
        queryKey: ["ai-credits"],
        queryFn: getMyCredits,
    });
}
