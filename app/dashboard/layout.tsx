import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const BASINS = [
  { id: "permian",     label: "Permian" },
  { id: "eagle_ford",  label: "Eagle Ford" },
  { id: "scoop_stack", label: "SCOOP/STACK" },
  { id: "williston",   label: "Williston" },
];

const REPORTS = [
  { href: "/dashboard",            label: "Overview" },
  { href: "/dashboard/revenue",    label: "Revenue" },
  { href: "/dashboard/loe",        label: "LOE" },
  { href: "/dashboard/production", label: "Production" },
  { href: "/dashboard/pnl",        label: "P&L" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="px-5 py-4 border-b border-brand-700">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-100 opacity-60">
            Formentera Operations
          </p>
          <p className="text-sm font-medium mt-0.5">Accounting</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-widest text-brand-100 opacity-40 mb-1">
              Reports
            </p>
            {REPORTS.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="block px-2 py-1.5 rounded text-sm text-brand-100 hover:bg-brand-700 transition-colors"
              >
                {r.label}
              </Link>
            ))}
          </div>

          <div>
            <p className="px-2 text-xs font-semibold uppercase tracking-widest text-brand-100 opacity-40 mb-1">
              Basins
            </p>
            {BASINS.map((b) => (
              <Link
                key={b.id}
                href={`/dashboard/basin/${b.id}`}
                className="block px-2 py-1.5 rounded text-sm text-brand-100 hover:bg-brand-700 transition-colors"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="px-5 py-4 border-t border-brand-700">
          <p className="text-xs text-brand-100 opacity-50 truncate">{user.email}</p>
          <form action={signOut}>
            <button type="submit" className="mt-1 text-xs text-brand-100 opacity-60 hover:opacity-100 transition-opacity">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
