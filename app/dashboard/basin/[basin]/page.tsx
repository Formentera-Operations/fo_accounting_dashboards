import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

const BASIN_LABELS: Record<string, string> = {
  permian:     "Permian",
  eagle_ford:  "Eagle Ford",
  scoop_stack: "SCOOP/STACK",
  williston:   "Williston",
};

type Props = { params: Promise<{ basin: string }> };

export default async function BasinPage({ params }: Props) {
  const { basin } = await params;
  if (!BASIN_LABELS[basin]) notFound();

  const supabase = await createClient();

  const { data: pnl } = await supabase
    .from("pnl_snapshots")
    .select("report_month, total_revenue, total_loe, production_taxes, workover_expenses, net_income")
    .eq("basin_id", basin)
    .order("report_month", { ascending: false })
    .limit(12);

  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="p-8">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        {BASIN_LABELS[basin]}
      </h1>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Month</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Revenue</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">LOE</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Prod. Taxes</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Workovers</th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Net Income</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {pnl?.map((row) => (
              <tr key={row.report_month} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-600">
                  {new Date(row.report_month).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </td>
                <td className="px-4 py-3 text-right">{fmt(row.total_revenue)}</td>
                <td className="px-4 py-3 text-right">{fmt(row.total_loe)}</td>
                <td className="px-4 py-3 text-right">{fmt(row.production_taxes)}</td>
                <td className="px-4 py-3 text-right">{fmt(row.workover_expenses)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${row.net_income >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {fmt(row.net_income)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {(!pnl || pnl.length === 0) && (
          <div className="px-4 py-12 text-center text-sm text-gray-400">
            No data — run a Snowflake sync to populate this basin.
          </div>
        )}
      </div>
    </div>
  );
}
