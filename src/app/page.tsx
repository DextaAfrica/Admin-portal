import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth/session";

export default async function HomePage() {
  const { user } = await getCurrentSession();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}

