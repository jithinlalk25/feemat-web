import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import ApiService from "@/lib/api/api";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const [userEmail, setUserEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profile, company] = await Promise.all([
          ApiService.getUserProfile(),
          ApiService.getMyCompany(),
        ]);
        setUserEmail(profile.email);
        setCompanyName(company.name);
      } catch (err) {
        console.error("Failed to load profile data:", err);
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

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-500">Email</label>
            <p className="text-base mt-1">{userEmail || "Loading..."}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Company</label>
            <p className="text-base mt-1">{companyName || "Loading..."}</p>
          </div>
          <div className="pt-4">
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
