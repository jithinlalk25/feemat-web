import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import ApiService from "@/lib/api/api";
import { toast } from "sonner";

type FieldType = "rating" | "text" | "single-choice" | "multiple-choice";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  isRequired: boolean;
  options?: { id: string; value: string }[];
}

const getFieldTypeLabel = (type: FieldType): string => {
  switch (type) {
    case "rating":
      return "Rating";
    case "text":
      return "Text";
    case "single-choice":
      return "Single Choice";
    case "multiple-choice":
      return "Multiple Choice";
  }
};

interface FieldsPageProps {
  formData: {
    _id: string;
    fields: FormField[];
  };
  onUpdate: (updates: any) => void;
}

export const FieldsPage = ({ formData, onUpdate }: FieldsPageProps) => {
  const [fields, setFields] = useState<FormField[]>(formData.fields || []);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: crypto.randomUUID(),
      type,
      label: "",
      isRequired: true,
      options:
        type === "single-choice" || type === "multiple-choice"
          ? [{ id: crypto.randomUUID(), value: "" }]
          : undefined,
    };
    setFields([...fields, newField]);
    setIsDropdownOpen(false);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const deleteField = async (id: string) => {
    const updatedFields = fields.filter((field) => field.id !== id);

    try {
      const apiFields = updatedFields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        isRequired: field.isRequired,
        options: field.options,
      }));

      await toast.promise(
        ApiService.updateForm(formData._id, {
          fields: apiFields,
        }),
        {
          loading: "Deleting field...",
          success: "Field deleted",
          error: "Failed to delete field",
        }
      );

      setFields(updatedFields);
      onUpdate({ fields: apiFields });
    } catch (error) {
      console.error("Error saving fields after deletion:", error);
    }
  };

  const handleSaveFields = async () => {
    try {
      const apiFields = fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        isRequired: field.isRequired,
        options: field.options,
      }));

      const updates = { fields: apiFields };

      await toast.promise(ApiService.updateForm(formData._id, updates), {
        loading: "Saving fields...",
        success: "Fields saved successfully",
        error: "Failed to save fields",
      });

      onUpdate({ fields: apiFields });
    } catch (error) {
      console.error("Error saving fields:", error);
      toast.error("Failed to save fields");
    }
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= fields.length) return;

    const newFields = [...fields];
    const [movedField] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, movedField);
    setFields(newFields);
  };

  return (
    <div className="space-y-6 max-w-2xl px-8 pt-4">
      {/* Field List */}
      <div className="space-y-6">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            {/* Arrow buttons */}
            <div className="flex flex-col gap-1 pt-6">
              <button
                onClick={() => moveField(index, index - 1)}
                disabled={index === 0}
                className={`p-1 rounded hover:bg-gray-100 ${
                  index === 0 ? "text-gray-300" : "text-gray-500"
                }`}
                title="Move up"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <button
                onClick={() => moveField(index, index + 1)}
                disabled={index === fields.length - 1}
                className={`p-1 rounded hover:bg-gray-100 ${
                  index === fields.length - 1
                    ? "text-gray-300"
                    : "text-gray-500"
                }`}
                title="Move down"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Field Card */}
            <div className="flex-1 border-2 border-gray-300 bg-white shadow-sm p-6 rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Enter field label"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, { label: e.target.value })
                  }
                  className="border rounded px-2 py-1 w-full"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.isRequired}
                      onChange={(e) =>
                        updateField(field.id, {
                          isRequired: e.target.checked,
                        })
                      }
                      id={`isRequired-${field.id}`}
                    />
                    <label htmlFor={`isRequired-${field.id}`}>Required</label>
                  </div>

                  <div className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                    {getFieldTypeLabel(field.type)}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (field.id) {
                        deleteField(field.id);
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    title="Delete field"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                {(field.type === "single-choice" ||
                  field.type === "multiple-choice") && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Options:</div>
                    {field.options?.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="text"
                          value={option.value}
                          onChange={(e) => {
                            const newOptions = field.options?.map((opt) =>
                              opt.id === option.id
                                ? { ...opt, value: e.target.value }
                                : opt
                            );
                            updateField(field.id, {
                              options: newOptions,
                            });
                          }}
                          className="border rounded px-2 py-1 w-64"
                          placeholder="Enter option"
                        />
                        <button
                          onClick={() => {
                            const newOptions = field.options?.filter(
                              (opt) => opt.id !== option.id
                            );
                            updateField(field.id, {
                              options: newOptions,
                            });
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Delete option"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newOptions = [...(field.options || [])];
                        newOptions.push({
                          id: crypto.randomUUID(),
                          value: "",
                        });
                        updateField(field.id, {
                          options: newOptions,
                        });
                      }}
                      className="text-sm text-blue-500 hover:text-blue-700 mt-1"
                    >
                      Add Option
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Field Button with Dropdown and Save Button */}
      <div className="flex justify-between items-center relative">
        <div ref={dropdownRef}>
          <Button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            variant="default"
            className="flex items-center space-x-2"
          >
            <span>Add Field</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </Button>

          {isDropdownOpen && (
            <div className="absolute top-full w-48 bg-white rounded-lg shadow-lg border overflow-hidden z-10">
              {["rating", "text", "single-choice", "multiple-choice"].map(
                (type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleAddField(type as FieldType);
                      setIsDropdownOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                  >
                    {type
                      .split("-")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {fields.length > 0 && (
          <Button onClick={handleSaveFields} variant="default">
            Save Fields
          </Button>
        )}
      </div>
    </div>
  );
};
