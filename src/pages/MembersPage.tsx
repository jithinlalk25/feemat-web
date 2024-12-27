import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Pencil,
  Trash,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import ApiService from "@/lib/api/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// Define the type for our data
interface Member {
  _id: string;
  email: string;
  createdAt: string;
  groups: {
    _id: string;
    name: string;
    companyId: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

// Add GroupWithMembers to the existing interfaces
interface GroupWithMembers {
  _id: string;
  name: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  members: Member[];
}

interface GroupMemberAddResponse {
  addedCount: number;
  skippedCount: number;
}

type SortDirection = "asc" | "desc" | null;

const MembersPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "groups">("members");
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [emailsInput, setEmailsInput] = useState("");
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState<{
    [groupId: string]: string[];
  }>({});
  const [groupSortDirections, setGroupSortDirections] = useState<{
    [groupId: string]: SortDirection;
  }>({});
  const [groupSearchQueries, setGroupSearchQueries] = useState<{
    [groupId: string]: string;
  }>({});
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmails, setNewGroupEmails] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<{
    [key: string]: boolean;
  }>({});
  const [isAddMembersDialogOpen, setIsAddMembersDialogOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [addMembersInput, setAddMembersInput] = useState("");
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [groupToRename, setGroupToRename] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [newGroupNameInput, setNewGroupNameInput] = useState("");
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [timezone, setTimezone] = useState<string>("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<GroupWithMembers | null>(
    null
  );
  const [subscription, setSubscription] = useState<any>(null);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isDeletingMembers, setIsDeletingMembers] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [isRenamingGroup, setIsRenamingGroup] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [isAddingMembersToGroup, setIsAddingMembersToGroup] = useState(false);
  const [isRemovingFromGroup, setIsRemovingFromGroup] = useState<{
    [groupId: string]: boolean;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [membersData, subscriptionData] = await Promise.all([
          ApiService.getMembers(),
          ApiService.getMySubscription(),
        ]);
        setMembers(membersData);
        setSubscription(subscriptionData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to fetch data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await ApiService.getGroups();
        setGroups(data);
      } catch (error) {
        console.error("Failed to fetch groups:", error);
        toast.error("Failed to fetch groups");
      }
    };

    fetchGroups();
  }, []);

  useEffect(() => {
    // Get timezone from localStorage or fall back to system timezone
    const storedTimezone =
      localStorage.getItem("timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(storedTimezone);
  }, []);

  const toggleSort = () => {
    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  };

  const filteredAndSortedMembers = [...members]
    .filter((member) =>
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const compareResult =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortDirection === "asc" ? -compareResult : compareResult;
    });

  const toggleRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows((prev) =>
      prev.length === filteredAndSortedMembers.length
        ? []
        : filteredAndSortedMembers.map((member) => member._id)
    );
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      setIsDeletingMembers(true);
      await ApiService.deleteMembers(selectedRows);
      // Remove deleted members from the state
      setMembers(
        members.filter((member) => !selectedRows.includes(member._id))
      );
      // Clear selection
      setSelectedRows([]);
      setIsDeleteDialogOpen(false);
      toast.success("Members deleted successfully");
    } catch (error) {
      console.error("Failed to delete members:", error);
      toast.error("Failed to delete members");
    } finally {
      setIsDeletingMembers(false);
    }
  };

  const handleAddMember = () => {
    setIsDialogOpen(true);
  };

  // Email validation function
  const validateEmails = (
    emailsString: string
  ): { valid: string[]; invalid: string[] } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = emailsString
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter((email) => email !== "");

    const valid: string[] = [];
    const invalid: string[] = [];

    emails.forEach((email) => {
      if (emailRegex.test(email)) {
        valid.push(email);
      } else {
        invalid.push(email);
      }
    });

    return { valid, invalid };
  };

  const handleSaveMembers = async () => {
    const { valid, invalid } = validateEmails(emailsInput);

    if (invalid.length > 0) {
      toast.error(
        <div>
          <p>Invalid email addresses found:</p>
          <ul className="list-disc pl-4 mt-2">
            {invalid.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    if (valid.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    try {
      setIsAddingMembers(true);
      const response = await ApiService.bulkCreateMembers(valid);

      // Update the members list with newly created members
      setMembers((prevMembers) => [...prevMembers, ...response.created]);

      // Show success message with details
      if (response.created.length > 0 || response.skipped.length > 0) {
        const message = [
          response.created.length > 0
            ? `${response.created.length} members added`
            : "",
          response.skipped.length > 0
            ? `${response.skipped.length} duplicates skipped`
            : "",
        ]
          .filter(Boolean)
          .join(", ");

        toast.success(message);
      }

      setIsDialogOpen(false);
      setEmailsInput("");
    } catch (error) {
      console.error("Failed to add members:", error);
      toast.error("Failed to add members");
    } finally {
      setIsAddingMembers(false);
    }
  };

  const toggleGroupMember = (groupId: string, memberId: string) => {
    setSelectedGroupMembers((prev) => {
      const groupSelected = prev[groupId] || [];
      return {
        ...prev,
        [groupId]: groupSelected.includes(memberId)
          ? groupSelected.filter((id) => id !== memberId)
          : [...groupSelected, memberId],
      };
    });
  };

  const toggleAllGroupMembers = (groupId: string, members: Member[]) => {
    setSelectedGroupMembers((prev) => {
      const groupSelected = prev[groupId] || [];
      return {
        ...prev,
        [groupId]:
          groupSelected.length === members.length
            ? []
            : members.map((m) => m._id),
      };
    });
  };

  const toggleGroupSort = (groupId: string) => {
    setGroupSortDirections((prev) => ({
      ...prev,
      [groupId]: prev[groupId] === "asc" ? "desc" : "asc",
    }));
  };

  const handleRemoveFromGroup = async (
    groupId: string,
    memberIds: string[]
  ) => {
    try {
      setIsRemovingFromGroup((prev) => ({ ...prev, [groupId]: true }));
      await ApiService.removeFromGroup(groupId, memberIds);

      // Update the local state to remove members from the group
      setGroups((prevGroups) =>
        prevGroups.map((group) => {
          if (group._id === groupId) {
            return {
              ...group,
              members: group.members.filter(
                (member) => !memberIds.includes(member._id)
              ),
            };
          }
          return group;
        })
      );

      // Clear selection for this group
      setSelectedGroupMembers((prev) => ({
        ...prev,
        [groupId]: [],
      }));

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      toast.success("Members removed from group");
    } catch (error) {
      console.error("Failed to remove members from group:", error);
      toast.error("Failed to remove members from group");
    } finally {
      setIsRemovingFromGroup((prev) => ({ ...prev, [groupId]: false }));
    }
  };

  const handleDeleteGroupClick = (group: GroupWithMembers) => {
    setGroupToDelete(group);
    setIsDeleteGroupDialogOpen(true);
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      setIsDeletingGroup(true);
      await ApiService.deleteGroup(groupToDelete._id);

      // Update local state to remove the deleted group
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== groupToDelete._id)
      );

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      setIsDeleteGroupDialogOpen(false);
      setGroupToDelete(null);
      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
    } finally {
      setIsDeletingGroup(false);
    }
  };

  const handleGroupSearch = (groupId: string, query: string) => {
    setGroupSearchQueries((prev) => ({
      ...prev,
      [groupId]: query,
    }));
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    const { valid, invalid } = validateEmails(newGroupEmails);

    if (invalid.length > 0) {
      toast.error(
        <div>
          <p>Invalid email addresses found:</p>
          <ul className="list-disc pl-4 mt-2">
            {invalid.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    try {
      setIsCreatingGroup(true);
      // Create group with name and valid emails
      await ApiService.createGroup(newGroupName, valid);

      // Fetch the updated group with members
      const updatedGroups = await ApiService.getGroups();
      setGroups(updatedGroups);

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      setIsGroupDialogOpen(false);
      setNewGroupName("");
      setNewGroupEmails("");
      toast.success("Group created successfully");
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));

    // Set default sort direction if not already set
    if (!groupSortDirections[groupId]) {
      setGroupSortDirections((prev) => ({
        ...prev,
        [groupId]: "desc",
      }));
    }
  };

  const handleAddMembersToGroup = async () => {
    if (!selectedGroupId) return;

    const { valid, invalid } = validateEmails(addMembersInput);

    if (invalid.length > 0) {
      toast.error(
        <div>
          <p>Invalid email addresses found:</p>
          <ul className="list-disc pl-4 mt-2">
            {invalid.map((email, index) => (
              <li key={index}>{email}</li>
            ))}
          </ul>
        </div>
      );
      return;
    }

    if (valid.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    try {
      setIsAddingMembersToGroup(true);
      const response = (await ApiService.addToGroup(
        selectedGroupId,
        valid
      )) as GroupMemberAddResponse;

      // Refresh groups to get updated data
      const updatedGroups = await ApiService.getGroups();
      setGroups(updatedGroups);

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      setIsAddMembersDialogOpen(false);
      setAddMembersInput("");
      setSelectedGroupId(null);

      // Show success message
      toast.success(
        `${response.addedCount} members added${
          response.skippedCount > 0 ? `, ${response.skippedCount} skipped` : ""
        }`
      );
    } catch (error) {
      console.error("Failed to add members to group:", error);
      toast.error("Failed to add members to group");
    } finally {
      setIsAddingMembersToGroup(false);
    }
  };

  const handleRenameGroup = async () => {
    if (!groupToRename || !newGroupNameInput.trim()) return;

    try {
      setIsRenamingGroup(true);
      await ApiService.renameGroup(groupToRename.id, newGroupNameInput.trim());

      // Update local state
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === groupToRename.id
            ? { ...group, name: newGroupNameInput.trim() }
            : group
        )
      );

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      setIsRenameDialogOpen(false);
      setGroupToRename(null);
      setNewGroupNameInput("");
      toast.success("Group renamed successfully");
    } catch (error) {
      console.error("Failed to rename group:", error);
      toast.error("Failed to rename group");
    } finally {
      setIsRenamingGroup(false);
    }
  };

  const filteredGroups = groups
    .filter((group) =>
      group.name.toLowerCase().includes(groupSearchQuery.toLowerCase())
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  return (
    <div className="p-8">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading members...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Members</h1>
            {subscription && (
              <div className="text-sm text-muted-foreground">
                Members created: {members.length} / {subscription.maxMembers}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <div className="flex space-x-8">
              <button
                className={`pb-4 px-1 ${
                  activeTab === "members"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("members")}
              >
                Members ({members.length})
              </button>
              <button
                className={`pb-4 px-1 ${
                  activeTab === "groups"
                    ? "border-b-2 border-blue-500 text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("groups")}
              >
                Groups ({groups.length})
              </button>
            </div>
          </div>

          {/* Tab content */}
          <div>
            {activeTab === "members" ? (
              <div>
                {members.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-4">
                      No members found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8">
                      Get started by adding your first member
                    </p>
                    <HoverCard>
                      <HoverCardTrigger>
                        <Button
                          onClick={handleAddMember}
                          disabled={
                            subscription &&
                            members.length >= subscription.maxMembers
                          }
                        >
                          Add Members
                        </Button>
                      </HoverCardTrigger>
                      {subscription &&
                        members.length >= subscription.maxMembers && (
                          <HoverCardContent className="w-80">
                            <div className="flex flex-col gap-2">
                              <p className="text-sm font-semibold">
                                Member Limit Reached
                              </p>
                              <p className="text-sm text-muted-foreground">
                                You have reached the maximum number of members
                                allowed in your current subscription plan.
                                Please upgrade your plan to add more members.
                              </p>
                            </div>
                          </HoverCardContent>
                        )}
                    </HoverCard>
                  </div>
                ) : (
                  <div>
                    {/* Search input and actions */}
                    <div className="mb-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="relative max-w-sm">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8"
                          />
                        </div>
                        {selectedRows.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDeleteClick}
                          >
                            Delete {selectedRows.length} selected
                          </Button>
                        )}
                      </div>
                      <HoverCard>
                        <HoverCardTrigger>
                          <Button
                            onClick={handleAddMember}
                            disabled={
                              subscription &&
                              members.length >= subscription.maxMembers
                            }
                          >
                            Add Members
                          </Button>
                        </HoverCardTrigger>
                        {subscription &&
                          members.length >= subscription.maxMembers && (
                            <HoverCardContent className="w-80">
                              <div className="flex flex-col gap-2">
                                <p className="text-sm font-semibold">
                                  Member Limit Reached
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  You have reached the maximum number of members
                                  allowed in your current subscription plan.
                                  Please upgrade your plan to add more members.
                                </p>
                              </div>
                            </HoverCardContent>
                          )}
                      </HoverCard>
                    </div>

                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 h-12">
                              <Checkbox
                                checked={
                                  filteredAndSortedMembers.length > 0 &&
                                  selectedRows.length ===
                                    filteredAndSortedMembers.length &&
                                  filteredAndSortedMembers.every((member) =>
                                    selectedRows.includes(member._id)
                                  )
                                }
                                onCheckedChange={toggleAll}
                                aria-label="Select all"
                                className="translate-y-[2px]"
                              />
                            </TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Groups</TableHead>
                            <TableHead>
                              <Button
                                variant="ghost"
                                onClick={toggleSort}
                                className="hover:bg-transparent px-2"
                              >
                                Created At
                                {sortDirection === "asc" ? (
                                  <ArrowUp className="ml-2 h-4 w-4" />
                                ) : (
                                  <ArrowDown className="ml-2 h-4 w-4" />
                                )}
                              </Button>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAndSortedMembers.map((member) => (
                            <TableRow
                              key={member._id}
                              className={`${
                                selectedRows.includes(member._id)
                                  ? "bg-muted/50"
                                  : ""
                              }`}
                            >
                              <TableCell className="h-12">
                                <Checkbox
                                  checked={selectedRows.includes(member._id)}
                                  onCheckedChange={() => toggleRow(member._id)}
                                  aria-label={`Select ${member.email}`}
                                  className="translate-y-[2px]"
                                />
                              </TableCell>
                              <TableCell>{member.email}</TableCell>
                              <TableCell>
                                {member.groups && member.groups.length > 0
                                  ? member.groups
                                      .map((group) => group.name)
                                      .join(", ")
                                  : ""}
                              </TableCell>
                              <TableCell>
                                {formatInTimeZone(
                                  new Date(member.createdAt),
                                  timezone,
                                  "MMM d, yyyy h:mm a"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {filteredAndSortedMembers.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          No results found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {groups.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground mb-4">
                      No groups found
                    </h3>
                    <p className="text-sm text-muted-foreground mb-8">
                      Get started by creating your first group
                    </p>
                    <Button onClick={() => setIsGroupDialogOpen(true)}>
                      Create Group
                    </Button>
                  </div>
                ) : (
                  <div>
                    {/* Search input and actions */}
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div className="relative max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search groups..."
                          value={groupSearchQuery}
                          onChange={(e) => setGroupSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                      <Button onClick={() => setIsGroupDialogOpen(true)}>
                        Create Group
                      </Button>
                    </div>

                    <div className="space-y-8">
                      {filteredGroups.map((group) => {
                        const isExpanded = expandedGroups[group._id] || false;
                        const sortDirection =
                          groupSortDirections[group._id] || "asc";
                        const selectedMembers =
                          selectedGroupMembers[group._id] || [];
                        const searchQuery = groupSearchQueries[group._id] || "";

                        // Filter and sort members
                        const sortedMembers = [...group.members]
                          .filter((member) =>
                            member.email
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase())
                          )
                          .sort((a, b) => {
                            const compareResult =
                              new Date(b.createdAt).getTime() -
                              new Date(a.createdAt).getTime();
                            return sortDirection === "asc"
                              ? -compareResult
                              : compareResult;
                          });

                        return (
                          <div key={group._id} className="rounded-md border">
                            <div
                              className="p-4 bg-muted/50 cursor-pointer"
                              onClick={() => toggleGroupExpansion(group._id)}
                            >
                              <div className="flex justify-between items-center min-h-[32px]">
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-auto"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <h2 className="text-lg font-semibold">
                                    {group.name} ({group.members.length})
                                    <span className="ml-4 text-sm text-muted-foreground font-normal">
                                      Created{" "}
                                      {formatInTimeZone(
                                        new Date(group.createdAt),
                                        timezone,
                                        "MMM d, yyyy h:mm a"
                                      )}
                                    </span>
                                  </h2>
                                </div>
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        className="h-8 w-8 p-0"
                                      >
                                        <MoreVertical className="h-4 w-4" />
                                        <span className="sr-only">
                                          Open menu
                                        </span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setGroupToRename({
                                            id: group._id,
                                            name: group.name,
                                          });
                                          setNewGroupNameInput(group.name);
                                          setIsRenameDialogOpen(true);
                                        }}
                                      >
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Rename group
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={() =>
                                          handleDeleteGroupClick(group)
                                        }
                                      >
                                        <Trash className="mr-2 h-4 w-4" />
                                        Delete group
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                <div className="p-4 border-b">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="relative max-w-sm">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                          placeholder="Search emails..."
                                          value={
                                            groupSearchQueries[group._id] || ""
                                          }
                                          onChange={(e) =>
                                            handleGroupSearch(
                                              group._id,
                                              e.target.value
                                            )
                                          }
                                          className="pl-8 h-8"
                                        />
                                      </div>
                                      {selectedMembers.length > 0 && (
                                        <Button
                                          variant="destructive"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveFromGroup(
                                              group._id,
                                              selectedMembers
                                            )
                                          }
                                          disabled={
                                            isRemovingFromGroup[group._id]
                                          }
                                        >
                                          {isRemovingFromGroup[group._id] ? (
                                            <>
                                              <span className="mr-2">
                                                Removing...
                                              </span>
                                              <svg
                                                className="animate-spin h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                              >
                                                <circle
                                                  className="opacity-25"
                                                  cx="12"
                                                  cy="12"
                                                  r="10"
                                                  stroke="currentColor"
                                                  strokeWidth="4"
                                                ></circle>
                                                <path
                                                  className="opacity-75"
                                                  fill="currentColor"
                                                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                              </svg>
                                            </>
                                          ) : (
                                            `Remove ${selectedMembers.length} from group`
                                          )}
                                        </Button>
                                      )}
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedGroupId(group._id);
                                        setIsAddMembersDialogOpen(true);
                                      }}
                                    >
                                      Add Members
                                    </Button>
                                  </div>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="w-[40px] h-12">
                                        <Checkbox
                                          checked={
                                            sortedMembers.length > 0 &&
                                            selectedMembers.length ===
                                              sortedMembers.length
                                          }
                                          onCheckedChange={() =>
                                            toggleAllGroupMembers(
                                              group._id,
                                              sortedMembers
                                            )
                                          }
                                          aria-label="Select all"
                                          className="translate-y-[2px]"
                                        />
                                      </TableHead>
                                      <TableHead>Email</TableHead>
                                      <TableHead>
                                        <Button
                                          variant="ghost"
                                          onClick={() =>
                                            toggleGroupSort(group._id)
                                          }
                                          className="hover:bg-transparent px-2"
                                        >
                                          Created At
                                          {groupSortDirections[group._id] ===
                                          "asc" ? (
                                            <ArrowUp className="ml-2 h-4 w-4" />
                                          ) : (
                                            <ArrowDown className="ml-2 h-4 w-4" />
                                          )}
                                        </Button>
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {sortedMembers.map((member) => (
                                      <TableRow
                                        key={member._id}
                                        className={
                                          selectedMembers.includes(member._id)
                                            ? "bg-muted/50"
                                            : ""
                                        }
                                      >
                                        <TableCell className="w-[40px] h-12">
                                          <Checkbox
                                            checked={selectedMembers.includes(
                                              member._id
                                            )}
                                            onCheckedChange={() =>
                                              toggleGroupMember(
                                                group._id,
                                                member._id
                                              )
                                            }
                                            aria-label={`Select ${member.email}`}
                                            className="translate-y-[2px]"
                                          />
                                        </TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                          {formatInTimeZone(
                                            new Date(member.createdAt),
                                            timezone,
                                            "MMM d, yyyy h:mm a"
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                                {sortedMembers.length === 0 && (
                                  <div className="text-center py-4 text-sm text-muted-foreground">
                                    {searchQuery
                                      ? "No results found"
                                      : "No members in this group"}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })}
                      {filteredGroups.length === 0 && (
                        <div className="text-center py-4 text-sm text-muted-foreground border rounded-md">
                          No matching groups found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Members</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Enter email addresses (separated by commas or newlines)"
                  value={emailsInput}
                  onChange={(e) => setEmailsInput(e.target.value)}
                  className="min-h-[150px]"
                  disabled={isAddingMembers}
                />
              </div>
              <DialogFooter>
                <Button onClick={handleSaveMembers} disabled={isAddingMembers}>
                  {isAddingMembers ? (
                    <>
                      <span className="mr-2">Adding...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create Group</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="groupName" className="text-sm font-medium">
                    Group Name
                  </label>
                  <Input
                    id="groupName"
                    placeholder="Enter group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="groupEmails" className="text-sm font-medium">
                    Add Members (Optional)
                  </label>
                  <Textarea
                    id="groupEmails"
                    placeholder="Enter email addresses (separated by commas or newlines)"
                    value={newGroupEmails}
                    onChange={(e) => setNewGroupEmails(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGroup} disabled={isCreatingGroup}>
                  {isCreatingGroup ? (
                    <>
                      <span className="mr-2">Creating...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isAddMembersDialogOpen}
            onOpenChange={(open) => {
              setIsAddMembersDialogOpen(open);
              if (!open) {
                setSelectedGroupId(null);
                setAddMembersInput("");
              }
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  Add Members to{" "}
                  {groups.find((g) => g._id === selectedGroupId)?.name}
                </DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="Enter email addresses (separated by commas or newlines)"
                  value={addMembersInput}
                  onChange={(e) => setAddMembersInput(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddMembersToGroup}
                  disabled={isAddingMembersToGroup}
                >
                  {isAddingMembersToGroup ? (
                    <>
                      <span className="mr-2">Adding...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Add Members"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isRenameDialogOpen}
            onOpenChange={(open) => {
              setIsRenameDialogOpen(open);
              if (!open) {
                setGroupToRename(null);
                setNewGroupNameInput("");
              }
            }}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Rename Group</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="newGroupName" className="text-sm font-medium">
                    New Group Name
                  </label>
                  <Input
                    id="newGroupName"
                    placeholder="Enter new group name"
                    value={newGroupNameInput}
                    onChange={(e) => setNewGroupNameInput(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleRenameGroup} disabled={isRenamingGroup}>
                  {isRenamingGroup ? (
                    <>
                      <span className="mr-2">Saving...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Members</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete {selectedRows.length} member
                  {selectedRows.length === 1 ? "" : "s"}? This action cannot be
                  undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  disabled={isDeletingMembers}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeletingMembers}
                >
                  {isDeletingMembers ? (
                    <>
                      <span className="mr-2">Deleting...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={isDeleteGroupDialogOpen}
            onOpenChange={setIsDeleteGroupDialogOpen}
          >
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Delete Group</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete the group "
                  {groupToDelete?.name}"? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDeleteGroupDialogOpen(false);
                    setGroupToDelete(null);
                  }}
                  disabled={isDeletingGroup}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteGroup}
                  disabled={isDeletingGroup}
                >
                  {isDeletingGroup ? (
                    <>
                      <span className="mr-2">Deleting...</span>
                      <svg
                        className="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default MembersPage;
