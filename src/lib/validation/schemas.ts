import { z } from "zod";
import { validateCorporateEmail, validatePhoneNumber } from "./contact";

// =============================================================================
// REUSABLE FIELD VALIDATORS & PRIMITIVES
// =============================================================================

export const KEBAB_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const safeTrimString = (min: number, max: number, label: string) =>
  z
    .string({ required_error: `${label} is required` })
    .transform((val) => val.trim())
    .refine((val) => val.length >= min, {
      message: `${label} must be at least ${min} character${min === 1 ? "" : "s"}`,
    })
    .refine((val) => val.length <= max, {
      message: `${label} cannot exceed ${max} characters`,
    });

export const optionalTrimString = (max: number, label: string) =>
  z
    .string()
    .optional()
    .transform((val) => (val ? val.trim() : ""))
    .refine((val) => !val || val.length <= max, {
      message: `${label} cannot exceed ${max} characters`,
    });

export const corporateEmailValidator = z
  .string({ required_error: "Email address is required" })
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (email) => {
      const res = validateCorporateEmail(email);
      return res.isValid;
    },
    {
      message: "Please enter a valid, active business email (disposable domains disallowed)",
    }
  );

export const standardEmailValidator = z
  .string({ required_error: "Email address is required" })
  .transform((val) => val.toLowerCase().trim())
  .refine(
    (val) =>
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/.test(
        val
      ),
    { message: "Please provide a valid email address format" }
  );

export const phoneValidator = z
  .string()
  .optional()
  .transform((val) => (val ? val.trim() : ""))
  .refine(
    (phone) => {
      if (!phone) return true;
      const res = validatePhoneNumber(phone);
      return res.isValid;
    },
    {
      message: "Phone number must follow international format (e.g. +234 808 000 0000)",
    }
  );

export const slugValidator = z
  .string({ required_error: "URL Slug is required" })
  .transform((val) => val.toLowerCase().trim())
  .refine((val) => val.length >= 2, { message: "Slug must be at least 2 characters long" })
  .refine((val) => val.length <= 120, { message: "Slug cannot exceed 120 characters" })
  .refine((val) => KEBAB_SLUG_REGEX.test(val), {
    message: "Slug must be lowercase alphanumeric characters separated by single hyphens (e.g. prime-estate-lagos)",
  });

export const optionalUrlValidator = z
  .string()
  .optional()
  .transform((val) => (val ? val.trim() : ""))
  .refine(
    (url) => {
      if (!url) return true;
      try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Must be a valid web URL starting with http:// or https://" }
  );

// =============================================================================
// ERROR FORMATTING HELPER
// =============================================================================

export interface ValidationFailure {
  error: string;
  fieldErrors: Record<string, string[]>;
}

export function formatZodError(error: z.ZodError): ValidationFailure {
  const fieldErrors: Record<string, string[]> = {};
  
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(issue.message);
  }

  const firstError = error.issues[0]?.message || "Validation failed";
  return {
    error: firstError,
    fieldErrors,
  };
}

// =============================================================================
// 1. PORTFOLIO & REAL ESTATE DEVELOPMENTS SCHEMA
// =============================================================================

export const DevelopmentStatusEnum = z.enum(["planning", "under_construction", "completed"], {
  required_error: "Project development status is required",
});

export const GalleryItemSchema = z.object({
  url: z.string().url("Gallery item must be a valid image URL"),
  alt: z.string().max(200, "Alt text max 200 characters").default(""),
});

export const SaveDevelopmentSchema = z.object({
  name: safeTrimString(2, 200, "Development Name"),
  slug: slugValidator,
  location: safeTrimString(2, 200, "Development Location"),
  status: DevelopmentStatusEnum,
  summary: optionalTrimString(500, "Summary"),
  body: z.record(z.any()).default({}),
  heroImageUrl: optionalUrlValidator,
  gallery: z.array(GalleryItemSchema).default([]),
  featured: z.boolean().default(false),
  published: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0, "Display order must be positive").default(0),
  seoTitle: optionalTrimString(200, "SEO Title"),
  seoDescription: optionalTrimString(500, "SEO Description"),
});

export type SaveDevelopmentInput = z.infer<typeof SaveDevelopmentSchema>;

// =============================================================================
// 2. JOURNAL & ARTICLES SCHEMA
// =============================================================================

export const SaveArticleSchema = z.object({
  title: safeTrimString(3, 200, "Article Title"),
  slug: slugValidator,
  author: safeTrimString(2, 100, "Author Name"),
  category: safeTrimString(2, 100, "Category"),
  excerpt: optionalTrimString(500, "Excerpt"),
  body: z.record(z.any()).default({}),
  coverImageUrl: optionalUrlValidator,
  published: z.boolean().default(true),
  seoTitle: optionalTrimString(200, "SEO Title"),
  seoDescription: optionalTrimString(500, "SEO Description"),
});

export type SaveArticleInput = z.infer<typeof SaveArticleSchema>;

// =============================================================================
// 3. CAREERS & VACANCIES SCHEMA
// =============================================================================

export const CareerStatusEnum = z.enum(["open", "closed"]).default("open");

export const SaveCareerListingSchema = z.object({
  title: safeTrimString(3, 200, "Job Title"),
  slug: slugValidator,
  department: safeTrimString(2, 100, "Department"),
  location: safeTrimString(2, 100, "Work Location"),
  type: safeTrimString(2, 100, "Employment Type"),
  summary: safeTrimString(10, 1000, "Role Summary"),
  requirements: z
    .array(z.string().transform((s) => s.trim()))
    .min(1, "At least one requirement is required"),
  benefits: z
    .array(z.string().transform((s) => s.trim()))
    .default([]),
  status: CareerStatusEnum,
  published: z.boolean().default(true),
});

export type SaveCareerListingInput = z.infer<typeof SaveCareerListingSchema>;

// =============================================================================
// 4. CONTENT CMS SCHEMA
// =============================================================================

export const SaveContentPageSchema = z.object({
  key: z
    .string({ required_error: "Page key is required" })
    .transform((k) => k.toLowerCase().trim())
    .refine((k) => /^[a-z0-9_-]+$/.test(k), {
      message: "Page key must contain only lowercase alphanumeric, dashes, or underscores",
    }),
  title: safeTrimString(2, 200, "Page Title"),
  content: z.record(z.any()),
  seoTitle: optionalTrimString(200, "SEO Title"),
  seoDescription: optionalTrimString(500, "SEO Description"),
  published: z.boolean().default(true),
});

export type SaveContentPageInput = z.infer<typeof SaveContentPageSchema>;

// =============================================================================
// 5. CRM DOMAIN SCHEMAS
// =============================================================================

export const CrmClientCategoryEnum = z.enum([
  "PROSPECT",
  "ACTIVE_CLIENT",
  "INVESTOR",
  "STRATEGIC_PARTNER",
  "VENDOR",
]);

export const CrmClientStageEnum = z.enum([
  "INQUIRY",
  "DISCOVERY",
  "PROPOSAL_SENT",
  "NEGOTIATION",
  "CONTRACT_SIGNED",
  "ACTIVE_ACCOUNT",
]);

export const CrmActivityTypeEnum = z.enum([
  "CALL",
  "MEETING",
  "EMAIL",
  "CONTRACT_MEMO",
  "TASK",
  "MILESTONE",
  "NOTE",
]);

export const CreateCrmClientSchema = z.object({
  name: safeTrimString(2, 150, "Client / Contact Name"),
  company: optionalTrimString(150, "Company Name"),
  email: standardEmailValidator,
  phone: phoneValidator,
  category: CrmClientCategoryEnum.default("PROSPECT"),
  stage: CrmClientStageEnum.default("INQUIRY"),
  estimatedValue: z.coerce.number().min(0, "Estimated value must be 0 or greater").default(0),
  currency: z.string().trim().max(10).default("USD"),
  location: safeTrimString(2, 150, "Location").default("Lagos, Nigeria"),
  tags: z.array(z.string().max(50)).default([]),
  notes: optionalTrimString(2000, "Notes"),
});

export const CreateCrmActivitySchema = z.object({
  clientId: z.string().uuid("Invalid client ID").optional().nullable(),
  type: CrmActivityTypeEnum.default("MEETING"),
  title: safeTrimString(2, 200, "Activity Title"),
  description: optionalTrimString(2000, "Description"),
  outcome: optionalTrimString(1000, "Outcome"),
  activityDate: z
    .string()
    .optional()
    .transform((val) => {
      if (!val) return new Date().toISOString();
      const d = new Date(val);
      if (isNaN(d.getTime())) throw new Error("Invalid activity date");
      return d.toISOString();
    }),
});

// =============================================================================
// 6. HR DOMAIN SCHEMAS
// =============================================================================

export const HrEmploymentTypeEnum = z.enum([
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "EXECUTIVE",
]);

export const HrEmployeeStatusEnum = z.enum([
  "ACTIVE",
  "ON_LEAVE",
  "ONBOARDING",
  "TERMINATED",
]);

export const CreateHrEmployeeSchema = z.object({
  fullName: safeTrimString(2, 150, "Full Name"),
  workEmail: corporateEmailValidator,
  phone: phoneValidator,
  department: safeTrimString(2, 100, "Department"),
  jobTitle: safeTrimString(2, 150, "Job Title"),
  employmentType: HrEmploymentTypeEnum.default("FULL_TIME"),
  status: HrEmployeeStatusEnum.default("ACTIVE"),
  startDate: z
    .string({ required_error: "Start Date is required" })
    .refine((val) => !isNaN(new Date(val).getTime()), { message: "Invalid start date" }),
  location: safeTrimString(2, 150, "Work Location").default("Lagos, Nigeria"),
  emergencyContact: optionalTrimString(200, "Emergency Contact"),
  notes: optionalTrimString(2000, "Notes"),
});

export const HrLeaveTypeEnum = z.enum([
  "ANNUAL",
  "SICK",
  "MATERNITY",
  "PATERNITY",
  "COMPASSIONATE",
  "UNPAID",
  "STUDY",
]);

export const CreateHrLeaveRequestSchema = z
  .object({
    leaveType: HrLeaveTypeEnum,
    startDate: z
      .string({ required_error: "Start date is required" })
      .refine((val) => !isNaN(new Date(val).getTime()), { message: "Invalid start date format" }),
    endDate: z
      .string({ required_error: "End date is required" })
      .refine((val) => !isNaN(new Date(val).getTime()), { message: "Invalid end date format" }),
    daysCount: z.coerce.number().int().min(1, "Leave duration must be at least 1 day").max(365, "Leave duration exceeds maximum allowable period"),
    reason: safeTrimString(5, 1000, "Reason for leave"),
    handoverNotes: optionalTrimString(2000, "Handover notes"),
  })
  .refine(
    (data) => new Date(data.endDate) >= new Date(data.startDate),
    {
      message: "Leave end date cannot precede start date",
      path: ["endDate"],
    }
  );

export const ReviewHrLeaveSchema = z.object({
  id: z.string().uuid("Invalid leave request ID"),
  status: z.enum(["APPROVED", "REJECTED"], { required_error: "Review decision is required" }),
  reviewerNotes: optionalTrimString(1000, "Reviewer Notes"),
});

// =============================================================================
// 7. IT & SECURITY SCHEMAS
// =============================================================================

export const ItRequestTypeEnum = z.enum([
  "PASSWORD_RESET",
  "MFA_RESET",
  "ACCOUNT_PROVISION",
  "ACCESS_ELEVATION",
  "REVOCATION",
]);

export const ItPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const CreateCredentialRequestSchema = z.object({
  requesterEmail: corporateEmailValidator,
  requesterName: safeTrimString(2, 150, "Requester Name"),
  department: safeTrimString(2, 100, "Department").default("OPERATIONS"),
  requestType: ItRequestTypeEnum.default("PASSWORD_RESET"),
  priority: ItPriorityEnum.default("MEDIUM"),
  reason: safeTrimString(5, 1000, "Reason for request"),
});

// =============================================================================
// 8. MARKETING SCHEMAS
// =============================================================================

export const MarketingAudienceSubscriberSchema = z.object({
  email: standardEmailValidator,
  firstName: optionalTrimString(100, "First Name"),
  lastName: optionalTrimString(100, "Last Name"),
  phone: optionalTrimString(50, "Phone Number"),
  company: optionalTrimString(150, "Company / Organization"),
  category: z
    .enum(["CLIENT", "INVESTOR", "PARTNER", "CONTRACTOR", "LEAD", "NEWSLETTER"])
    .default("NEWSLETTER"),
  notes: optionalTrimString(1000, "Notes"),
  tags: z.array(z.string().max(50)).default([]),
});

export const CreateMarketingCampaignSchema = z.object({
  title: safeTrimString(3, 200, "Campaign Title"),
  subject: safeTrimString(3, 200, "Email Subject Line"),
  contentHtml: z
    .string({ required_error: "Campaign HTML body is required" })
    .min(10, "Campaign HTML body must be at least 10 characters"),
});

export const CreateMarketingTemplateSchema = z.object({
  name: safeTrimString(2, 150, "Template Name"),
  subject: safeTrimString(2, 200, "Subject Line"),
  bodyHtml: z
    .string({ required_error: "Template HTML is required" })
    .min(10, "Template HTML must be at least 10 characters"),
  variables: z.array(z.string()).default([]),
});

// =============================================================================
// IT GOVERNANCE & OPERATIONS USER PROVISIONING SCHEMA
// =============================================================================

export const ItProvisionUserSchema = z.object({
  fullName: safeTrimString(2, 80, "Full Legal Name"),
  email: corporateEmailValidator,
  targetDomain: z
    .enum(["ops.dextaafrica.org", "admin.dextafrica.org", "dextafrica.org"])
    .default("ops.dextaafrica.org"),
  department: z.string().default("OPERATIONS"),
  role: z
    .enum(["STAFF", "ADMIN", "SUPER_ADMIN", "OPERATIONS", "HR_MANAGER", "IT_ADMIN"])
    .default("ADMIN"),
  seniorityLevel: z
    .enum(["JUNIOR", "MID", "SENIOR", "EXECUTIVE"])
    .default("SENIOR"),
  jobTitle: safeTrimString(2, 80, "Official Job Title"),
  phone: phoneValidator,
  temporaryPassword: z.string().min(6, "Temporary Key must be at least 6 characters").optional(),
  sendWelcomeEmail: z.boolean().default(true),
});

export type ItProvisionUserInput = z.infer<typeof ItProvisionUserSchema>;
