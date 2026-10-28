import { PageRenderer } from "@/components/pages/PageRenderer";

export const dynamic = "force-dynamic";

export default async function AppPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  return <PageRenderer slug={slug ?? []} />;
}
