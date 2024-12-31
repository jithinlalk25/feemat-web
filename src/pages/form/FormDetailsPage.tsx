import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import ApiService from "../../lib/api/api";
import { Breadcrumb } from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Send, Pencil, Eye, MoreVertical, Trash, Loader2 } from "lucide-react";
import EditFormPage from "../EditFormPage";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { formatInTimeZone } from "date-fns-tz";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  LabelList,
  Legend,
} from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "../../components/ui/hover-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../../components/ui/chart";

interface FormSent {
  _id: string;
  formId: string;
  displayId: string;
  submissionCount: number;
  createdAt: string;
  updatedAt: string;
  fields: any;
}

interface FormSubmission {
  _id: string;
  data: Record<
    string,
    {
      type: string;
      value: string | number | string[];
    }
  >;
  isAnonymous: boolean;
  member: {
    _id: string;
    email: string;
  };
  createdAt: string;
}

interface ChartData {
  name: string;
  value: number;
}

interface TimeSeriesData {
  date: string;
  [key: string]: string | number;
}

const processRatingData = (
  submissions: FormSubmission[],
  field: any
): ChartData[] => {
  const counts: Record<number, number> = {};
  submissions.forEach((submission) => {
    const response: any = submission.data[field._id || field.id];
    if (response?.value) {
      counts[response.value] = (counts[response.value] || 0) + 1;
    }
  });

  return Object.entries(counts).map(([rating, count]) => ({
    name: `${rating} Star`,
    value: count,
  }));
};

const processChoiceData = (
  submissions: FormSubmission[],
  field: any
): ChartData[] => {
  const counts: Record<string, number> = {};

  submissions.forEach((submission) => {
    const response = submission.data[field._id || field.id];
    if (response?.value) {
      const values = Array.isArray(response.value)
        ? response.value
        : [response.value];

      values.forEach((optionId) => {
        const option = field.options?.find(
          (opt: any) => (opt._id || opt.id) === optionId
        );
        const optionValue = option?.value || optionId;
        counts[optionValue] = (counts[optionValue] || 0) + 1;
      });
    }
  });

  return Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
};

const calculateChartWidth = (dataLength: number) => {
  // Base width per bar (including margins) in pixels
  const widthPerBar = 80;
  // Minimum width for the chart
  const minWidth = 300;
  // Calculate total width based on number of bars
  const calculatedWidth = dataLength * widthPerBar;
  // Return the larger of calculated width or minimum width
  return Math.max(calculatedWidth, minWidth);
};

const processTimeSeriesRatingData = (
  formsSent: FormSent[],
  field: any,
  timezone: string
): TimeSeriesData[] => {
  return formsSent.map((formSent) => {
    const fieldData = (formSent as any).fields?.[field._id || field.id];
    const date = new Date(formSent.createdAt);

    return {
      date: formatInTimeZone(date, timezone, "MMM dd, yyyy"),
      time: formatInTimeZone(date, timezone, "hh:mm aa"),
      average: fieldData?.ratingAverage || 0,
    };
  });
};

const processTimeSeriesChoiceData = (
  formsSent: FormSent[],
  field: any,
  timezone: string
): TimeSeriesData[] => {
  const options = field.options.reduce(
    (acc: Record<string, string>, opt: any) => {
      acc[opt._id || opt.id] = opt.value;
      return acc;
    },
    {}
  );

  return formsSent.map((formSent) => {
    const fieldData = (formSent as any).fields?.[field._id || field.id];
    const optionCounts = fieldData?.options || {};
    const date = new Date(formSent.createdAt);

    const counts = Object.keys(options).reduce(
      (acc: Record<string, number>, optionId) => {
        const optionValue = options[optionId];
        acc[optionValue] = optionCounts[optionId] || 0;
        return acc;
      },
      {}
    );

    return {
      date: formatInTimeZone(date, timezone, "MMM dd, yyyy"),
      time: formatInTimeZone(date, timezone, "hh:mm aa"),
      ...counts,
    };
  });
};

const FormDetailsPage = () => {
  const { formId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState<any>(null);
  const [formsSent, setFormsSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timezone, setTimezone] = useState<string>("");
  const [isSending, setIsSending] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const fetchFormData = async () => {
    try {
      const [formData, formsSentData, groupsData, membersData] =
        await Promise.all([
          ApiService.getFormById(formId!),
          ApiService.getFormsSent(formId!),
          ApiService.getGroups(),
          ApiService.getMembers(),
        ]);
      setForm(formData);
      setFormsSent(formsSentData);
      setGroups(groupsData);
      setMembers(membersData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await fetchFormData();
      setLoading(false);
    };

    fetchData();
  }, [formId]);

  useEffect(() => {
    if (!isEditing) {
      fetchFormData();
    }
  }, [isEditing]);

  useEffect(() => {
    // Get timezone from localStorage or fall back to system timezone
    const storedTimezone =
      localStorage.getItem("timezone") ||
      Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(storedTimezone);
  }, []);

  const canSendForm = (form: any) => {
    // Check if form has at least one field
    const hasFields = form.fields && form.fields.length > 0;

    // Check if form has at least one member or group
    const hasMembers =
      form.members &&
      ((form.members.memberIds && form.members.memberIds.length > 0) ||
        (form.members.groupIds && form.members.groupIds.length > 0));

    return hasFields && hasMembers;
  };

  const getMissingRequirements = (form: any) => {
    const missing: string[] = [];

    if (!form.fields || form.fields.length === 0) {
      missing.push("at least one field");
    }

    if (
      !form.members ||
      (!form.members.memberIds?.length && !form.members.groupIds?.length)
    ) {
      missing.push("at least one member or group");
    }

    return missing;
  };

  useEffect(() => {
    // Check if we should open the editor (when coming from form creation)
    if (location.state?.openEditor) {
      setIsEditing(true);
    }
  }, [location.state]);

  const handleViewSubmissions = async (formSentId: string) => {
    setIsDialogOpen(true);
    setLoadingSubmissions(true);

    try {
      const submissionsData = await ApiService.getFormSubmissions(formSentId);
      console.log("Form:", form);
      console.log("Submissions:", submissionsData);
      setSubmissions(submissionsData);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const handleSendForm = async () => {
    setIsSending(true);
    try {
      await ApiService.sendForm(formId!);
      // Refresh the forms sent list
      const formsSentData = await ApiService.getFormsSent(formId!);
      setFormsSent(formsSentData);
      toast.success("Form has been sent successfully");
      setIsSendDialogOpen(false);
    } catch (error) {
      console.error("Error sending form:", error);
      toast.error("Failed to send form. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteForm = async () => {
    try {
      await ApiService.deleteForm(formId!);
      toast.success("Form deleted successfully");
      navigate("/dashboard/forms");
    } catch (error) {
      console.error("Error deleting form:", error);
      toast.error("Failed to delete form. Please try again.");
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  const renderSubmissionsTable = () => {
    if (loadingSubmissions) {
      return <div className="py-8 text-center">Loading submissions...</div>;
    }

    if (submissions.length === 0) {
      return <div className="py-8 text-center">No submissions found</div>;
    }

    // Add safety checks and debug logs
    console.log("Form:", form);
    if (!form || !form.fields) {
      console.error("Form or form fields are missing");
      return (
        <div className="py-8 text-center">Error: Form data is missing</div>
      );
    }

    const fields = form.fields;

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Respondent</TableHead>
              <TableHead>Date</TableHead>
              {fields.map((field: any) => (
                <TableHead key={field._id || field.id}>{field.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => {
              if (!submission || !submission.data) {
                console.error("Invalid submission:", submission);
                return null;
              }

              return (
                <TableRow key={submission._id}>
                  <TableCell className="font-semibold">
                    {submission.isAnonymous
                      ? "Anonymous"
                      : submission.member?.email || "No email"}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {submission.createdAt &&
                    !isNaN(new Date(submission.createdAt).getTime())
                      ? formatInTimeZone(
                          new Date(submission.createdAt),
                          timezone,
                          "MMM d, yyyy h:mm a"
                        )
                      : "N/A"}
                  </TableCell>
                  {fields.map((field: any) => {
                    const fieldId = field._id || field.id;
                    const response = submission.data[fieldId];
                    let displayValue = "";

                    if (response && response.value !== undefined) {
                      try {
                        switch (field.type) {
                          case "multiple-choice":
                            if (Array.isArray(response.value)) {
                              displayValue = response.value
                                .map((optionId: string) => {
                                  const option = field.options?.find(
                                    (opt: any) =>
                                      (opt._id || opt.id) === optionId
                                  );
                                  return option?.value || optionId;
                                })
                                .join(", ");
                            }
                            break;
                          case "single-choice":
                            const option = field.options?.find(
                              (opt: any) =>
                                (opt._id || opt.id) === response.value
                            );
                            displayValue = option?.value || response.value;
                            break;
                          default:
                            displayValue = String(response.value);
                        }
                      } catch (error) {
                        console.error(
                          "Error processing field:",
                          field,
                          "response:",
                          response,
                          "error:",
                          error
                        );
                        displayValue = "Error";
                      }
                    }

                    return (
                      <TableCell key={fieldId}>{displayValue || ""}</TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {submissions.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            No submissions found
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Loading form details...
          </p>
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="p-8">
        <p>Form not found</p>
      </div>
    );
  }

  const breadcrumbItems = [
    { href: "/dashboard/forms", label: "Forms" },
    {
      href: `/dashboard/forms/${formId}`,
      label: "Details",
      onClick: (e: React.MouseEvent) => {
        if (isEditing) {
          e.preventDefault();
          setIsEditing(false);
        }
      },
    },
    ...(isEditing
      ? [{ href: `/dashboard/forms/${formId}`, label: "Edit" }]
      : []),
  ];

  return (
    <div className="p-8">
      <Breadcrumb items={breadcrumbItems} />
      {!isEditing ? (
        <>
          <div className="mt-6 flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">{form.title}</h1>
            <div className="flex items-center gap-2">
              <AlertDialog
                open={isSendDialogOpen}
                onOpenChange={(open) => {
                  if (!isSending) {
                    setIsSendDialogOpen(open);
                  }
                }}
              >
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <div>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!canSendForm(form)}
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Send Form Now
                        </Button>
                      </AlertDialogTrigger>
                    </div>
                  </HoverCardTrigger>
                  {!canSendForm(form) && (
                    <HoverCardContent align="end" className="w-80">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">
                          Cannot send form
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          This form requires{" "}
                          {getMissingRequirements(form).join(" and ")} before it
                          can be sent.
                        </p>
                      </div>
                    </HoverCardContent>
                  )}
                </HoverCard>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Form</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to send this form? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isSending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={(e) => {
                        e.preventDefault();
                        handleSendForm();
                      }}
                      disabled={isSending}
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        "Send"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Form
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="w-4 h-4 mr-2" />
                    Delete Form
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Form</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this form? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteForm}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="mt-8">
            <Tabs
              defaultValue="details"
              onValueChange={() => {
                if (!isEditing) {
                  fetchFormData();
                }
              }}
            >
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">
                  Details
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  Form Sent History
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex-1">
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Fields ({form.fields?.length || 0})
                        </h3>
                        <div className="space-y-2">
                          {form.fields?.map((field: any) => (
                            <div
                              key={field._id || field.id}
                              className="flex flex-col py-2"
                            >
                              <div className="flex items-center">
                                <div className="font-medium">
                                  {field.label}
                                  {field.isRequired && (
                                    <span className="text-destructive ml-0.5">
                                      *
                                    </span>
                                  )}
                                  <span className="text-sm text-muted-foreground ml-2">
                                    ({field.type})
                                  </span>
                                </div>
                              </div>
                              {(field.type === "single-choice" ||
                                field.type === "multiple-choice") &&
                                field.options && (
                                  <div className="mt-1 ml-4">
                                    {field.options.map((option: any) => (
                                      <div
                                        key={option._id || option.id}
                                        className="text-sm text-muted-foreground"
                                      >
                                        • {option.value}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                          ))}
                          {(!form.fields || form.fields.length === 0) && (
                            <div className="text-sm text-muted-foreground">
                              No fields added
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Form Settings
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <span className="font-medium">
                              {form.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Anonymous Submissions
                            </span>
                            <span className="font-medium">
                              {form.isAnonymous ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Expiry Time
                            </span>
                            <span className="font-medium">
                              {form.expiryTime === "no_expiry"
                                ? "Never"
                                : form.expiryTime === "6_hours"
                                ? "6 Hours"
                                : form.expiryTime === "12_hours"
                                ? "12 Hours"
                                : form.expiryTime === "1_day"
                                ? "1 Day"
                                : form.expiryTime === "3_days"
                                ? "3 Days"
                                : "Never"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Send Reminder Email
                            </span>
                            <span className="font-medium">
                              {form.reminderEmail ? "Yes" : "No"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">Schedule</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Type</span>
                            <span className="font-medium">
                              {form.schedule?.type === "no_schedule"
                                ? "No Schedule"
                                : form.schedule?.type === "one_time"
                                ? "One Time"
                                : form.schedule?.type === "recurring"
                                ? "Recurring"
                                : "No Schedule"}
                            </span>
                          </div>
                          {form.schedule?.type === "one_time" && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Date and Time
                              </span>
                              <span className="font-medium">
                                {form.schedule.date && form.schedule.time
                                  ? formatInTimeZone(
                                      new Date(
                                        `${form.schedule.date}T${form.schedule.time}`
                                      ),
                                      timezone,
                                      "PPP HH:mm"
                                    )
                                  : "Not set"}
                              </span>
                            </div>
                          )}
                          {form.schedule?.type === "recurring" && (
                            <>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Start Time
                                </span>
                                <span className="font-medium">
                                  {form.schedule.recurringTime || "Not set"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Frequency
                                </span>
                                <span className="font-medium capitalize">
                                  {form.schedule.frequency || "Not set"}
                                </span>
                              </div>
                              {form.schedule.frequency === "weekly" &&
                                form.schedule.weekDays && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Days
                                    </span>
                                    <span className="font-medium">
                                      {form.schedule.weekDays
                                        .map((day: number) => {
                                          const dayName = [
                                            "Monday",
                                            "Tuesday",
                                            "Wednesday",
                                            "Thursday",
                                            "Friday",
                                            "Saturday",
                                            "Sunday",
                                          ][day - 1];
                                          return dayName;
                                        })
                                        .join(", ")}
                                    </span>
                                  </div>
                                )}
                              {form.schedule.frequency === "monthly" &&
                                form.schedule.monthDays && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      Days of Month
                                    </span>
                                    <span className="font-medium">
                                      {form.schedule.monthDays.join(", ")}
                                    </span>
                                  </div>
                                )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  End Condition
                                </span>
                                <span className="font-medium">
                                  {form.schedule.endCondition === "no_end_date"
                                    ? "No end date"
                                    : form.schedule.endCondition ===
                                      "end_by_date"
                                    ? "End by date"
                                    : "Not set"}
                                </span>
                              </div>
                              {form.schedule.endCondition === "end_by_date" &&
                                form.schedule.endDate && (
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                      End Date
                                    </span>
                                    <span className="font-medium">
                                      {formatInTimeZone(
                                        new Date(form.schedule.endDate),
                                        timezone,
                                        "PPP"
                                      )}
                                    </span>
                                  </div>
                                )}
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Recipients
                        </h3>
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Groups ({form.members?.groupIds?.length || 0})
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {form.members?.groupIds?.length > 0
                                ? form.members.groupIds
                                    .map((groupId: string) => {
                                      const group = groups.find(
                                        (g) => g._id === groupId
                                      );
                                      return group?.name || "Unknown Group";
                                    })
                                    .join(", ")
                                : "No groups added"}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium mb-2">
                              Members ({form.members?.memberIds?.length || 0})
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              {form.members?.memberIds?.length > 0
                                ? form.members.memberIds
                                    .map((memberId: string) => {
                                      const member = members.find(
                                        (m) => m._id === memberId
                                      );
                                      return member?.email || "Unknown Member";
                                    })
                                    .join(", ")
                                : "No members added"}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold mb-2">
                          Timestamps
                        </h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Created At
                            </span>
                            <span className="font-medium">
                              {form.createdAt &&
                              !isNaN(new Date(form.createdAt).getTime())
                                ? formatInTimeZone(
                                    new Date(form.createdAt),
                                    timezone,
                                    "MMM d, yyyy h:mm a"
                                  )
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Updated At
                            </span>
                            <span className="font-medium">
                              {form.updatedAt &&
                              !isNaN(new Date(form.updatedAt).getTime())
                                ? formatInTimeZone(
                                    new Date(form.updatedAt),
                                    timezone,
                                    "MMM d, yyyy h:mm a"
                                  )
                                : "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Id</TableHead>
                        <TableHead>Form Sent Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission Count</TableHead>
                        <TableHead>Expiry</TableHead>
                        <TableHead>Submissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...formsSent]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .map((formSent) => {
                          const now = new Date();
                          const isExpired =
                            formSent.expiresAt &&
                            new Date(formSent.expiresAt) < now;
                          const statusClass = isExpired
                            ? "text-destructive font-medium"
                            : "text-green-600 font-medium";

                          return (
                            <TableRow key={formSent._id}>
                              <TableCell>{formSent.displayId}</TableCell>
                              <TableCell>
                                {formatInTimeZone(
                                  new Date(formSent.createdAt),
                                  timezone,
                                  "MMM d, yyyy h:mm a"
                                )}
                              </TableCell>
                              <TableCell>
                                <span className={statusClass}>
                                  {isExpired ? "Expired" : "Active"}
                                </span>
                              </TableCell>
                              <TableCell>{formSent.submissionCount}</TableCell>
                              <TableCell>
                                {formSent.expiresAt
                                  ? formatInTimeZone(
                                      new Date(formSent.expiresAt),
                                      timezone,
                                      "MMM d, yyyy h:mm a"
                                    )
                                  : "Never"}
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewSubmissions(formSent._id)
                                  }
                                  disabled={formSent.submissionCount === 0}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Submissions
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                  {formsSent.length === 0 && (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No form sent history found
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="insights" className="mt-4">
                <div className="grid gap-8">
                  {formsSent.some(
                    (formSent) => formSent.submissionCount > 0
                  ) ? (
                    <>
                      {/* Chart Fields Section */}
                      {form.fields
                        .filter((field: any) =>
                          [
                            "rating",
                            "single-choice",
                            "multiple-choice",
                          ].includes(field.type)
                        )
                        .map((field: any) => {
                          const latest10FormsSent = [...formsSent]
                            .filter((formSent) => formSent.submissionCount > 0)
                            .sort(
                              (a, b) =>
                                new Date(b.createdAt).getTime() -
                                new Date(a.createdAt).getTime()
                            )
                            .slice(0, 10)
                            .reverse();

                          let chartData: TimeSeriesData[] = [];
                          let config: Record<string, any> = {};

                          if (field.type === "rating") {
                            chartData = processTimeSeriesRatingData(
                              latest10FormsSent,
                              field,
                              timezone
                            );
                            config = {
                              average: {
                                label: "Average Rating",
                                color: "hsl(var(--chart-1))",
                              },
                            };
                          } else if (
                            ["single-choice", "multiple-choice"].includes(
                              field.type
                            )
                          ) {
                            chartData = processTimeSeriesChoiceData(
                              latest10FormsSent,
                              field,
                              timezone
                            );
                            // Create config for each option with different colors
                            field.options.forEach(
                              (option: any, index: number) => {
                                config[option.value] = {
                                  label: option.value,
                                  color: `hsl(var(--chart-${
                                    (index % 12) + 1
                                  }))`,
                                };
                              }
                            );
                          }

                          return (
                            <Card
                              key={field._id || field.id}
                              className="overflow-hidden"
                            >
                              <CardHeader>
                                <CardTitle>{field.label}</CardTitle>
                              </CardHeader>
                              <CardContent className="p-6">
                                <div className="aspect-[3/1] w-full">
                                  <ResponsiveContainer
                                    width="100%"
                                    height="100%"
                                  >
                                    <ChartContainer config={config}>
                                      <LineChart
                                        data={chartData}
                                        margin={{
                                          top: 20,
                                          left: 12,
                                          right: 36,
                                          bottom: 20,
                                        }}
                                      >
                                        <CartesianGrid vertical={false} />
                                        <XAxis
                                          dataKey="date"
                                          tickLine={false}
                                          axisLine={false}
                                          tickMargin={16}
                                          height={60}
                                          interval={0}
                                          tick={({ x, y, payload }) => (
                                            <g
                                              transform={`translate(${x},${y})`}
                                            >
                                              <text
                                                x={0}
                                                y={0}
                                                dy={0}
                                                textAnchor="middle"
                                                fill="#888888"
                                                fontSize={12}
                                              >
                                                {payload.value}
                                              </text>
                                              <text
                                                x={0}
                                                y={0}
                                                dy={20}
                                                textAnchor="middle"
                                                fill="#888888"
                                                fontSize={12}
                                              >
                                                {chartData[payload.index]?.time}
                                              </text>
                                            </g>
                                          )}
                                        />
                                        <YAxis
                                          stroke="#888888"
                                          fontSize={12}
                                          tickLine={false}
                                          axisLine={false}
                                          allowDecimals={false}
                                          domain={
                                            field.type === "rating"
                                              ? [0, 5]
                                              : [0, "auto"]
                                          }
                                          ticks={
                                            field.type === "rating"
                                              ? [0, 1, 2, 3, 4, 5]
                                              : undefined
                                          }
                                        />
                                        <ChartTooltip
                                          cursor={false}
                                          content={
                                            <ChartTooltipContent indicator="line" />
                                          }
                                        />
                                        {field.type !== "rating" && (
                                          <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            iconSize={8}
                                            formatter={(value) => (
                                              <span className="text-sm">
                                                {value}
                                              </span>
                                            )}
                                          />
                                        )}
                                        {field.type === "rating" ? (
                                          <Line
                                            type="natural"
                                            dataKey="average"
                                            stroke="hsl(var(--chart-1))"
                                            strokeWidth={2}
                                            dot={{
                                              fill: "hsl(var(--chart-1))",
                                              r: 4,
                                            }}
                                            activeDot={{
                                              r: 6,
                                            }}
                                          >
                                            <LabelList
                                              dataKey="average"
                                              position="top"
                                              offset={10}
                                              fill="#888888"
                                              fontSize={12}
                                            />
                                          </Line>
                                        ) : (
                                          field.options.map(
                                            (option: any, index: number) => (
                                              <Line
                                                key={option._id || option.id}
                                                type="natural"
                                                dataKey={option.value}
                                                stroke={`hsl(var(--chart-${
                                                  (index % 12) + 1
                                                }))`}
                                                strokeWidth={2}
                                                dot={{
                                                  fill: `hsl(var(--chart-${
                                                    (index % 12) + 1
                                                  }))`,
                                                  r: 4,
                                                }}
                                                activeDot={{
                                                  r: 6,
                                                }}
                                              >
                                                <LabelList
                                                  dataKey={option.value}
                                                  position="top"
                                                  offset={10}
                                                  fill="#888888"
                                                  fontSize={12}
                                                />
                                              </Line>
                                            )
                                          )
                                        )}
                                      </LineChart>
                                    </ChartContainer>
                                  </ResponsiveContainer>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}

                      {/* Text Fields Section - Always Last */}
                      {form.fields
                        .filter((field: any) => field.type === "text")
                        .map((field: any) => (
                          <div
                            key={field._id || field.id}
                            className="p-4 border rounded-lg space-y-4"
                          >
                            <h3 className="text-lg font-semibold mb-2">
                              {field.label}
                            </h3>
                            <div className="flex items-center justify-center h-[300px] bg-gray-50 rounded-lg">
                              <div className="text-center space-y-2">
                                <div className="text-muted-foreground">
                                  AI-powered response summary coming soon
                                </div>
                                <div className="text-sm text-muted-foreground/60">
                                  We'll analyze and summarize text responses to
                                  provide meaningful insights
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </>
                  ) : (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      No insights available. Forms need to have submissions to
                      generate insights.
                    </div>
                  )}
                  {formsSent.some((formSent) => formSent.submissionCount > 0) &&
                    form.fields.filter((field: any) =>
                      [
                        "rating",
                        "single-choice",
                        "multiple-choice",
                        "text",
                      ].includes(field.type)
                    ).length === 0 && (
                      <div className="text-center py-8 text-sm text-muted-foreground">
                        No insights available. Add rating, choice, or text
                        questions to see insights.
                      </div>
                    )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </>
      ) : (
        <EditFormPage formId={formId!} onCancel={() => setIsEditing(false)} />
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[90vw] h-[95vh] max-w-6xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {form.title} - Responses
            </DialogTitle>
          </DialogHeader>
          <Tabs
            defaultValue="submissions"
            className="w-full h-[calc(95vh-120px)] flex flex-col"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="submissions" className="flex-1">
                Submissions
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex-1">
                Insights
              </TabsTrigger>
            </TabsList>
            <TabsContent value="submissions" className="flex-1 overflow-auto">
              {renderSubmissionsTable()}
            </TabsContent>
            <TabsContent value="insights" className="flex-1 overflow-auto">
              <div className="flex flex-wrap gap-8 p-4">
                {/* Chart Fields Section */}
                {form.fields
                  .filter((field: any) =>
                    ["rating", "single-choice", "multiple-choice"].includes(
                      field.type
                    )
                  )
                  .map((field: any) => {
                    let chartData: ChartData[] = [];

                    if (field.type === "rating") {
                      chartData = processRatingData(submissions, field);
                    } else if (
                      ["single-choice", "multiple-choice"].includes(field.type)
                    ) {
                      chartData = processChoiceData(submissions, field);
                    }

                    return (
                      <div
                        key={field._id || field.id}
                        className="p-4 border rounded-lg space-y-4 shrink-0"
                        style={{
                          width: `${calculateChartWidth(chartData.length)}px`,
                        }}
                      >
                        <h3 className="text-lg font-semibold">{field.label}</h3>
                        <div className="h-[240px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={chartData}
                              margin={{
                                left: 0,
                                right: 24,
                                top: 8,
                                bottom: 48,
                              }}
                            >
                              <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                angle={-45}
                                textAnchor="end"
                                height={60}
                              />
                              <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                domain={[0, "auto"]}
                              />
                              <Tooltip />
                              <Bar
                                dataKey="value"
                                fill="currentColor"
                                radius={[4, 4, 0, 0]}
                                className="fill-primary"
                                barSize={24}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  })}

                {/* Text Fields Section - Always Last */}
                {form.fields
                  .filter((field: any) => field.type === "text")
                  .map((field: any) => (
                    <div
                      key={field._id || field.id}
                      className="p-4 border rounded-lg space-y-4 w-full"
                    >
                      <h3 className="text-lg font-semibold">{field.label}</h3>
                      <div className="flex items-center justify-center h-[240px] bg-gray-50 rounded-lg">
                        <div className="text-center space-y-2">
                          <div className="text-muted-foreground">
                            AI-powered response summary coming soon
                          </div>
                          <div className="text-sm text-muted-foreground/60">
                            We'll analyze and summarize text responses to
                            provide meaningful insights
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                {form.fields.filter((field: any) =>
                  [
                    "rating",
                    "single-choice",
                    "multiple-choice",
                    "text",
                  ].includes(field.type)
                ).length === 0 && (
                  <div className="w-full text-center py-8 text-sm text-muted-foreground">
                    No insights available. Add rating, choice, or text questions
                    to see insights.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormDetailsPage;
