"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { AssessmentQuestion, QuestionOption } from "@/lib/types";

interface QuestionRendererProps {
  question: AssessmentQuestion;
  value: string | string[] | number | null;
  onChange: (value: string | string[] | number) => void;
  disabled?: boolean;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  disabled = false,
}: QuestionRendererProps) {
  switch (question.type) {
    case "select":
      return (
        <SelectQuestion
          question={question}
          value={value as string}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    case "checkbox_multiple":
      return (
        <CheckboxQuestion
          question={question}
          values={(value as string[]) || []}
          onChange={(vals) => onChange(vals)}
          disabled={disabled}
        />
      );
    case "numeric_input":
      return (
        <NumericQuestion
          question={question}
          value={value as number}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    case "text":
      return (
        <TextQuestion
          question={question}
          value={(value as string) || ""}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    case "date":
      return (
        <DateQuestion
          question={question}
          value={(value as string) || ""}
          onChange={(val) => onChange(val)}
          disabled={disabled}
        />
      );
    default:
      return <p className="text-red-500">Unknown question type</p>;
  }
}

// Select Question (Radio buttons)
function SelectQuestion({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <RadioGroup
      value={value || ""}
      onValueChange={onChange}
      disabled={disabled}
      className="space-y-3"
    >
      {question.options?.map((option: QuestionOption) => (
        <div
          key={option.value}
          className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
            value === option.value
              ? "border-primary bg-primary/5"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <RadioGroupItem
            value={option.value}
            id={`${question.id}-${option.value}`}
            className="mt-0.5"
          />
          <Label
            htmlFor={`${question.id}-${option.value}`}
            className="flex-1 cursor-pointer font-normal"
          >
            {option.label}
          </Label>
        </div>
      ))}
    </RadioGroup>
  );
}

// Checkbox Question (Multiple selection)
function CheckboxQuestion({
  question,
  values,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  values: string[];
  onChange: (values: string[]) => void;
  disabled: boolean;
}) {
  const handleChange = (optionValue: string, checked: boolean) => {
    // Handle "none" option
    if (optionValue === "none" && checked) {
      onChange(["none"]);
      return;
    }

    // If selecting another option while "none" is selected, remove "none"
    let newValues = values.filter((v) => v !== "none");

    if (checked) {
      newValues = [...newValues, optionValue];
    } else {
      newValues = newValues.filter((v) => v !== optionValue);
    }

    onChange(newValues);
  };

  return (
    <div className="space-y-3">
      {question.options?.map((option: QuestionOption) => {
        const isChecked = values.includes(option.value);
        const isDisabledByNone =
          option.value !== "none" && values.includes("none");

        return (
          <div
            key={option.value}
            className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
              isChecked
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-gray-300"
            } ${isDisabledByNone ? "opacity-50" : ""}`}
          >
            <Checkbox
              id={`${question.id}-${option.value}`}
              checked={isChecked}
              onCheckedChange={(checked) =>
                handleChange(option.value, checked as boolean)
              }
              disabled={disabled || isDisabledByNone}
              className="mt-0.5"
            />
            <Label
              htmlFor={`${question.id}-${option.value}`}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.label}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

// Numeric Question
function NumericQuestion({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center gap-4">
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (!isNaN(num)) {
            onChange(num);
          }
        }}
        min={question.min}
        max={question.max}
        disabled={disabled}
        className="w-32"
      />
      {question.unit && (
        <span className="text-gray-500">{question.unit}</span>
      )}
    </div>
  );
}

// Text Question
function TextQuestion({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Enter your response..."
      disabled={disabled}
      rows={4}
      maxLength={500}
    />
  );
}

// Date Question
function DateQuestion({
  question,
  value,
  onChange,
  disabled,
}: {
  question: AssessmentQuestion;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Input
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-48"
    />
  );
}
