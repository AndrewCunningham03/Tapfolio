import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const isAdminEmail = (email?: string) =>
  Boolean(email) &&
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .includes(email!.toLowerCase());

// Keeps the Supabase sign-in session fresh, and turns signed-out visitors away
// from private pages before they load. The pages check access again themselves
// (src/lib/auth.ts); this is only the fast first gate.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const goTo = (to: string) => {
    const redirect = NextResponse.redirect(new URL(to, request.url));
    response.cookies.getAll().forEach((c) => redirect.cookies.set(c)); // keep any refreshed session
    return redirect;
  };
  if ((path.startsWith("/dashboard") || path.startsWith("/admin")) && !user) {
    return goTo(`/login?next=${encodeURIComponent(path)}`);
  }
  if (path.startsWith("/admin") && !isAdminEmail(user?.email)) {
    return goTo("/dashboard");
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/auth/:path*", "/api/me/:path*"],
};
