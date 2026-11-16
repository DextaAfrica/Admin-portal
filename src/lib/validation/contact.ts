/**
 * Dexta Africa Enterprise Contact Verification & Security Engine
 * Zero-Trust Validation for Phone Numbers (ITU-T E.164) & Corporate Emails (RFC 5322)
 */

export interface CountryDialCode {
  code: string;
  dialCode: string;
  name: string;
  flag: string;
  minDigits: number;
  maxDigits: number;
  placeholder: string;
}

export const SUPPORTED_COUNTRIES: CountryDialCode[] = [
  { code: "NG", dialCode: "+234", name: "Nigeria", flag: "🇳🇬", minDigits: 10, maxDigits: 11, placeholder: "808 000 0000" },
  { code: "KE", dialCode: "+254", name: "Kenya", flag: "🇰🇪", minDigits: 9, maxDigits: 10, placeholder: "700 000 000" },
  { code: "ZA", dialCode: "+27", name: "South Africa", flag: "🇿🇦", minDigits: 9, maxDigits: 10, placeholder: "82 000 0000" },
  { code: "GH", dialCode: "+233", name: "Ghana", flag: "🇬🇭", minDigits: 9, maxDigits: 10, placeholder: "24 000 0000" },
  { code: "RW", dialCode: "+250", name: "Rwanda", flag: "🇷🇼", minDigits: 9, maxDigits: 9, placeholder: "78 000 0000" },
  { code: "EG", dialCode: "+20", name: "Egypt", flag: "🇪🇬", minDigits: 10, maxDigits: 11, placeholder: "10 0000 0000" },
  { code: "TZ", dialCode: "+255", name: "Tanzania", flag: "🇹🇿", minDigits: 9, maxDigits: 10, placeholder: "71 000 0000" },
  { code: "UG", dialCode: "+256", name: "Uganda", flag: "🇺🇬", minDigits: 9, maxDigits: 9, placeholder: "70 000 0000" },
  { code: "GB", dialCode: "+44", name: "United Kingdom", flag: "🇬🇧", minDigits: 10, maxDigits: 11, placeholder: "7911 000000" },
  { code: "US", dialCode: "+1", name: "United States / Canada", flag: "🇺🇸", minDigits: 10, maxDigits: 10, placeholder: "202 555 0123" },
  { code: "AE", dialCode: "+971", name: "United Arab Emirates", flag: "🇦🇪", minDigits: 9, maxDigits: 9, placeholder: "50 000 0000" },
];

// Blocklist of disposable/throwaway email providers to prevent bot/junk registrations
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "10minutemail.com",
  "guerrillamail.com",
  "yopmail.com",
  "trashmail.com",
  "sharklasers.com",
  "getairmail.com",
  "throwawaymail.com",
  "fakeinbox.com",
  "dispostable.com",
  "crazymailing.com",
  "maildrop.cc",
  "inboxkitten.com",
  "generator.email",
  "mohmal.com",
  "burnmail.com",
  "mytemp.email",
]);

/**
 * Validates corporate email format and ensures domain integrity
 */
export function validateCorporateEmail(emailStr: string): { isValid: boolean; error?: string } {
  const email = (emailStr || "").trim().toLowerCase();

  if (!email) {
    return { isValid: false, error: "Corporate email address is required." };
  }

  // RFC 5322 standard format validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. name@company.com)." };
  }

  const parts = email.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Malformed email address structure." };
  }

  const domain = parts[1];
  const domainParts = domain.split(".");

  // Domain must have at least one dot and a valid TLD (2+ characters)
  if (domainParts.length < 2 || domainParts.some((p) => p.length === 0)) {
    return { isValid: false, error: "Invalid email domain structure." };
  }

  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2) {
    return { isValid: false, error: "Invalid domain top-level extension." };
  }

  // Reject disposable/throwaway email domains
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return { isValid: false, error: "Temporary and disposable email addresses are strictly prohibited." };
  }

  return { isValid: true };
}

/**
 * Validates and standardizes a phone number according to ITU-T E.164 specifications.
 * Prevents bogus input like 23-digit spam or repetitive junk numbers.
 */
export function validatePhoneNumber(
  rawPhone: string,
  defaultDialCode: string = "+234"
): { isValid: boolean; formatted: string; cleanDigits: string; error?: string } {
  const trimmed = (rawPhone || "").trim();

  if (!trimmed) {
    return { isValid: false, formatted: "", cleanDigits: "", error: "Phone number is required." };
  }

  // Remove whitespace, dashes, parentheses
  let sanitized = trimmed.replace(/[\s\-\(\)\.]/g, "");

  // If starts with +, ensure remaining characters are purely digits
  const hasPlus = sanitized.startsWith("+");
  if (hasPlus) {
    sanitized = sanitized.slice(1);
  }

  // Digits only check
  if (!/^\d+$/.test(sanitized)) {
    return { isValid: false, formatted: "", cleanDigits: "", error: "Phone number must contain only valid digits." };
  }

  // Determine full international number
  let fullNumberWithPlus = "";
  if (hasPlus) {
    fullNumberWithPlus = `+${sanitized}`;
  } else if (sanitized.startsWith("0")) {
    // Local format e.g. 0808... with selected dial code
    const cleanLocal = sanitized.replace(/^0+/, "");
    const cleanDialCode = defaultDialCode.replace("+", "");
    fullNumberWithPlus = `+${cleanDialCode}${cleanLocal}`;
  } else if (sanitized.startsWith(defaultDialCode.replace("+", ""))) {
    fullNumberWithPlus = `+${sanitized}`;
  } else {
    const cleanDialCode = defaultDialCode.replace("+", "");
    fullNumberWithPlus = `+${cleanDialCode}${sanitized}`;
  }

  const digitsOnly = fullNumberWithPlus.replace("+", "");

  // ITU-T E.164 constraints: min 8 digits, max 15 digits
  if (digitsOnly.length < 8) {
    return {
      isValid: false,
      formatted: fullNumberWithPlus,
      cleanDigits: digitsOnly,
      error: "Phone number is too short (must be at least 8 digits with country code).",
    };
  }

  if (digitsOnly.length > 15) {
    return {
      isValid: false,
      formatted: fullNumberWithPlus,
      cleanDigits: digitsOnly,
      error: `Phone number is too long (${digitsOnly.length} digits). International E.164 allows max 15 digits.`,
    };
  }

  // Check for bogus repetitive digits (e.g. 0000000000 or 1111111111)
  if (/^(\d)\1{7,}$/.test(digitsOnly)) {
    return {
      isValid: false,
      formatted: fullNumberWithPlus,
      cleanDigits: digitsOnly,
      error: "Invalid phone number: repetitive dummy digits detected.",
    };
  }

  // Check for sequential dummy digits (e.g. 1234567890 or 9876543210)
  if (
    digitsOnly.includes("12345678") ||
    digitsOnly.includes("87654321") ||
    digitsOnly.includes("01234567")
  ) {
    return {
      isValid: false,
      formatted: fullNumberWithPlus,
      cleanDigits: digitsOnly,
      error: "Invalid phone number: sequential test digits detected.",
    };
  }

  return {
    isValid: true,
    formatted: fullNumberWithPlus,
    cleanDigits: digitsOnly,
  };
}
