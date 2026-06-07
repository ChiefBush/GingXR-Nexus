import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArticleActionsMenu } from "@/components/kb/article-actions-menu";
import { ArticleRenderer } from "@/components/kb/article-renderer";
import { ArticleVersionHistory } from "@/components/kb/article-version-history";
import { ProtectedLayout } from "@/lib/protected-layout";
import { getArticle, listCategories } from "../actions";
import type { ArticleStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <ArticleContent params={params} />
    </ProtectedLayout>
  );
}

async function ArticleContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getArticle(id);
  if (!res.success || !res.data) return notFound();
  const article = res.data;
  const catsRes = await listCategories();
  const categories = catsRes.success ? catsRes.data : [];

  return (
    <>
      <Link
        href="/knowledge-base"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to Knowledge Base
      </Link>
      <PageHeader
        title={article.title}
        description={
          article.summary
            ? `${article.category.name} · ${article.summary}`
            : article.category.name
        }
        actions={
          <ArticleActionsMenu
            articleId={article.id}
            initial={{
              title: article.title,
              slug: article.slug,
              content: article.content,
              summary: article.summary,
              categoryId: article.categoryId,
              tags: article.tags,
              status: article.status,
            }}
            categories={categories}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={article.status as ArticleStatus} />
        <span className="text-muted-foreground">v{article.version}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">/{article.slug}</span>
        {article.tags.length > 0 ? (
          <>
            <span className="text-muted-foreground">·</span>
            {article.tags.map((t) => (
              <Badge key={t} variant="outline" className="text-[10px]">
                {t}
              </Badge>
            ))}
          </>
        ) : null}
        <span className="ml-auto text-muted-foreground">
          Updated {new Date(article.updatedAt).toLocaleString()}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <ArticleRenderer content={article.content} />
        </Card>
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold">Author</h3>
            <p className="text-xs text-muted-foreground">
              Created by{" "}
              {article.createdBy.name ?? article.createdBy.email}
            </p>
            <p className="text-xs text-muted-foreground">
              Last edited by{" "}
              {article.updatedBy.name ?? article.updatedBy.email}
            </p>
          </Card>
          <Card className="p-5">
            <h3 className="mb-2 text-sm font-semibold">Version history</h3>
            <ArticleVersionHistory
              articleId={article.id}
              currentVersion={article.version}
              versions={article.versions}
            />
          </Card>
        </div>
      </div>
    </>
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
