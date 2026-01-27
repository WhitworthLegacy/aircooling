import { redirect } from "next/navigation";

export default function Home() {
  // Redirect to login or dashboard based on auth state
  // For now, redirect to login
  redirect("/login");
}
