import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { FileText, Users, LayoutDashboard, Headphones } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Logo } from "./Logo";

interface SidebarProps {
  userEmail: string;
  companyName?: string;
}

const Sidebar = ({ userEmail, companyName = "Company" }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const getInitial = (text: string) => text.charAt(0).toUpperCase();

  const handleProfileClick = () => {
    navigate("/dashboard/profile");
  };

  const isPathStartsWith = (route: string) =>
    location.pathname.startsWith(route);

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-50 border-r">
      {/* Header */}
      <div className="p-4 border-b ">
        <div className="flex flex-col">
          <div className="w-24">
            <Logo />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-0">
        <div className="flex items-center gap-3 ">
          <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-200">
              {companyName.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-base font-bold text-gray-700">
            {companyName}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              isPathStartsWith("/dashboard/overview") &&
                "bg-gray-200 hover:bg-gray-300"
            )}
            onClick={() => navigate("/dashboard/overview")}
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              isPathStartsWith("/dashboard/forms") &&
                "bg-gray-200 hover:bg-gray-300"
            )}
            onClick={() => navigate("/dashboard/forms")}
          >
            <FileText className="w-4 h-4" />
            Forms
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-2",
              location.pathname === "/dashboard/members" &&
                "bg-gray-200 hover:bg-gray-300"
            )}
            onClick={() => navigate("/dashboard/members")}
          >
            <Users className="w-4 h-4" />
            Members
          </Button>
        </div>
      </nav>

      {/* Support */}
      <div className="p-4">
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-2",
            location.pathname === "/dashboard/support" &&
              "bg-gray-200 hover:bg-gray-300"
          )}
          onClick={() => navigate("/dashboard/support")}
        >
          <Headphones className="w-4 h-4" />
          Contact Support
        </Button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <div
          className={cn(
            "flex items-center gap-3 cursor-pointer p-2 rounded-lg transition-colors",
            location.pathname === "/dashboard/profile"
              ? "bg-gray-200 hover:bg-gray-300"
              : "hover:bg-gray-100"
          )}
          onClick={handleProfileClick}
        >
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              location.pathname === "/dashboard/profile"
                ? "bg-gray-100"
                : "bg-gray-200"
            )}
          >
            <span className="text-sm font-medium text-gray-700">
              {getInitial(userEmail)}
            </span>
          </div>
          <span className="text-sm text-gray-600">{userEmail}</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
