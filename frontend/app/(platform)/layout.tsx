import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { getUser, isAuthenticated } = getKindeServerSession();

  if (!(await isAuthenticated())) {
    redirect("/login");
  }

  const kindeUser = await getUser();
  const fullName = [kindeUser?.given_name, kindeUser?.family_name].filter(Boolean).join(" ").trim();
  const displayName = fullName || kindeUser?.email || "Usuario";

  return (
    <AppShell
      user={{
        email: kindeUser?.email,
        name: displayName,
        role: "Analista agronómico",
      }}
    >
      {children}
    </AppShell>
  );
}
