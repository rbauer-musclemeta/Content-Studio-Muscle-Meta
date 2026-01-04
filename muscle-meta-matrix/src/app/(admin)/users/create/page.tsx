"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from "lucide-react";

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  age: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  sendAssessmentInvite: z.boolean().default(true),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

export default function CreateUserPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      sendAssessmentInvite: true,
    },
  });

  const sendInvite = watch("sendAssessmentInvite");

  const onSubmit = async (data: CreateUserFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          age: data.age ? parseInt(data.age) : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to create user");
        setIsSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/users");
      }, 1500);
    } catch (err) {
      setError("An unexpected error occurred");
      setIsSubmitting(false);
    }
  };

  // Generate a random password
  const generatePassword = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setValue("password", password);
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/users"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
        <p className="text-gray-500">
          Add a new member to the founding cohort
        </p>
      </div>

      {/* Form */}
      <Card className="max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>
              Enter the details for the new user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 rounded-md">
                <CheckCircle className="h-4 w-4" />
                User created successfully! Redirecting...
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                {...register("name")}
                disabled={isSubmitting}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                {...register("email")}
                disabled={isSubmitting}
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={generatePassword}
                  disabled={isSubmitting}
                >
                  Generate
                </Button>
              </div>
              <Input
                id="password"
                type="text"
                placeholder="Enter password"
                {...register("password")}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age (Optional)</Label>
                <Input
                  id="age"
                  type="number"
                  placeholder="45"
                  {...register("age")}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label>Gender (Optional)</Label>
                <Select
                  onValueChange={(value) =>
                    setValue(
                      "gender",
                      value as
                        | "MALE"
                        | "FEMALE"
                        | "OTHER"
                        | "PREFER_NOT_TO_SAY"
                    )
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">
                      Prefer not to say
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Checkbox
                id="sendAssessmentInvite"
                checked={sendInvite}
                onCheckedChange={(checked) =>
                  setValue("sendAssessmentInvite", checked as boolean)
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="sendAssessmentInvite"
                className="text-sm font-normal"
              >
                Send CRA assessment invitation email
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="flex-1"
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create User
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
