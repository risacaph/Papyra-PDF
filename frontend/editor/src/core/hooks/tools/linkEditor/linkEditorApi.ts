import apiClient from "@app/services/apiClient";

/** A link annotation reported by the backend, in fractional top-left page coordinates. */
export interface ExtractedLink {
  pageIndex: number;
  annotationIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: "uri" | "page" | "other";
  uri?: string | null;
  targetPage?: number | null;
}

export interface LinkExtraction {
  pageCount: number;
  links: ExtractedLink[];
}

export async function fetchLinkExtraction(
  file: File | Blob,
): Promise<LinkExtraction> {
  const formData = new FormData();
  formData.append("fileInput", file);
  const response = await apiClient.post<LinkExtraction>(
    "/api/v1/edit/links/extract",
    formData,
    { suppressErrorToast: true },
  );
  return response.data;
}
