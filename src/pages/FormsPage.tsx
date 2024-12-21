import { useEffect, useState } from "react";
import ApiService from "../lib/api/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

const FormsPage = () => {
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const formsData = await ApiService.getForms();
        setForms(formsData);
      } catch (error) {
        console.error("Error fetching forms:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  const filteredForms = forms.filter((form) =>
    form.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateForm = async () => {
    if (!formTitle.trim()) return;

    try {
      setError(null);
      const response = await ApiService.createForm(formTitle);
      setIsDialogOpen(false);
      navigate(`/dashboard/forms/${response._id}`, {
        state: { openEditor: true },
      });
    } catch (error) {
      console.error("Error creating form:", error);
      setError("Failed to create form. Please try again.");
    }
  };

  const handleFormClick = (formId: string) => {
    navigate(`/dashboard/forms/${formId}`);
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Forms</h1>

      {/* Search and Create button */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>Create Form</Button>
      </div>

      {forms.length === 0 ? (
        <p className="text-gray-500">No forms created yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-4">Form Title</TableHead>
              <TableHead className="py-4">Status</TableHead>
              <TableHead className="py-4">Anonymous</TableHead>
              <TableHead className="py-4">Form Sent Count</TableHead>
              <TableHead className="py-4">Created At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredForms.map((form) => (
              <TableRow
                key={form._id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleFormClick(form._id)}
              >
                <TableCell className="font-medium py-4">{form.title}</TableCell>
                <TableCell className="py-4">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      form.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {form.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      form.isAnonymous
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {form.isAnonymous ? "Yes" : "No"}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  {form.formSentCount || 0}
                </TableCell>
                <TableCell className="py-4">
                  {format(new Date(form.createdAt), "PPp")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Form</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="formTitle" className="text-sm font-medium">
                Form Title
              </label>
              <Input
                id="formTitle"
                placeholder="Enter form title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setFormTitle("");
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateForm}>Next</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormsPage;
