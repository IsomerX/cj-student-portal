import { useQuery } from "@tanstack/react-query";
import { getNotebooks, type GetNotebooksResponse } from "@/lib/api/notebook";

export function useNotebooksQuery(status?: string) {
    return useQuery<GetNotebooksResponse>({
        queryKey: ["notebooks", status],
        queryFn: () => getNotebooks(status),
    });
}
