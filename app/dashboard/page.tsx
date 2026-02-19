import { createClient } from "@/lib/supabase/server";

const BASINS = ["permian", "eagle_ford", "scoop_stack", "williston"];
const BASIN_LABELS: Record<string, string> = {
  permian:     "Permian",
  eagle_ford:  "Eagle Ford",
  scoop_stack: "SCOOP/STACK",
  williston:   "Williston",
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Most recent month with data
  const { data: latestSync } = await supabase
    .from("sync_log")
    .select("completed_at")
    .eq("status", "success")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  // P&L summary by basin for latest month
  const { data: pnl } = await supabase
    .from("pnl_snapshots")
    .select("basin_id, total_revenue, total_loe, net_income")
    .order("report_month", { ascending: false })
    .limit(100);

  const basinSummary = BASINS.map((basin) => {
    const rows = pnl?.filter((r) => r.basin_id === basin) ?? [];
    return {
      basin,
      revenue:   rows.reduce((s, r) => s + (r.total_revenue ?? 0), 0),
      loe:       rows.reduce((s, r) => s + (r.total_loe ?? 0), 0),
      netIncome: rows.reduce((s, r) => s + (r.net_income ?? 0), 0),
    };
  });

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        {latestSync && (
          <p className="text-xs text-gray-400">
            Last synced {new Date(latestSync.completed_at).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {basinSummary.map(({ basin, revenue, loe, netIncome }) => (
          <div key={basin} className="bg-white rounded-lg border border-gray-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
              {BASIN_LABELS[basin]}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Revenue</span>
                <span className="font-medium">{fmt(revenue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">LOE</span>
                <span className="font-medium">{fmt(loe)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2 mt-2">
                <span className="text-gray-500">Net Income</span>
                <span className={`font-semibold ${netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(netIncome)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
