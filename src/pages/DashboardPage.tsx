import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import { useEffect, useState } from "react";
import ApiService from "@/lib/api/api";

export function DashboardPage() {
  const [userEmail, setUserEmail] = useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");

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
        console.error("Failed to load user data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex h-screen">
      <Sidebar userEmail={userEmail} companyName={companyName} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
