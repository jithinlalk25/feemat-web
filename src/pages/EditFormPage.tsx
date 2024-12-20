import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FieldsPage } from "./form/FieldsPage";
import { SettingsPage } from "./form/SettingsPage";
import { SchedulePage } from "./form/SchedulePage";
import ApiService from "@/lib/api/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PencilIcon } from "lucide-react";
import { toast } from "sonner";

interface EditFormPageProps {
  formId: string;
  onCancel: () => void;
}

const EditFormPage = ({ formId, onCancel }: EditFormPageProps) => {
  const [formData, setFormData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleFormUpdate = (updates: any) => {
    setFormData((prev: any) => {
      // Create a deep copy of the previous state
      const newState = { ...prev };

      // Handle each top-level key in updates
      Object.keys(updates).forEach((key) => {
        if (typeof updates[key] === "object" && updates[key] !== null) {
          // For nested objects, merge with existing data
          newState[key] = {
            ...newState[key],
            ...updates[key],
          };
        } else {
          // For primitive values, simply update
          newState[key] = updates[key];
        }
      });

      // Ensure fields is always an array
      if (updates.fields !== undefined) {
        newState.fields = updates.fields;
      } else if (!newState.fields) {
        newState.fields = [];
      }

      return newState;
    });
  };

  const handleTitleUpdate = async () => {
    try {
      const updatedForm = await ApiService.updateForm(formId, {
        title: newTitle,
      });
      handleFormUpdate({ title: updatedForm.title });
      setIsEditingTitle(false);
      toast.success("Form title updated successfully");
    } catch (err) {
      console.error("Error updating form title:", err);
      toast.error("Failed to update form title");
    }
  };

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const data = await ApiService.getFormById(formId);
        setFormData({
          ...data,
          fields: data.fields || [],
        });
        setNewTitle(data.title);
      } catch (err) {
        setError("Failed to load form data");
        console.error("Error fetching form:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !formData) {
    return <div className=" text-red-500">{error || "Form not found"}</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{formData.title}</h1>
          <Dialog open={isEditingTitle} onOpenChange={setIsEditingTitle}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <PencilIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Form Title</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter form title"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditingTitle(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleTitleUpdate}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>

      <Tabs defaultValue="fields" className="w-full">
        <TabsList className="mb-4 w-full grid grid-cols-3 gap-4">
          <TabsTrigger value="fields" className="w-full">
            Fields
          </TabsTrigger>
          <TabsTrigger value="settings" className="w-full">
            Settings
          </TabsTrigger>
          <TabsTrigger value="schedule" className="w-full">
            Schedule
          </TabsTrigger>
        </TabsList>
        <TabsContent value="fields">
          <FieldsPage formData={formData} onUpdate={handleFormUpdate} />
        </TabsContent>
        <TabsContent value="settings">
          <SettingsPage formData={formData} onUpdate={handleFormUpdate} />
        </TabsContent>
        <TabsContent value="schedule">
          <SchedulePage formData={formData} onUpdate={handleFormUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EditFormPage;
