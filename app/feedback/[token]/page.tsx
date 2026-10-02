import ClientFeedbackForm from "@/components/public/ClientFeedbackForm";

export default async function ClientFeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <ClientFeedbackForm token={token} />;
}
