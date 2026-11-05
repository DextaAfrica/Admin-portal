const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Dexta Africa] Initializing production database environment...");

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@dextaafrica.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminPassword2026!";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Dexta Super Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Provision Initial Super Administrator
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "SUPER_ADMIN",
      department: "EXECUTIVE",
    },
    create: {
      email: adminEmail,
      fullName: adminName,
      passwordHash,
      role: "SUPER_ADMIN",
      department: "EXECUTIVE",
      jobTitle: "Chief Executive Officer / Managing Director",
      status: "ACTIVE",
      twoFactorEnabled: false,
    },
  });
  console.log(`✅ [Dexta Africa] Super Administrator ready: ${admin.email}`);

  // Create corresponding HR profile for Super Admin
  const existingProfile = await prisma.employeeProfile.findFirst({
    where: { workEmail: admin.email },
  });
  if (!existingProfile) {
    await prisma.employeeProfile.create({
      data: {
        userId: admin.id,
        employeeNumber: "DXT-EXEC-001",
        fullName: admin.fullName,
        workEmail: admin.email,
        department: "EXECUTIVE",
        jobTitle: "Chief Executive Officer",
        employmentType: "FULL_TIME",
        status: "ACTIVE",
        startDate: new Date(),
        location: "Executive Headquarters",
        annualLeaveBalance: 30,
        usedLeaveDays: 0,
      },
    });
  }

  // 2. Production System Configuration Settings
  const settings = [
    { key: "MFA_POLICY", value: "ENFORCED_FOR_ADMINS", description: "Enforce 2FA/MFA for all Super Admin and Admin roles" },
    { key: "SESSION_TIMEOUT_MINUTES", value: "720", description: "Inactivity session expiry timeout" },
    { key: "MAX_FAILED_LOGINS", value: "5", description: "Account lockout threshold for brute force protection" },
    { key: "S3_DEFAULT_BUCKET", value: process.env.AWS_S3_BUCKET_NAME || "dexta-assets-storage", description: "Active S3 bucket identifier" },
    { key: "STORAGE_QUOTA_MB", value: "51200", description: "Maximum cloud storage quota in megabytes" },
  ];

  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  // 3. System Email Notification Templates
  const templates = [
    {
      name: "Security Alert: New Sign-in",
      subject: "Important: New Sign-in to Your Dexta Account",
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #dc2626; margin-top: 0;">Security Alert</h2>
          <p>Hello <strong>{{firstName}}</strong>,</p>
          <p>We detected a new administrative sign-in to your Dexta Africa account from IP: <code>{{ipAddress}}</code> on <code>{{timestamp}}</code>.</p>
          <p>If this was you, no action is needed. If you did not authorize this, please immediately revoke your active sessions and change your password.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">Dexta Africa Security Team &bull; <a href="{{portalUrl}}">Manage Security</a></p>
        </div>
      `,
      variables: JSON.stringify(["firstName", "ipAddress", "timestamp", "portalUrl"]),
      isDefault: true,
    },
    {
      name: "Welcome & Onboarding",
      subject: "Welcome to Dexta Africa Enterprise Operations",
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to Dexta, {{firstName}}!</h2>
          <p>Your team member access has been established. You can now access our executive workspace to manage operations, assets, and project delivery.</p>
          <div style="margin: 24px 0;">
            <a href="{{portalUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Operations Portal</a>
          </div>
          <p>Please remember to enroll in Multi-Factor Authentication (2FA) upon your first login.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="font-size: 12px; color: #64748b;">Dexta Africa &bull; Enterprise Operations</p>
        </div>
      `,
      variables: JSON.stringify(["firstName", "portalUrl"]),
      isDefault: false,
    },
  ];

  for (const t of templates) {
    const existing = await prisma.emailTemplate.findFirst({ where: { name: t.name } });
    if (!existing) {
      await prisma.emailTemplate.create({ data: t });
    }
  }

  // 4. Initial System Bootstrap Audit Log
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorEmail: admin.email,
      action: "SYSTEM_BOOTSTRAP",
      entity: "System",
      entityId: "init",
      ipAddress: "127.0.0.1",
      userAgent: "Dexta Seeder / CLI",
      metadata: JSON.stringify({ message: "Initial Super Administrator and core operational settings initialized with zero mock data." }),
    },
  });

  console.log("✅ [Dexta Africa] Database successfully initialized with zero mock data.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
