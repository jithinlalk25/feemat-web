import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ApiService from "../../lib/api/api";
import { Breadcrumb } from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { Send, Pencil, Eye, MoreVertical } from "lucide-react";
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
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
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

interface FormSent {
  _id: string;
  formId: string;
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
  field: any
): TimeSeriesData[] => {
  return formsSent.map((formSent) => {
    // Get the field data using field ID as key
    const fieldData = (formSent as any).fields?.[field._id || field.id];

    return {
      date: format(new Date(formSent.createdAt), "MMM d"),
      average: fieldData?.ratingAverage || 0,
    };
  });
};

const processTimeSeriesChoiceData = (
  formsSent: FormSent[],
  field: any
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

    // Initialize counts for all options
    const counts = Object.keys(options).reduce(
      (acc: Record<string, number>, optionId) => {
        // Get the option value (label) for this optionId
        const optionValue = options[optionId];
        // Get the count from optionCounts or default to 0
        acc[optionValue] = optionCounts[optionId] || 0;
        return acc;
      },
      {}
    );

    return {
      date: format(new Date(formSent.createdAt), "MMM d"),
      ...counts,
    };
  });
};

const FormDetailsPage = () => {
  const { formId } = useParams();
  const location = useLocation();
  const [form, setForm] = useState<any>(null);
  const [formsSent, setFormsSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFormSentId, setSelectedFormSentId] = useState<string | null>(
    null
  );
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);

  useEffect(() => {
    // Check if we should open the editor (when coming from form creation)
    if (location.state?.openEditor) {
      setIsEditing(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formData, formsSentData] = await Promise.all([
          ApiService.getFormById(formId!),
          ApiService.getFormsSent(formId!),
        ]);
        setForm(formData);
        setFormsSent(formsSentData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [formId]);

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
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
      label: isEditing ? "Edit" : "Details",
    },
  ];

  const handleViewSubmissions = async (formSentId: string) => {
    setSelectedFormSentId(formSentId);
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
    try {
      await ApiService.sendForm(formId!);
      // Refresh the forms sent list
      const formsSentData = await ApiService.getFormsSent(formId!);
      setFormsSent(formsSentData);
      toast.success("Form has been sent successfully");
    } catch (error) {
      console.error("Error sending form:", error);
      toast.error("Failed to send form. Please try again.");
    } finally {
      setIsSendDialogOpen(false);
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
                onOpenChange={setIsSendDialogOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Send className="w-4 h-4 mr-2" />
                    Send Form Now
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send Form</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to send this form? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSendForm}>
                      Send
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
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mt-8">
            <Tabs defaultValue="history">
              <TabsList className="w-full">
                <TabsTrigger value="history" className="flex-1">
                  Form Sent History
                </TabsTrigger>
                <TabsTrigger value="insights" className="flex-1">
                  Insights
                </TabsTrigger>
              </TabsList>

              <TabsContent value="history" className="mt-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Form Sent Date</TableHead>
                        <TableHead>Submission Count</TableHead>
                        <TableHead>Submissions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formsSent.map((formSent) => (
                        <TableRow key={formSent._id}>
                          <TableCell>
                            {format(
                              new Date(formSent.createdAt),
                              "MMM d, yyyy p"
                            )}
                          </TableCell>
                          <TableCell>{formSent.submissionCount}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleViewSubmissions(formSent._id)
                              }
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Submissions
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
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
                <div className="space-y-8">
                  {form.fields
                    .filter((field: any) =>
                      ["rating", "single-choice", "multiple-choice"].includes(
                        field.type
                      )
                    )
                    .map((field: any) => {
                      const latest10FormsSent = [...formsSent]
                        .sort(
                          (a, b) =>
                            new Date(b.createdAt).getTime() -
                            new Date(a.createdAt).getTime()
                        )
                        .slice(0, 10)
                        .reverse();

                      let chartData: TimeSeriesData[] = [];
                      let lines: { dataKey: string; name: string }[] = [];

                      if (field.type === "rating") {
                        chartData = processTimeSeriesRatingData(
                          latest10FormsSent,
                          field
                        );
                        lines = [
                          { dataKey: "average", name: "Average Rating" },
                        ];
                      } else if (
                        ["single-choice", "multiple-choice"].includes(
                          field.type
                        )
                      ) {
                        chartData = processTimeSeriesChoiceData(
                          latest10FormsSent,
                          field
                        );
                        lines = field.options.map((opt: any) => ({
                          dataKey: opt.value,
                          name: opt.value,
                        }));
                      }

                      return (
                        <div
                          key={field._id || field.id}
                          className="p-4 border rounded-lg space-y-4"
                        >
                          <h3 className="text-lg font-semibold">
                            {field.label}
                          </h3>
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={chartData}
                                margin={{
                                  left: 0,
                                  right: 24,
                                  top: 8,
                                  bottom: 8,
                                }}
                              >
                                <XAxis
                                  dataKey="date"
                                  stroke="#888888"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                />
                                <YAxis
                                  stroke="#888888"
                                  fontSize={12}
                                  tickLine={false}
                                  axisLine={false}
                                  allowDecimals={false}
                                />
                                <Tooltip />
                                <Legend />
                                {lines.map((line, index) => (
                                  <Line
                                    key={line.dataKey}
                                    type="monotone"
                                    dataKey={line.dataKey}
                                    name={line.name}
                                    stroke={`hsl(${index * 60}, 70%, 50%)`}
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                  />
                                ))}
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      );
                    })}
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
                              margin={{ left: 0, right: 24, top: 8, bottom: 8 }}
                            >
                              <XAxis
                                dataKey="name"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                              />
                              <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                                width={24}
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
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormDetailsPage;
