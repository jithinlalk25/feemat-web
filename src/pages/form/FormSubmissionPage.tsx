import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import ApiService from "../../lib/api/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2 } from "lucide-react";

interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: { id: string; value: string }[];
}

interface FormData {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  companyName: string;
  isAnonymous: boolean;
  memberEmail?: string;
}

export default function FormSubmissionPage() {
  const { linkId } = useParams();
  const [formData, setFormData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Create a dynamic form schema based on the form fields
  const createFormSchema = (fields: FormField[]) => {
    const schemaFields: Record<string, any> = {};

    fields.forEach((field) => {
      let validator;
      switch (field.type) {
        case "text":
          validator = z.string();
          break;
        case "rating":
          validator = z.number().min(1).max(5);
          break;
        case "single-choice":
          validator = z.string();
          break;
        case "multiple-choice":
          validator = z.array(z.string());
          break;
        default:
          validator = z.string();
      }

      if (field.required) {
        validator = validator.min(1, "This field is required");
      } else {
        validator = validator.optional();
      }

      schemaFields[field.id] = validator;
    });

    return z.object(schemaFields);
  };

  const form = useForm<z.infer<ReturnType<typeof createFormSchema>>>({
    resolver: zodResolver(
      formData ? createFormSchema(formData.fields) : z.object({})
    ),
    defaultValues: {},
    mode: "onChange",
  });

  useEffect(() => {
    async function fetchFormData() {
      if (!linkId) return;

      try {
        const response = await ApiService.getFormByLink(linkId);
        setFormData({
          id: response.id,
          title: response.title,
          companyName: response.companyName,
          isAnonymous: response.isAnonymous,
          memberEmail: response.memberEmail,
          fields: response.fields.map((field) => ({
            id: field.id,
            label: field.label,
            type: field.type,
            required: field.isRequired,
            options: field.options,
          })),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch form");
      } finally {
        setLoading(false);
      }
    }

    fetchFormData();
  }, [linkId]);

  const onSubmit = async (
    values: z.infer<ReturnType<typeof createFormSchema>>
  ) => {
    if (!formData || !linkId) return;

    try {
      // Transform the values into the required format
      const transformedData = Object.entries(values).reduce(
        (acc, [fieldId, fieldValue]) => {
          // Find the field definition to get its type
          const field = formData.fields.find((f) => f.id === fieldId);
          if (!field) return acc;

          acc[fieldId] = {
            type: field.type,
            value: fieldValue,
          };

          return acc;
        },
        {} as Record<string, { type: string; value: any }>
      );

      const response = await ApiService.submitForm(
        linkId,
        formData.isAnonymous,
        transformedData
      );

      setIsSubmitted(true);
      console.log("Form submitted successfully:", response);
    } catch (err) {
      console.error("Failed to submit form:", err);
      // You might want to show an error message to the user here
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!formData) {
    return <div>Form not found</div>;
  }

  const renderField = (field: FormField, index: number) => {
    const numberedLabel = `${index + 1}. ${field.label}`;

    switch (field.type) {
      case "text":
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  {numberedLabel}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="pl-4">
                    <Textarea
                      {...formField}
                      className="text-sm min-h-[40px]"
                      maxLength={1000}
                    />
                    <div className="text-xs text-gray-500 mt-1 mb-[-12px] text-right">
                      {formField.value?.length || 0}/1000
                    </div>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        );

      case "rating":
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  {numberedLabel}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="pl-4">
                    <StarRating
                      value={Number(formField.value) || 0}
                      onChange={(rating) => formField.onChange(rating)}
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        );

      case "single-choice":
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  {numberedLabel}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="pl-4">
                    <RadioGroup
                      onValueChange={formField.onChange}
                      value={formField.value}
                    >
                      {field.options?.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-2"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`${field.id}-${option.id}`}
                          />
                          <label htmlFor={`${field.id}-${option.id}`}>
                            {option.value}
                          </label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        );

      case "multiple-choice":
        return (
          <FormField
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold">
                  {numberedLabel}
                  {field.required && <span className="text-red-500">*</span>}
                </FormLabel>
                <FormControl>
                  <div className="space-y-2 pl-4">
                    {field.options?.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          checked={(formField.value || []).includes(option.id)}
                          onCheckedChange={(checked) => {
                            const currentValues = formField.value || [];
                            const newValues = checked
                              ? [...currentValues, option.id]
                              : currentValues.filter(
                                  (val: string) => val !== option.id
                                );
                            formField.onChange(newValues);
                          }}
                        />
                        <label>{option.value}</label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        );

      default:
        return null;
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center gap-4 py-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
                    {formData.companyName.charAt(0)}
                  </div>
                  <span className="text-lg font-semibold">
                    {formData.companyName}
                  </span>
                </div>
                <h3 className="text-gray-600 text-sm mt-1">{formData.title}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold">
                  Response submitted successfully
                </h2>
              </div>
              <p className="text-gray-500 text-center">
                Thank you for your response!
              </p>
            </div>
          </CardContent>
        </Card>
        <div className="text-center mt-4 text-sm text-gray-500">
          Powered by <span className="font-semibold">Feemat</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-base font-bold">
              {formData.companyName.charAt(0)}
            </div>
            <span className="text-lg font-semibold">
              {formData.companyName}
            </span>
            {formData.isAnonymous && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                Anonymous
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold">{formData.title}</h1>
          {formData.description && (
            <p className="text-sm text-gray-600 font-medium">
              {formData.description}
            </p>
          )}
          <div className="mt-2 text-sm">
            {formData.isAnonymous ? (
              <p className="text-gray-600">
                Your response will be submitted{" "}
                <span className="font-bold italic">anonymously</span>
              </p>
            ) : (
              <p className="text-gray-600">
                Your response will be submitted as{" "}
                <span className="font-bold italic">{formData.memberEmail}</span>
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {formData.fields.map((field, index) => (
                <div key={field.id} className="text-sm">
                  {renderField(field, index)}
                </div>
              ))}

              <Button
                type="submit"
                size="lg"
                className="mt-6"
                disabled={!form.formState.isValid}
              >
                Submit
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      <div className="text-center mt-4 text-sm text-gray-500">
        Powered by <span className="font-semibold">Feemat</span>
      </div>
    </div>
  );
}
