import "server-only";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getServerClient } from "./supabase/server";

/** The signed-in user, verified with Supabase (not just read from the cookie). */
export async function getUser(): Promise<User | null> {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

export function isAdmin(user: User | null): boolean {
  if (!user?.email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(user.email.toLowerCase());
}

export async function requireUser(next: string): Promise<User> {
  const user = await getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}

/** Only allow redirects to paths on this site. */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
