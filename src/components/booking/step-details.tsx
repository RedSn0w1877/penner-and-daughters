"use client";

// © 2026 HVNF Studios. All rights reserved. Portfolio sample — do not redistribute.

/**
 * Step 4, "Your details": fill in the blanks. Ink underlines, sentence-case labels, what you type
 * in mono at 17px (so iOS doesn't zoom). Errors appear after the first try, under each field,
 * and clear as you fix them. No account, no VIN.
 */
import { SHOP } from "@/lib/facts";

export interface Details {
  name: string;
  mobile: string;
  vehicle: string;
  notes: string;
}

type Required = "name" | "mobile" | "vehicle";
export type DetailErrors = Partial<Record<Required, string>>;

export const DETAIL_FIELDS = {
  name: { label: "Your name", error: "Add your name so we know who to ask for." },
  mobile: { label: "Mobile number", error: "Add a mobile number so we can text you photos." },
  vehicle: {
    label: "Year, make and model",
    error: "Add the year, make and model. A rough guess is fine.",
    placeholder: SHOP.exampleCar.description,
  },
  notes: { label: "Anything else? (optional)" },
} as const;

/** A mobile number needs at least 10 digits; spaces, dashes and brackets are fine. */
export function validateDetails(d: Details): DetailErrors {
  const errors: DetailErrors = {};
  if (!d.name.trim()) errors.name = DETAIL_FIELDS.name.error;
  if (d.mobile.replace(/\D/g, "").length < 10) errors.mobile = DETAIL_FIELDS.mobile.error;
  if (!d.vehicle.trim()) errors.vehicle = DETAIL_FIELDS.vehicle.error;
  return errors;
}

export const REQUIRED_ORDER: readonly Required[] = ["name", "mobile", "vehicle"];

function ErrorMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
      <circle cx="9" cy="9" r="7.6" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9 4.8v5.1" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="9" cy="12.9" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function StepDetails({
  titleId,
  title,
  formId,
  values,
  errors,
  showErrors,
  onChange,
  onSubmit,
}: {
  titleId: string;
  title: string;
  formId: string;
  values: Details;
  errors: DetailErrors;
  showErrors: boolean;
  onChange: (field: keyof Details, value: string) => void;
  onSubmit: () => void;
}) {
  const field = (
    key: Required,
    input: { type?: string; autoComplete: string; inputMode?: "text" | "tel"; placeholder?: string },
  ) => {
    const id = `${formId}-${key}`;
    const error = showErrors ? errors[key] : undefined;
    return (
      <div className="bk-field">
        <label htmlFor={id}>{DETAIL_FIELDS[key].label}</label>
        <input
          id={id}
          name={key}
          type={input.type ?? "text"}
          inputMode={input.inputMode}
          autoComplete={input.autoComplete}
          placeholder={input.placeholder}
          value={values[key]}
          maxLength={120}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(e) => onChange(key, e.currentTarget.value)}
        />
        {error && (
          <p id={`${id}-error`} className="bk-error">
            <ErrorMark />
            {error}
          </p>
        )}
      </div>
    );
  };

  return (
    <>
      <h3 id={titleId} className="bk-step-title" tabIndex={-1} data-step-title="">
        {title}
      </h3>
      {/* Never submitted to anywhere: the handler stops it and the flow moves on in the page. */}
      <form
        id={formId}
        className="bk-fields"
        method="post"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {field("name", { autoComplete: "name" })}
        {field("mobile", { type: "tel", inputMode: "tel", autoComplete: "tel" })}
        {field("vehicle", { autoComplete: "off", placeholder: DETAIL_FIELDS.vehicle.placeholder })}
        <div className="bk-field">
          <label htmlFor={`${formId}-notes`}>{DETAIL_FIELDS.notes.label}</label>
          <textarea
            id={`${formId}-notes`}
            name="notes"
            rows={3}
            maxLength={600}
            value={values.notes}
            onChange={(e) => onChange("notes", e.currentTarget.value)}
          />
        </div>
      </form>
    </>
  );
}
