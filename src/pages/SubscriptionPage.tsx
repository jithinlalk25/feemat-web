import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import ApiService from "@/lib/api/api";
import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";

const SubscriptionPage = () => {
  const [subscription, setSubscription] = useState<{
    plan: string;
    maxForms: number;
    maxMembers: number;
    expiry: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await ApiService.getMySubscription();
        setSubscription(data);
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading subscription details...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription</h1>
        <p className="text-gray-500">Your current subscription details</p>
      </div>

      <Card className="mb-6 max-w-md">
        <CardHeader>
          <CardTitle className="text-lg">
            Current Plan: {subscription?.plan || "Free"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <ul className="space-y-3">
              <li className="flex items-center text-gray-700">
                <span className="font-medium mr-2">Forms:</span>
                <span>{subscription?.maxForms || 0} forms</span>
              </li>
              <li className="flex items-center text-gray-700">
                <span className="font-medium mr-2">Members:</span>
                <span>{subscription?.maxMembers || 0} members</span>
              </li>
              {subscription?.expiry && (
                <li className="flex items-center text-gray-700">
                  <span className="font-medium mr-2">Expires:</span>
                  <span>
                    {new Date(subscription.expiry).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-blue-700">
          To upgrade your subscription, please{" "}
          <Link
            to="/dashboard/support"
            className="text-blue-600 underline hover:no-underline font-medium"
          >
            contact our support team
          </Link>
          . We'll be happy to help you choose the right plan for your needs.
        </p>
      </div>
    </div>
  );
};

export default SubscriptionPage;
