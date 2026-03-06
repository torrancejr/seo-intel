import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import Link from 'next/link';
import { FileText, Eye } from 'lucide-react';
import { DeleteAllArticlesButton } from '@/components/admin/delete-all-articles-button';

async function getArticles(tenantId: string) {
  return db.article.findMany({
    where: { tenantId },
    include: {
      topic: true,
      city: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export default async function ArticlesPage() {
  const session = await auth();
  const articles = await getArticles(session!.user.tenantId);

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    REVIEW: 'bg-amber-100 text-amber-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="text-muted-foreground mt-2">
            Manage your generated articles
          </p>
        </div>
        <div className="flex items-center gap-3">
          {articles.length > 0 && <DeleteAllArticlesButton />}
          <Link
            href="/admin/generate"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Generate New Article
          </Link>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">No articles yet</h3>
          <p className="text-muted-foreground mb-6">
            Generate your first article to get started
          </p>
          <Link
            href="/admin/generate"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Generate Article
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Topic
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Words
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium">{article.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        /{article.slug}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{article.topic.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">
                        {article.city?.name}, {article.city?.stateCode}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          statusColors[article.status]
                        }`}
                      >
                        {article.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm">{article.wordCount}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/blog/${article.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-sm text-primary hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
