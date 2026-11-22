import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";

interface ParsedContact {
  email: string;
  fullName: string;
  company?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { url, rawText } = body;

    const emailMap = new Map<string, ParsedContact>();

    // 1. If fetching from an external link or form endpoint
    if (url && typeof url === "string" && (url.startsWith("http://") || url.startsWith("https://"))) {
      try {
        const response = await fetch(url, {
          headers: { Accept: "application/json, text/csv, text/plain" },
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          return NextResponse.json(
            { error: `External endpoint responded with status ${response.status}: ${response.statusText}` },
            { status: 400 }
          );
        }

        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          const json = await response.json();
          const items = Array.isArray(json) ? json : json.data || json.contacts || json.submissions || json.users || [];
          for (const item of items) {
            if (typeof item === "string" && item.includes("@")) {
              const clean = item.trim().toLowerCase();
              emailMap.set(clean, { email: clean, fullName: clean.split("@")[0] });
            } else if (item && typeof item === "object") {
              const email = item.email || item.mail || item.emailAddress;
              if (email && typeof email === "string" && email.includes("@")) {
                const clean = email.trim().toLowerCase();
                const name = item.fullName || item.name || [item.firstName, item.lastName].filter(Boolean).join(" ") || clean.split("@")[0];
                emailMap.set(clean, { email: clean, fullName: name, company: item.company || item.organization || "Partner" });
              }
            }
          }
        } else {
          // CSV or plain text stream
          const text = await response.text();
          extractEmailsFromText(text, emailMap);
        }
      } catch (fetchErr: unknown) {
        return NextResponse.json(
          { error: `Could not fetch external link: ${fetchErr instanceof Error ? fetchErr.message : "Network error"}` },
          { status: 400 }
        );
      }
    }

    // 2. If raw text / CSV data was pasted or uploaded
    if (rawText && typeof rawText === "string") {
      extractEmailsFromText(rawText, emailMap);
    }

    const contacts = Array.from(emailMap.values());

    return NextResponse.json({
      success: true,
      count: contacts.length,
      contacts,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process contacts" },
      { status: 500 }
    );
  }
}

function extractEmailsFromText(text: string, map: Map<string, ParsedContact>) {
  const lines = text.split(/[\r\n]+/);
  for (const line of lines) {
    if (!line.trim()) continue;

    // Check if line is CSV with Name, Email
    const parts = line.split(/[,\t;]/).map((p) => p.trim().replace(/^["']|["']$/g, ""));
    const emailCandidate = parts.find((p) => p.includes("@") && p.includes("."));

    if (emailCandidate) {
      const email = emailCandidate.toLowerCase();
      // Look for a name in other columns
      const nameCandidate = parts.find((p) => p !== emailCandidate && p.length > 1 && !p.includes("@"));
      const fullName = nameCandidate || email.split("@")[0];
      map.set(email, { email, fullName });
    } else {
      // Regex fallback for loose text
      const matches = line.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
      if (matches) {
        for (const m of matches) {
          const email = m.toLowerCase();
          map.set(email, { email, fullName: email.split("@")[0] });
        }
      }
    }
  }
}
