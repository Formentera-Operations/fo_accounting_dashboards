export type EmbedConfig = {
  type: "report";
  id: string;
  embedUrl: string;
  accessToken: string;
  tokenType: 1; // Embed token
};

export async function getEmbedToken(reportId: string): Promise<EmbedConfig> {
  const res = await fetch(`/api/powerbi/embed-token?reportId=${reportId}`);
  if (!res.ok) throw new Error("Failed to get Power BI embed token");
  return res.json();
}
