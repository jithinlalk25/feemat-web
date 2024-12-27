import { useEffect, useState } from "react";
import ApiService from "@/lib/api/api";
import { Link } from "react-router-dom";
import { DocumentTextIcon, UsersIcon } from "@heroicons/react/24/outline";
import { Loader2 } from "lucide-react";

export function OverviewPage() {
  const [stats, setStats] = useState<{
    formCount: number;
    formSentCount: number;
    submissionCount: number;
    groupCount: number;
    memberCount: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await ApiService.getOverviewStats();
        setStats({
          formCount: data.formCount,
          formSentCount: data.formSentCount,
          submissionCount: data.submissionCount,
          groupCount: data.groupCount,
          memberCount: data.memberCount,
        });
      } catch (error) {
        console.error("Failed to fetch overview stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Overview</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading overview...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatBox title="Forms" value={stats?.formCount || 0} />
            <StatBox title="Forms Sent" value={stats?.formSentCount || 0} />
            <StatBox title="Submissions" value={stats?.submissionCount || 0} />
            <StatBox title="Groups" value={stats?.groupCount || 0} />
            <StatBox title="Members" value={stats?.memberCount || 0} />
          </div>

          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Link
                to="/dashboard/forms"
                className="flex items-center p-6 bg-white rounded-xl shadow-sm border border-gray-300 hover:shadow-md transition-shadow duration-200"
              >
                <DocumentTextIcon className="w-8 h-8 text-gray-600 mr-4" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Forms</h3>
                  <p className="text-gray-600">View and manage your forms</p>
                </div>
              </Link>

              <Link
                to="/dashboard/members"
                className="flex items-center p-6 bg-white rounded-xl shadow-sm border border-gray-300 hover:shadow-md transition-shadow duration-200"
              >
                <UsersIcon className="w-8 h-8 text-gray-600 mr-4" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Members</h3>
                  <p className="text-gray-600">Manage your member list</p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

interface StatBoxProps {
  title: string;
  value: number;
}

function StatBox({ title, value }: StatBoxProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[120px] hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col">
        <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
        <div className="flex items-baseline">
          <span className="text-4xl font-medium text-gray-900">{value}</span>
        </div>
      </div>
    </div>
  );
}
