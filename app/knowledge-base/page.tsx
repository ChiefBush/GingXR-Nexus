import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { NewArticleDialog } from "@/components/kb/new-article-dialog";
import { NewCategoryDialog } from "@/components/kb/new-category-dialog";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listArticles, listCategories, getKbMetrics } from "./actions";
import type { ArticleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function KnowledgeBasePage() {
  return (
    <ProtectedLayout>
      <KbContent />
    </ProtectedLayout>
  );
}

async function KbContent() {
  const [articlesRes, catsRes, metricsRes] = await Promise.all([
    listArticles(),
    listCategories(),
    getKbMetrics(),
  ]);
  const articles = articlesRes.success ? articlesRes.data : [];
  const categories = catsRes.success ? catsRes.data : [];
  const metrics = metricsRes.success
    ? metricsRes.data
    : { total: 0, published: 0, drafts: 0, archived: 0, categories: 0 };

  return (
    <>
      <PageHeader
        title="Knowledge Base"
        description={`${metrics.total} articles · ${metrics.published} published · ${metrics.drafts} drafts · ${metrics.categories} categories`}
        actions={
          <div className="flex gap-2">
            <NewCategoryDialog categories={categories} />
            <NewArticleDialog categories={categories} />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <MetricCard label="Total" value={metrics.total} />
        <MetricCard label="Published" value={metrics.published} />
        <MetricCard label="Drafts" value={metrics.drafts} />
        <MetricCard label="Archived" value={metrics.archived} />
        <MetricCard label="Categories" value={metrics.categories} />
      </div>

      {categories.length > 0 ? (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/knowledge-base?category=${c.id}`}
              className="rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs hover:bg-accent"
            >
              <span className="font-medium">{c.name}</span>
              <span className="ml-1.5 text-muted-foreground">
                {c._count.articles}
              </span>
            </Link>
          ))}
        </div>
      ) : null}

      {articles.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No articles yet. Click{" "}
          <span className="font-medium text-foreground">New Article</span> to write the
          first one.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link key={a.id} href={`/knowledge-base/${a.id}`}>
              <Card className="flex h-full flex-col p-5 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                    {a.category.name}
                  </p>
                  <StatusBadge status={a.status as ArticleStatus} />
                </div>
                <h3 className="mt-1 line-clamp-2 font-semibold text-foreground">
                  {a.title}
                </h3>
                {a.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {a.summary}
                  </p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-1">
                  {a.tags.slice(0, 4).map((t) => (
                    <Badge key={t} variant="outline" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>
                <p className="mt-auto pt-3 text-[11px] text-muted-foreground">
                  v{a.version} · Updated {new Date(a.updatedAt).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </Card>
  );
}

function StatusBadge({ status }: { status: ArticleStatus }) {
  const map: Record<ArticleStatus, { label: string; cls: string }> = {
    DRAFT: { label: "Draft", cls: "bg-muted text-muted-foreground" },
    PUBLISHED: { label: "Published", cls: "bg-primary text-primary-foreground" },
    ARCHIVED: { label: "Archived", cls: "bg-secondary text-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}
