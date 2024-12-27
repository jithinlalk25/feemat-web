import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import ApiService from "@/lib/api/api";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  _id: string;
  email: string;
}

interface Group {
  _id: string;
  name: string;
  members: Member[];
}

interface SettingsPageProps {
  formData: {
    _id: string;
    isActive: boolean;
    isAnonymous?: boolean;
    expiryTime?: string;
    reminderEmail?: boolean;
    members: {
      groupIds: string[];
      memberIds: string[];
    };
  };
  onUpdate: (updates: any) => void;
}

export const SettingsPage = ({ formData, onUpdate }: SettingsPageProps) => {
  const [isActive, setIsActive] = useState(formData.isActive);
  const [isAnonymous, setIsAnonymous] = useState(formData.isAnonymous || false);
  const [expiryTime, setExpiryTime] = useState(
    formData.expiryTime || "no_expiry"
  );
  const [reminderEmail, setReminderEmail] = useState(
    formData.reminderEmail || false
  );
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>(
    formData.members.groupIds || []
  );
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    formData.members.memberIds || []
  );
  const [searchGroups, setSearchGroups] = useState("");
  const [searchMembers, setSearchMembers] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [groupsData, membersData] = await Promise.all([
          ApiService.getGroups(),
          ApiService.getMembers(),
        ]);
        setGroups(groupsData);
        setMembers(membersData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchGroups.toLowerCase())
  );

  const filteredMembers = members.filter((member) =>
    member.email.toLowerCase().includes(searchMembers.toLowerCase())
  );

  const handleSelectAllGroups = (checked: boolean) => {
    if (checked) {
      const filteredGroupIds = filteredGroups.map((group) => group._id);
      setSelectedGroups(filteredGroupIds);
    } else {
      setSelectedGroups([]);
    }
  };

  const handleSelectAllMembers = (checked: boolean) => {
    if (checked) {
      const filteredMemberIds = filteredMembers.map((member) => member._id);
      setSelectedMembers(filteredMemberIds);
    } else {
      setSelectedMembers([]);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const updates = {
        isActive,
        isAnonymous,
        expiryTime,
        reminderEmail,
        members: {
          groupIds: selectedGroups,
          memberIds: selectedMembers,
        },
      };

      const loadingToast = toast.loading("Saving settings...");
      await ApiService.updateForm(formData._id, updates);
      toast.dismiss(loadingToast);
      toast.success("Settings saved successfully");

      onUpdate({
        isActive,
        isAnonymous,
        expiryTime,
        reminderEmail,
        members: {
          groupIds: selectedGroups,
          memberIds: selectedMembers,
        },
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 px-8 pt-4">
      {/* Form Status Toggle */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            id="form-status"
          />
          <Label htmlFor="form-status" className="text-base font-medium">
            Form is {isActive ? "active" : "inactive"}
          </Label>
        </div>
        <div className="text-sm text-muted-foreground">
          {isActive
            ? "Your form is currently accepting responses."
            : "Your form is currently not accepting responses."}
        </div>
      </div>

      {/* Anonymous Submissions Toggle */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Switch
            checked={isAnonymous}
            onCheckedChange={setIsAnonymous}
            id="anonymous-submissions"
          />
          <Label
            htmlFor="anonymous-submissions"
            className="text-base font-medium"
          >
            Anonymous submissions
          </Label>
        </div>
        <div className="text-sm text-muted-foreground">
          {isAnonymous
            ? "Submissions will not collect member information."
            : "Submissions will include member information."}
        </div>
      </div>

      {/* Form Expiry Time */}
      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiry-time" className="text-base font-medium">
            Form Expiry Time
          </Label>
          <Select value={expiryTime} onValueChange={setExpiryTime}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select expiry time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6_hours">6 hours</SelectItem>
              <SelectItem value="12_hours">12 hours</SelectItem>
              <SelectItem value="1_day">1 day</SelectItem>
              <SelectItem value="3_days">3 days</SelectItem>
              <SelectItem value="no_expiry">No expiry</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          {expiryTime === "no_expiry"
            ? "Form will remain active until manually deactivated."
            : `Form will automatically expire ${expiryTime.replace(
                "_",
                " "
              )} after being sent.`}
        </div>
      </div>

      {/* Reminder Email Toggle */}
      {expiryTime !== "no_expiry" && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Switch
              checked={reminderEmail}
              onCheckedChange={setReminderEmail}
              id="reminder-email"
            />
            <Label htmlFor="reminder-email" className="text-base font-medium">
              Send reminder email
            </Label>
          </div>
          <div className="text-sm text-muted-foreground">
            An email reminder will be sent to recipients who haven't submitted
            their response, 1 hour before the form expires.
          </div>
        </div>
      )}

      {/* Groups Selection */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-medium">
            Groups who can submit this form
          </Label>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                Select groups
                <span className="text-muted-foreground">
                  ({selectedGroups.length})
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Select Groups</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search groups..."
                    value={searchGroups}
                    onChange={(e) => setSearchGroups(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="h-[calc(100vh-8rem)] overflow-y-auto mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-groups"
                        checked={
                          filteredGroups.length > 0 &&
                          filteredGroups.every((group) =>
                            selectedGroups.includes(group._id)
                          )
                        }
                        onCheckedChange={handleSelectAllGroups}
                      />
                      <Label htmlFor="select-all-groups">Select All</Label>
                    </div>
                    {filteredGroups.map((group) => (
                      <div
                        key={group._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={group._id}
                          checked={selectedGroups.includes(group._id)}
                          onCheckedChange={(checked) => {
                            setSelectedGroups((prev) =>
                              checked
                                ? [...prev, group._id]
                                : prev.filter((id) => id !== group._id)
                            );
                          }}
                        />
                        <Label htmlFor={group._id}>{group.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {selectedGroups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedGroups.map((groupId) => (
              <div
                key={groupId}
                className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm"
              >
                {groups.find((g) => g._id === groupId)?.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Members Selection */}
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <Label className="text-base font-medium">
            Individual members who can submit this form
          </Label>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-[200px] justify-between">
                Select members
                <span className="text-muted-foreground">
                  ({selectedMembers.length})
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Select Members</SheetTitle>
              </SheetHeader>
              <div className="mt-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchMembers}
                    onChange={(e) => setSearchMembers(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="h-[calc(100vh-8rem)] overflow-y-auto mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2 pb-2 border-b">
                      <Checkbox
                        id="select-all-members"
                        checked={
                          filteredMembers.length > 0 &&
                          filteredMembers.every((member) =>
                            selectedMembers.includes(member._id)
                          )
                        }
                        onCheckedChange={handleSelectAllMembers}
                      />
                      <Label htmlFor="select-all-members">Select All</Label>
                    </div>
                    {filteredMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={member._id}
                          checked={selectedMembers.includes(member._id)}
                          onCheckedChange={(checked) => {
                            setSelectedMembers((prev) =>
                              checked
                                ? [...prev, member._id]
                                : prev.filter((id) => id !== member._id)
                            );
                          }}
                        />
                        <Label htmlFor={member._id}>{member.email}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {selectedMembers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedMembers.map((memberId) => (
              <div
                key={memberId}
                className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md text-sm"
              >
                {members.find((m) => m._id === memberId)?.email}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-start pt-4">
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
};
