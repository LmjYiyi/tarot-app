import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ReadingExperience } from "@/components/ReadingExperience";
import { getAllSpreads, getSpreadBySlug } from "@/lib/tarot/catalog";

type SpreadPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getAllSpreads().map((spread) => ({ slug: spread.slug }));
}

export async function generateMetadata({
  params,
}: SpreadPageProps): Promise<Metadata> {
  const { slug } = await params;
  const spread = getSpreadBySlug(slug);

  if (!spread) {
    return {};
  }

  return {
    title: `${spread.nameZh} | Arcana Flow`,
    description: spread.detail,
  };
}

export default async function SpreadDetailPage({ params }: SpreadPageProps) {
  const { slug } = await params;
  const spread = getSpreadBySlug(slug);

  if (!spread) {
    notFound();
  }

  return (
    <div data-spread-page className="mx-auto min-h-[calc(100vh-57px)] w-full max-w-7xl px-6 py-10 lg:px-10">
      <ReadingExperience spread={spread} />
    </div>
  );
}
