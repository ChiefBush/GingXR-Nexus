import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NewProductDialog } from "@/components/product/new-product-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listProducts, listPlatforms } from "./actions";
import type { PlatformStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ProductListPage() {
  return (
    <ProtectedLayout>
      <ProductListContent />
    </ProtectedLayout>
  );
}

async function ProductListContent() {
  const [productsRes, platformsRes] = await Promise.all([
    listProducts(),
    listPlatforms(),
  ]);
  const products = productsRes.success ? productsRes.data : [];
  const platforms = platformsRes.success ? platformsRes.data : [];

  return (
    <>
      <PageHeader
        title="Product"
        description={`${products.length} products · ${platforms.length} platforms`}
        actions={<NewProductDialog />}
      />
      {products.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No products yet. Click <span className="font-medium text-foreground">New Product</span> to
          create one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const totalStatuses = p.features.flatMap((f) => f.platformStatuses);
            const done = totalStatuses.filter(
              (s) => s.status === ("DONE" as PlatformStatus),
            ).length;
            const blocked = totalStatuses.filter(
              (s) => s.status === ("BLOCKED" as PlatformStatus),
            ).length;
            const pct = totalStatuses.length
              ? Math.round((done / totalStatuses.length) * 100)
              : 0;
            return (
              <Link key={p.id} href={`/product/${p.id}`}>
                <Card className="p-5 transition-shadow hover:shadow-md">
                  <h3 className="font-semibold text-foreground">{p.name}</h3>
                  {p.description ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {p.description}
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{p.features.length} features</span>
                      {blocked > 0 ? (
                        <span className="text-destructive">
                          {blocked} blocked
                        </span>
                      ) : null}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
