import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const { isAuthenticated } = getKindeServerSession();

  if (await isAuthenticated()) {
    redirect("/juicio-experto");
  }

  redirect("/api/auth/login?post_login_redirect_url=/juicio-experto");
}
