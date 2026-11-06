import { z } from "zod";

// =============================================================================
// ENTERPRISE PASSWORD SECURITY & ENTROPY ENGINE
// =============================================================================

export interface PasswordAnalysis {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Too Weak" | "Weak" | "Fair" | "Strong" | "Executive Secure";
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
    isNotCommon: boolean;
  };
  errors: string[];
}

const COMMON_DISALLOWED_PASSWORDS = new Set([
  "password",
  "password123",
  "12345678",
  "123456789",
  "qwerty1234",
  "admin1234",
  "admin2026",
  "dexta2026",
  "dextaafrica",
  "welcome123",
  "changeme123",
]);

export function evaluatePasswordStrength(password: string): PasswordAnalysis {
  const p = password || "";
  const checks = {
    minLength: p.length >= 8,
    hasUppercase: /[A-Z]/.test(p),
    hasLowercase: /[a-z]/.test(p),
    hasNumber: /[0-9]/.test(p),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p),
    isNotCommon: !COMMON_DISALLOWED_PASSWORDS.has(p.toLowerCase().trim()),
  };

  const errors: string[] = [];
  if (!checks.minLength) errors.push("Password must be at least 8 characters long.");
  if (!checks.hasUppercase) errors.push("Password must include at least one uppercase letter (A-Z).");
  if (!checks.hasLowercase) errors.push("Password must include at least one lowercase letter (a-z).");
  if (!checks.hasNumber) errors.push("Password must include at least one number (0-9).");
  if (!checks.hasSpecial) errors.push("Password must include at least one special character (!@#$%^&*...).");
  if (!checks.isNotCommon) errors.push("Password is too common or easily guessed. Choose a unique phrase.");

  let scoreCount = 0;
  if (checks.minLength) scoreCount++;
  if (checks.hasUppercase && checks.hasLowercase) scoreCount++;
  if (checks.hasNumber) scoreCount++;
  if (checks.hasSpecial) scoreCount++;
  if (p.length >= 12 && checks.isNotCommon) scoreCount++;

  let score: 0 | 1 | 2 | 3 | 4 = 0;
  let label: PasswordAnalysis["label"] = "Too Weak";

  if (!checks.isNotCommon || p.length < 6) {
    score = 0;
    label = "Too Weak";
  } else if (scoreCount <= 1) {
    score = 1;
    label = "Weak";
  } else if (scoreCount === 2 || scoreCount === 3) {
    score = 2;
    label = "Fair";
  } else if (scoreCount === 4) {
    score = 3;
    label = "Strong";
  } else if (scoreCount >= 5 && errors.length === 0) {
    score = 4;
    label = "Executive Secure";
  }

  return { score, label, checks, errors };
}

// =============================================================================
// ZOD VALIDATION SCHEMAS
// =============================================================================

export const CorporateDepartments = [
  "OPERATIONS",
  "EXECUTIVE",
  "INVESTMENT",
  "LEGAL",
  "TECHNOLOGY",
  "MARKETING",
  "HR",
  "FINANCE",
  "ARCHITECTURE",
] as const;

export const RegisterSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full Name must be at least 2 characters")
      .max(80, "Full Name must not exceed 80 characters"),
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid corporate email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
    department: z
      .string()
      .optional()
      .default("OPERATIONS"),
    jobTitle: z
      .string()
      .trim()
      .max(60, "Job title cannot exceed 60 characters")
      .optional(),
    avatarUrl: z.string().optional(),
    bio: z.string().trim().max(300, "Bio cannot exceed 300 characters").optional(),
    phone: z
      .string()
      .trim()
      .optional()
      .refine(
        (val) => !val || /^(\+?[0-9\s\-()]{7,20})$/.test(val),
        "Invalid phone number format"
      ),
    accessPasscode: z.string().trim().optional(),
    mfaSecret: z.string().optional(),
    mfaCode: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Validate password entropy
    const analysis = evaluatePasswordStrength(data.password);
    if (analysis.errors.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["password"],
        message: analysis.errors[0],
      });
    }

    // Match passwords
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match. Please verify.",
      });
    }
  });

export const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address"),
  password: z
    .string()
    .min(1, "Password is required"),
});

export const ActivationSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please provide a valid email address"),
    activationKey: z
      .string()
      .trim()
      .min(1, "IT Activation Key is required"),
    preferredPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your password"),
  })
  .superRefine((data, ctx) => {
    const analysis = evaluatePasswordStrength(data.preferredPassword);
    if (analysis.errors.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["preferredPassword"],
        message: analysis.errors[0],
      });
    }

    if (data.preferredPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match. Please verify.",
      });
    }
  });

export const UpdatePasswordSchema = z
  .object({
    currentPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(1, "Please confirm your new password"),
  })
  .superRefine((data, ctx) => {
    const analysis = evaluatePasswordStrength(data.newPassword);
    if (analysis.errors.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["newPassword"],
        message: analysis.errors[0],
      });
    }

    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    }
  });

