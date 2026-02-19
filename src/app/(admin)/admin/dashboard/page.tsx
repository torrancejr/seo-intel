import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { FileText, Clock, Tags, MapPin } from 'lucide-react';

async function getDashboardStats(tenantId: string) {
  const [totalArticles, pipelineArticles, topicsCount, citiesCount] =
    await Promise.all([
      db.article.count({
        where: { tenantId, status: 'PUBLISHED' },
      }),
      db.article.count({
        where: { tenantId, status: { in: ['DRAFT', 'REVIEW'] } },
      }),
      db.topic.count({
        where: { tenantId },
      }),
      db.tenantCity.count({
        where: { tenantId },
      }),
    ]);

  return {
    totalArticles,
    pipelineArticles,
    topicsCount,
    citiesCount,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats(session!.user.tenantId);

  const statCards = [
    {
      name: 'Published Articles',
      value: stats.totalArticles,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'In Pipeline',
      value: stats.pipelineArticles,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      name: 'Active Topics',
      value: stats.topicsCount,
      icon: Tags,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Target Cities',
      value: stats.citiesCount,
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your content generation pipeline
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-xl`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <a
              href="/admin/generate"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <p className="font-medium">Generate Articles</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create location-specific content in minutes
              </p>
            </a>
            <a
              href="/admin/topics"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <p className="font-medium">Manage Topics</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add or edit your content topics
              </p>
            </a>
            <a
              href="/admin/cities"
              className="block p-4 rounded-lg border border-border hover:bg-muted transition-colors"
            >
              <p className="font-medium">Select Cities</p>
              <p className="text-sm text-muted-foreground mt-1">
                Choose which cities to target
              </p>
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                1
              </div>
              <div>
                <p className="font-medium">Add Topics</p>
                <p className="text-sm text-muted-foreground">
                  Define the content areas you want to cover
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                2
              </div>
              <div>
                <p className="font-medium">Select Cities</p>
                <p className="text-sm text-muted-foreground">
                  Choose from 50+ US cities with real data
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                3
              </div>
              <div>
                <p className="font-medium">Generate Content</p>
                <p className="text-sm text-muted-foreground">
                  Create unique articles for each city
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
