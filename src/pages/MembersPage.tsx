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

type SortDirection = "asc" | "desc" | null;

const MembersPage = () => {
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

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await ApiService.getMembers();
        console.log(data);
        setMembers(data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
        // You might want to add error handling here
      } finally {
      }
    };

    fetchMembers();
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

  const handleDelete = async () => {
    try {
      await ApiService.deleteMembers(selectedRows);
      // Remove deleted members from the state
      setMembers(
        members.filter((member) => !selectedRows.includes(member._id))
      );
      // Clear selection
      setSelectedRows([]);
      toast.success("Members deleted successfully");
    } catch (error) {
      console.error("Failed to delete members:", error);
      toast.error("Failed to delete members");
    }
  };

  const handleAddMember = () => {
    setIsDialogOpen(true);
  };

  const handleSaveMembers = async () => {
    // Split emails by newline and/or comma, and filter out empty lines
    const emails = emailsInput
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter((email) => email !== "");

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    try {
      const response = await ApiService.bulkCreateMembers(emails);

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
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await ApiService.deleteGroup(groupId);

      // Update local state to remove the deleted group
      setGroups((prevGroups) =>
        prevGroups.filter((group) => group._id !== groupId)
      );

      // Refresh members data to update their group associations
      const updatedMembers = await ApiService.getMembers();
      setMembers(updatedMembers);

      toast.success("Group deleted successfully");
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error("Failed to delete group");
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

    try {
      // Process emails if provided
      const emails = newGroupEmails
        .split(/[\n,]/)
        .map((email) => email.trim())
        .filter((email) => email !== "");

      // Create group with name and optional emails
      await ApiService.createGroup(newGroupName, emails);

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

    const emails = addMembersInput
      .split(/[\n,]/)
      .map((email) => email.trim())
      .filter((email) => email !== "");

    if (emails.length === 0) {
      toast.error("Please enter at least one email address");
      return;
    }

    try {
      const response: any = await ApiService.addToGroup(
        selectedGroupId,
        emails
      );

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
    }
  };

  const handleRenameGroup = async () => {
    if (!groupToRename || !newGroupNameInput.trim()) return;

    try {
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Members</h1>
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
                    onClick={handleDelete}
                  >
                    Delete {selectedRows.length} selected
                  </Button>
                )}
              </div>
              <Button onClick={handleAddMember}>Add Members</Button>
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
                        selectedRows.includes(member._id) ? "bg-muted/50" : ""
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
                          ? member.groups.map((group) => group.name).join(", ")
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
        ) : (
          <div>
            {/* Add search input for groups */}
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
                const sortDirection = groupSortDirections[group._id] || "asc";
                const selectedMembers = selectedGroupMembers[group._id] || [];
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
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
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
                                onClick={() => handleDeleteGroup(group._id)}
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
                                  value={groupSearchQueries[group._id] || ""}
                                  onChange={(e) =>
                                    handleGroupSearch(group._id, e.target.value)
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
                                >
                                  Remove {selectedMembers.length} from group
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
                                  onClick={() => toggleGroupSort(group._id)}
                                  className="hover:bg-transparent px-2"
                                >
                                  Created At
                                  {groupSortDirections[group._id] === "asc" ? (
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
                                      toggleGroupMember(group._id, member._id)
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
                  {groups.length === 0
                    ? "No groups found"
                    : "No matching groups found"}
                </div>
              )}
            </div>
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
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveMembers}>Save</Button>
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
            <Button onClick={handleCreateGroup}>Create</Button>
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
            <Button onClick={handleAddMembersToGroup}>Add Members</Button>
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
            <Button onClick={handleRenameGroup}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersPage;
