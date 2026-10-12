import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding real database records...");

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@dextaafrica.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminPassword2026!";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Dexta Super Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Seed or Upsert Super Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      fullName: adminName,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      twoFactorEnabled: false,
    },
  });
  console.log(`✅ Super Admin ready: ${admin.email}`);

  // 2. Seed Default System Settings
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

  // 3. Seed Production Email Templates
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
      subject: "Welcome to Dexta Africa Enterprise Management",
      bodyHtml: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-top: 0;">Welcome to Dexta, {{firstName}}!</h2>
          <p>Your team member access has been provisioned. You can now access our high-end operations portal to manage cloud assets, campaign pipelines, and system configurations.</p>
          <div style="margin: 24px 0;">
            <a href="{{portalUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Access Operations Portal</a>
          </div>
          <p>Please remember to enroll in Multi-Factor Authentication (2FA) immediately upon first login.</p>
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

  // 4. Seed Real API Endpoints for Monitoring
  const endpoints = [
    { name: "Auth & Identity Gateway", baseUrl: "https://auth.dextaafrica.com/health", authType: "BEARER", status: "ACTIVE", healthStatus: "HEALTHY", lastLatencyMs: 38 },
    { name: "S3 Storage Proxy Edge", baseUrl: "https://storage-cdn.dextaafrica.com/status", authType: "NONE", status: "ACTIVE", healthStatus: "HEALTHY", lastLatencyMs: 44 },
    { name: "Transaction Notification Webhooks", baseUrl: "https://api.dextaafrica.com/v1/webhook-status", authType: "HMAC", status: "ACTIVE", healthStatus: "HEALTHY", lastLatencyMs: 52 },
  ];

  for (const ep of endpoints) {
    const existing = await prisma.apiEndpoint.findFirst({ where: { name: ep.name } });
    if (!existing) {
      await prisma.apiEndpoint.create({
        data: {
          ...ep,
          lastPingAt: new Date(),
        },
      });
    }
  }

  // 5. Seed Real Initial Audience Contacts
  const audience = [
    { email: "operations@dextaafrica.com", firstName: "Operations", lastName: "Team", status: "SUBSCRIBED", tags: JSON.stringify(["internal", "core-ops"]) },
    { email: "tech@dextaafrica.com", firstName: "Engineering", lastName: "Lead", status: "SUBSCRIBED", tags: JSON.stringify(["tech", "admins"]) },
    { email: "partnerships@dextaafrica.com", firstName: "Partner", lastName: "Relations", status: "SUBSCRIBED", tags: JSON.stringify(["partners", "vip"]) },
  ];

  for (const sub of audience) {
    await prisma.audienceSubscriber.upsert({
      where: { email: sub.email },
      update: {},
      create: sub,
    });
  }

  // 6. Log Initial System Bootstrap Audit Event
  await prisma.auditLog.create({
    data: {
      actorId: admin.id,
      actorEmail: admin.email,
      action: "SYSTEM_BOOTSTRAP",
      entity: "System",
      entityId: "init",
      ipAddress: "127.0.0.1",
      userAgent: "Dexta Seeder / CLI",
      metadata: JSON.stringify({ message: "Initial Super Admin and core operational engines provisioned." }),
    },
  });

  console.log("✅ Database successfully seeded with real production entities.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

