import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { FeatureMatrix } from "@/components/product/feature-matrix";
import { NewPlatformInline } from "@/components/product/new-platform-inline";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getProduct, listPlatforms } from "../actions";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <ProductDetailContent params={params} />
    </ProtectedLayout>
  );
}

async function ProductDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [productRes, platformsRes] = await Promise.all([
    getProduct(id),
    listPlatforms(),
  ]);
  if (!productRes.success || !productRes.data) return notFound();
  const product = productRes.data;
  const platforms = platformsRes.success ? platformsRes.data : [];

  return (
    <>
      <Link
        href="/product"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Products
      </Link>
      <PageHeader
        title={product.name}
        description={product.description ?? undefined}
        actions={<NewPlatformInline />}
      />
      <FeatureMatrix
        productId={product.id}
        features={product.features}
        platforms={platforms}
      />
    </>
  );
}
