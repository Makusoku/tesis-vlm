import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ExpertJudgmentView } from "@/features/expert-judgment/expert-judgment-view";
import { fetchPendingImage } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExpertJudgmentPage() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const fullName = [kindeUser?.given_name, kindeUser?.family_name].filter(Boolean).join(" ").trim();
  const expertName = kindeUser?.email || kindeUser?.id || fullName || "Experto invitado";
  const expertAliases = [fullName, kindeUser?.email, kindeUser?.id].filter(Boolean) as string[];

  try {
    const pendingImage = await fetchPendingImage(expertName, "Analista agronómico", expertAliases);
    return <ExpertJudgmentView expertAliases={expertAliases} expertName={expertName} pendingImage={pendingImage} />;
  } catch (error) {
    const apiError = error instanceof Error ? error.message : "Error desconocido";
    return <ExpertJudgmentView expertAliases={expertAliases} expertName={expertName} apiError={apiError} />;
  }
}
