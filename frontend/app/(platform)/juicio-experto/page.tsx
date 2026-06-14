import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { ExpertJudgmentView } from "@/features/expert-judgment/expert-judgment-view";
import { fetchPendingImage } from "@/lib/api";

export default async function ExpertJudgmentPage() {
  const { getUser } = getKindeServerSession();
  const kindeUser = await getUser();
  const fullName = [kindeUser?.given_name, kindeUser?.family_name].filter(Boolean).join(" ").trim();
  const expertName = fullName || kindeUser?.email || "Experto invitado";

  try {
    const pendingImage = await fetchPendingImage(expertName);
    return <ExpertJudgmentView expertName={expertName} pendingImage={pendingImage} />;
  } catch (error) {
    const apiError = error instanceof Error ? error.message : "Error desconocido";
    return <ExpertJudgmentView expertName={expertName} apiError={apiError} />;
  }
}
