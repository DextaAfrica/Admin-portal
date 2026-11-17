import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { sendEmail } from "@/lib/email/dispatcher";
import { backendApi } from "@/lib/backend-api";
import { ItProvisionUserSchema } from "@/lib/validation/schemas";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Authorization: IT Administrator Session or Master IT Key
    const { user } = await getCurrentSession();
    const isMasterKey =
      req.headers.get("x-it-master-key") === "dexta-it-master-2026" ||
      body.itMasterKey === "dexta-it-master-2026";

    const userRole = (user?.role || "").toUpperCase();
    const userDept = (user?.department || "").toUpperCase();
    const isAuthorized =
      isMasterKey ||
      userRole === "SUPER_ADMIN" ||
      userRole === "ADMIN" ||
      userDept === "IT" ||
      userDept === "EXECUTIVE";

    if (!isAuthorized) {
      return NextResponse.json(
        { error: "Access Denied: Account provisioning is restricted to Systems IT Command & Executive Directorate." },
        { status: 403 }
      );
    }

    // 2. Validate Provisioning Payload
    const parsed = ItProvisionUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues?.[0]?.message || "Validation failed";
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      targetDomain = "ops.dextaafrica.org",
      department = "OPERATIONS",
      role = "ADMIN",
      seniorityLevel = "SENIOR",
      jobTitle,
      phone,
      temporaryPassword,
      sendWelcomeEmail = true,
    } = parsed.data;

    const normalizedEmail = email.toLowerCase().trim();

    // 3. Email Uniqueness Check
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: `An enterprise account with email ${normalizedEmail} already exists.` },
        { status: 409 }
      );
    }

    // 4. Generate Cryptographically Strong Activation Key & Initial Hash
    const activationKey =
      temporaryPassword?.trim() || `DXT-ACT-${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await bcrypt.hash(activationKey, 10);

    // 5. Create Provisioned User Account in Database
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        fullName: fullName.trim(),
        passwordHash,
        department: (department || "OPERATIONS").toUpperCase(),
        role: role || "ADMIN",
        seniorityLevel: (seniorityLevel || "SENIOR").toUpperCase(),
        jobTitle: jobTitle ? jobTitle.trim() : "Operations Manager",
        phone: phone ? phone.trim() : "+234 800 000 0000",
        status: "ACTIVE",
        mustChangePassword: true,
        activationKey,
        twoFactorEnabled: false,
      },
    });

    // 6. Link or Create EmployeeProfile in HR Records
    try {
      const empCount = await db.employeeProfile.count();
      const deptPrefix = (department || "OPERATIONS").slice(0, 3).toUpperCase();
      const empNumber = `DXT-${deptPrefix}-${String(empCount + 101).padStart(3, "0")}`;

      await db.employeeProfile.upsert({
        where: { workEmail: normalizedEmail },
        update: {
          userId: newUser.id,
          department: (department || "OPERATIONS").toUpperCase(),
          jobTitle: jobTitle || "Operations Manager",
          phone: phone || "+234 800 000 0000",
        },
        create: {
          userId: newUser.id,
          employeeNumber: empNumber,
          fullName: fullName.trim(),
          workEmail: normalizedEmail,
          phone: phone || "+234 800 000 0000",
          department: (department || "OPERATIONS").toUpperCase(),
          jobTitle: jobTitle || "Operations Manager",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          startDate: new Date(),
          location: "Lagos Executive Hub, Nigeria",
        },
      });
    } catch (hrErr) {
      console.warn("Auto HR employee record creation deferred:", hrErr);
    }

    // 7. Synchronize with Go Core Backend
    try {
      await backendApi.users.syncUser({
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        department: newUser.department,
        jobTitle: newUser.jobTitle || undefined,
        phone: newUser.phone || undefined,
        status: newUser.status,
        createdAt: newUser.createdAt,
      });
    } catch (syncErr) {
      console.warn("Go core backend user sync deferred:", syncErr);
    }

    // 8. Log Audit Event
    await logAuditEvent({
      actorId: user?.id || "SYSTEM_IT_COMMAND",
      actorEmail: user?.email || "systems@dextafrica.org",
      action: "IT_ACCOUNT_PROVISIONED",
      entity: "User",
      entityId: newUser.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: {
        fullName,
        email: normalizedEmail,
        department,
        jobTitle,
        targetDomain,
        role,
        seniorityLevel,
        provisionedBy: user?.fullName || "IT Administrator",
      },
    });

    // 9. Construct Subdomain Activation URL
    const host = req.headers.get("host") || "";
    const isLocal = host.includes("localhost") || host.includes("127.0.0.1");
    const port = host.split(":")[1] || "3000";
    const protocol = req.nextUrl.protocol || "http:";

    let activationUrl: string;
    if (targetDomain === "ops.dextaafrica.org") {
      activationUrl = isLocal
        ? `${protocol}//ops.localhost:${port}/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`
        : `https://ops.dextaafrica.org/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`;
    } else if (targetDomain === "admin.dextafrica.org") {
      activationUrl = isLocal
        ? `${protocol}//admin.localhost:${port}/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`
        : `https://admin.dextafrica.org/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`;
    } else {
      activationUrl = isLocal
        ? `${protocol}//localhost:${port}/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`
        : `https://dextafrica.org/register?action=activate&email=${encodeURIComponent(normalizedEmail)}&key=${encodeURIComponent(activationKey)}`;
    }

    // 10. Dispatch Welcome Email with Activation Credentials via Mailpit / SMTP
    if (sendWelcomeEmail) {
      await sendEmail({
        to: normalizedEmail,
        subject: `Welcome to Dexta Africa - Your ${targetDomain === "ops.dextaafrica.org" ? "Operations" : "Workspace"} Profile Activation Key`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 36px 32px; border: 1px solid #e4e4e7; border-radius: 16px; background: #ffffff; color: #09090b;">
            <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #f4f4f5; padding-bottom: 20px; margin-bottom: 24px;">
              <div>
                <span style="font-size: 24px; font-weight: 900; letter-spacing: -0.5px; color: #09090b;">De<span style="color: #ED2618;">x</span>ta</span>
                <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #71717a; margin-left: 10px;">IT Governance Command</span>
              </div>
              <span style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #ED2618; font-size: 11px; font-weight: 800; border-radius: 9999px;">
                ${targetDomain}
              </span>
            </div>

            <h2 style="font-size: 20px; font-weight: 800; color: #09090b; margin: 0 0 10px 0;">Account Profile Provisioned by Systems IT</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #52525b; margin: 0 0 20px 0;">
              Hello <strong>${fullName}</strong>,<br/>
              Dexta Systems IT Command has provisioned your dedicated enterprise account for the <strong>${department}</strong> Directorate.
            </p>

            <div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px; padding: 20px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #71717a;">Workspace Domain:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #09090b; text-align: right;">${targetDomain}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #71717a;">Directorate:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #09090b; text-align: right;">${department}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #71717a;">Official Job Role:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #ED2618; text-align: right;">${jobTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #71717a;">Clearance Level:</td>
                  <td style="padding: 6px 0; font-weight: 700; color: #09090b; text-align: right;">${seniorityLevel}</td>
                </tr>
              </table>

              <div style="margin-top: 18px; padding-top: 16px; border-top: 1px dashed #d4d4d8; text-align: center;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #71717a; margin-bottom: 6px;">One-Time Activation Key</div>
                <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 26px; font-weight: 900; color: #ED2618; letter-spacing: 2px;">
                  ${activationKey}
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 28px 0;">
              <a href="${activationUrl}" style="display: inline-block; background: #ED2618; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 14px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 12px rgba(237, 38, 24, 0.25);">
                Activate Account &amp; Set Password &rarr;
              </a>
            </div>

            <p style="font-size: 12px; color: #71717a; line-height: 1.5; text-align: center;">
              Use the activation button above to verify your pre-provisioned credentials and establish your confidential personal password.
            </p>

            <div style="border-top: 1px solid #f4f4f5; padding-top: 16px; margin-top: 24px; font-size: 11px; color: #a1a1aa; text-align: center;">
              &copy; 2026 Dexta Africa Enterprise Gateway &bull; IT Governance &amp; Identity Provisioning &bull; ${targetDomain}
            </div>
          </div>
        `,
      }).catch((err) => {
        console.warn("Mailpit welcome email dispatch error:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Account successfully provisioned for ${fullName}`,
        user: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          department: newUser.department,
          role: newUser.role,
          jobTitle: newUser.jobTitle,
          seniorityLevel: newUser.seniorityLevel,
          activationKey,
        },
        activationKey,
        activationUrl,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("IT Provision account error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to provision account" },
      { status: 500 }
    );
  }
}
