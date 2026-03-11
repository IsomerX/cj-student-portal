import { apiClient } from "./config";

export interface Notebook {
    id: string;
    title: string;
    description?: string;
    subject?: string;
    coverColor?: string;
    tags?: string[];
    status: "ACTIVE" | "ARCHIVED" | "DRAFT";
    createdAt: string;
    updatedAt: string;
}

export interface GetNotebooksResponse {
    success: boolean;
    data?: {
        notebooks: Notebook[];
    };
    error?: string;
}

export async function getNotebooks(status?: string): Promise<GetNotebooksResponse> {
    const params = new URLSearchParams();
    if (status) {
        params.append("status", status);
    }

    const response = await apiClient.get<GetNotebooksResponse>(
        `/notebooks${params.toString() ? `?${params.toString()}` : ""}`
    );
    return response.data;
}
