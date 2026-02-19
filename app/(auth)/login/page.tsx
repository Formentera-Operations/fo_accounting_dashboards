import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  async function signIn(formData: FormData) {
    "use server";
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
    if (error) redirect("/login?error=Invalid credentials");
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            Formentera Operations
          </h1>
          <p className="mt-1 text-sm text-gray-500">Accounting Dashboards</p>
        </div>

        <form action={signIn} className="bg-white shadow-sm rounded-lg p-8 space-y-4 border border-gray-200">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
