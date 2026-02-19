import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const POWER_BI_API = "https://api.powerbi.com/v1.0/myorg";

async function getAccessToken(): Promise<string> {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: process.env.POWERBI_CLIENT_ID!,
    client_secret: process.env.POWERBI_CLIENT_SECRET!,
    scope: "https://analysis.windows.net/powerbi/api/.default",
  });

  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.POWERBI_TENANT_ID}/oauth2/v2.0/token`,
    { method: "POST", body: params }
  );

  if (!res.ok) throw new Error("Failed to get Power BI access token");
  const data = await res.json();
  return data.access_token;
}

export async function GET(request: NextRequest) {
  // Verify user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reportId = request.nextUrl.searchParams.get("reportId");
  if (!reportId) {
    return NextResponse.json({ error: "reportId is required" }, { status: 400 });
  }

  const accessToken = await getAccessToken();
  const workspaceId = process.env.POWERBI_WORKSPACE_ID;

  // Get report embed URL
  const reportRes = await fetch(
    `${POWER_BI_API}/groups/${workspaceId}/reports/${reportId}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!reportRes.ok) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const report = await reportRes.json();

  // Generate embed token
  const tokenRes = await fetch(
    `${POWER_BI_API}/groups/${workspaceId}/reports/${reportId}/GenerateToken`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accessLevel: "View" }),
    }
  );

  if (!tokenRes.ok) {
    return NextResponse.json({ error: "Failed to generate embed token" }, { status: 500 });
  }

  const { token } = await tokenRes.json();

  return NextResponse.json({
    type: "report",
    id: reportId,
    embedUrl: report.embedUrl,
    accessToken: token,
    tokenType: 1,
  });
}
