import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import ApiService from "@/lib/api/api";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

const ProfilePage = () => {
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profile, company] = await Promise.all([
          ApiService.getUserProfile(),
          ApiService.getMyCompany(),
        ]);
        setUserEmail(profile.email);
        setCompanyName(company.name);
        setTimezone(company.timezone);
      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSignOut = async () => {
    try {
      await ApiService.signOut();
      navigate("/");
    } catch (err) {
      console.error("Failed to sign out:", err);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Profile</h1>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      ) : (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-base mt-1">{userEmail}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Company
              </label>
              <p className="text-base mt-1">{companyName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">
                Timezone
              </label>
              <p className="text-base mt-1">{timezone}</p>
            </div>
            <div className="pt-4">
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
