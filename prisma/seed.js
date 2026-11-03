const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 [Dexta Africa] Running enterprise CRM, HR, & IT database seed...");

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@dextaafrica.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminPassword2026!";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Dexta Super Admin";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  // 1. Seed or Upsert Super Admin
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      department: "EXECUTIVE",
      role: "SUPER_ADMIN",
    },
    create: {
      email: adminEmail,
      fullName: adminName,
      passwordHash,
      role: "SUPER_ADMIN",
      department: "EXECUTIVE",
      status: "ACTIVE",
      twoFactorEnabled: false,
    },
  });
  console.log(`✅ [Dexta Africa] Super Admin ready: ${admin.email}`);

  // 2. Seed Key Department Users (HR, IT, Engineering)
  const staffUsers = [
    {
      email: "sadia@dextaafrica.com",
      fullName: "Sadia",
      role: "HR_MANAGER",
      department: "HR",
      jobTitle: "Head of People, Culture & Operations",
    },
    {
      email: "tariq.it@dextaafrica.com",
      fullName: "Tariq Ibrahim",
      role: "IT_ADMIN",
      department: "IT",
      jobTitle: "Lead Systems & Infrastructure Architect",
    },
    {
      email: "olufemi@dextaafrica.com",
      fullName: "Olufemi",
      role: "ADMIN",
      department: "EXECUTIVE",
      jobTitle: "Managing Director & Executive Director",
    },
    {
      email: "chidi.eng@dextaafrica.com",
      fullName: "Chidi Okonkwo",
      role: "MANAGER",
      department: "OPERATIONS",
      jobTitle: "Director of Infrastructure & Civil Engineering",
    },
    {
      email: "amina.arch@dextaafrica.com",
      fullName: "Amina Bello",
      role: "MANAGER",
      department: "ARCHITECTURE",
      jobTitle: "Principal Urban Architect & Project Lead",
    },
  ];

  for (const u of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        department: u.department,
        jobTitle: u.jobTitle,
      },
      create: {
        email: u.email,
        fullName: u.fullName,
        passwordHash,
        role: u.role,
        department: u.department,
        jobTitle: u.jobTitle,
        status: "ACTIVE",
      },
    });

    // Seed corresponding EmployeeProfile in HR
    const empNumber = `DXT-${user.fullName.slice(0, 3).toUpperCase()}-0${Math.floor(Math.random() * 80 + 10)}`;
    const existingProfile = await prisma.employeeProfile.findFirst({
      where: { workEmail: user.email },
    });

    if (!existingProfile) {
      const emp = await prisma.employeeProfile.create({
        data: {
          userId: user.id,
          employeeNumber: empNumber,
          fullName: user.fullName,
          workEmail: user.email,
          phone: "+234 803 294 810" + Math.floor(Math.random() * 9),
          department: user.department,
          jobTitle: user.jobTitle || "Executive",
          employmentType: "FULL_TIME",
          status: "ACTIVE",
          startDate: new Date("2023-01-15"),
          location: "Lagos Executive Hub, Nigeria",
          annualLeaveBalance: 24,
          usedLeaveDays: 4,
          emergencyContact: "Direct Family Contact (Confidential)",
          notes: "Key executive driving Dexta Africa infrastructure and project delivery.",
        },
      });

      // Seed documents for this employee
      await prisma.employeeDocument.createMany({
        data: [
          {
            employeeId: emp.id,
            title: `${user.fullName} - Executive Employment Agreement`,
            category: "CONTRACT",
            fileUrl: "/documents/sample_contract.pdf",
            fileSize: 2450000,
            mimeType: "application/pdf",
            verified: true,
          },
          {
            employeeId: emp.id,
            title: `${user.fullName} - Identity & Tax Verification`,
            category: "TAX_PENSION",
            fileUrl: "/documents/sample_tax.pdf",
            fileSize: 1120000,
            mimeType: "application/pdf",
            verified: true,
          },
        ],
      });
    }
  }

  // 3. Seed Sample Leave Requests in HR
  const aminaUser = await prisma.user.findUnique({ where: { email: "amina.arch@dextaafrica.com" } });
  if (aminaUser) {
    const existingLeave = await prisma.leaveRequest.findFirst({ where: { userId: aminaUser.id } });
    if (!existingLeave) {
      await prisma.leaveRequest.create({
        data: {
          userId: aminaUser.id,
          employeeName: aminaUser.fullName,
          department: aminaUser.department,
          leaveType: "ANNUAL",
          startDate: new Date("2026-11-20"),
          endDate: new Date("2026-11-27"),
          daysCount: 6,
          reason: "Scheduled family annual leave and project milestone rest.",
          handoverNotes: "All architectural review prints handed over to Lead Drafter.",
          status: "PENDING",
        },
      });
    }
  }

  // 4. Seed IT Credential & Password Change Requests
  const chidiUser = await prisma.user.findUnique({ where: { email: "chidi.eng@dextaafrica.com" } });
  const itUser = await prisma.user.findUnique({ where: { email: "tariq.it@dextaafrica.com" } });

  if (chidiUser) {
    const existingTicket = await prisma.credentialRequest.findFirst({ where: { ticketNumber: "SEC-2026-8914" } });
    if (!existingTicket) {
      await prisma.credentialRequest.create({
        data: {
          ticketNumber: "SEC-2026-8914",
          userId: chidiUser.id,
          requesterName: chidiUser.fullName,
          requesterEmail: chidiUser.email,
          department: chidiUser.department,
          requestType: "PASSWORD_RESET",
          priority: "HIGH",
          reason: "Employee requested corporate password rotation after travel to regional site.",
          status: "PENDING",
          ipAddress: "197.210.64.18",
          userAgent: "Macintosh; Intel Mac OS X 10_15_7",
        },
      });
    }
  }

  // Seed an already approved ticket
  if (itUser) {
    const existingApproved = await prisma.credentialRequest.findFirst({ where: { ticketNumber: "SEC-2026-7820" } });
    if (!existingApproved) {
      await prisma.credentialRequest.create({
        data: {
          ticketNumber: "SEC-2026-7820",
          requesterName: "Esther Adeyemi",
          requesterEmail: "esther.ade@dextaafrica.com",
          department: "FINANCE",
          requestType: "ACCOUNT_PROVISION",
          priority: "MEDIUM",
          reason: "New Senior Financial Controller joining Dexta Africa. Provision work account.",
          status: "APPROVED",
          temporaryCode: "DXT-SEC-9218",
          itNotes: "Account created and welcome credential generated with mandatory 2FA enrollment.",
          reviewedById: itUser.id,
          resolvedAt: new Date(),
        },
      });
    }
  }

  // 5. Seed CRM Clients & Deals
  const clientsData = [
    {
      name: "Eko Atlantic Waterfront Developers",
      company: "Eko Atlantic Development Consortium",
      email: "consortium@ekoatlantic.com",
      phone: "+234 1 270 4000",
      category: "ACTIVE_CLIENT",
      stage: "CONTRACT_SIGNED",
      estimatedValue: 14500000,
      currency: "USD",
      location: "Victoria Island, Lagos",
      tags: JSON.stringify(["Infrastructure", "Waterfront", "Flagship"]),
      notes: "Primary client for coastal luxury high-rise real estate and civil development.",
      deals: [
        {
          title: "Marina Boulevard Commercial Towers Phase II",
          value: 14500000,
          currency: "USD",
          stage: "CLOSING",
          probability: 90,
          expectedCloseDate: new Date("2026-12-15"),
          notes: "Structural engineering approval and final stakeholder signing.",
        },
      ],
      activities: [
        {
          type: "MEETING",
          title: "Executive Quarterly Review & Groundbreaking Milestone",
          description: "Met with Managing Director and Project Engineers on site.",
          outcome: "Phase 1 certified, phase 2 procurement authorized.",
        },
      ],
    },
    {
      name: "Apex Logistics & Port Holdings",
      company: "Apex Africa Logistics Group",
      email: "procurement@apexlogistics.africa",
      phone: "+234 802 881 2901",
      category: "PROSPECT",
      stage: "PROPOSAL_SENT",
      estimatedValue: 6200000,
      currency: "USD",
      location: "Lekki Free Trade Zone, Lagos",
      tags: JSON.stringify(["Industrial", "Cold Storage", "Port Logistics"]),
      notes: "Prospective industrial warehouse facility and automated fulfillment center.",
      deals: [
        {
          title: "FTZ Cold Storage Hub & Distribution Complex",
          value: 6200000,
          currency: "USD",
          stage: "PROPOSAL",
          probability: 65,
          expectedCloseDate: new Date("2027-02-28"),
          notes: "Submitted civil engineering design specifications and timeline.",
        },
      ],
      activities: [
        {
          type: "PROPOSAL",
          title: "Architectural & Technical Bid Submitted",
          description: "Delivered comprehensive engineering proposal and budget framework.",
          outcome: "Awaiting board evaluation committee feedback.",
        },
      ],
    },
    {
      name: "Heritage Private Equity Partners",
      company: "Heritage Capital & Real Assets Ltd",
      email: "investments@heritagecapital.ng",
      phone: "+234 1 890 1200",
      category: "INVESTOR",
      stage: "ACTIVE_ACCOUNT",
      estimatedValue: 28000000,
      currency: "USD",
      location: "Ikoyi, Lagos",
      tags: JSON.stringify(["Institutional Investor", "REIT", "Equity"]),
      notes: "Institutional investment fund co-financing Dexta Africa residential portfolio.",
      deals: [
        {
          title: "Dexta Green Resilient Housing Fund",
          value: 28000000,
          currency: "USD",
          stage: "WON",
          probability: 100,
          expectedCloseDate: new Date("2026-08-30"),
          notes: "First tranche of $12M disbursed and active.",
        },
      ],
      activities: [
        {
          type: "CALL",
          title: "Investor ESG Compliance & Audit Call",
          description: "Briefed fund trustees on environmental impact and local workforce safety.",
          outcome: "Exceeded ESG benchmarks for Q3 2026.",
        },
      ],
    },
  ];

  for (const c of clientsData) {
    const existing = await prisma.crmClient.findUnique({ where: { email: c.email } });
    if (!existing) {
      const client = await prisma.crmClient.create({
        data: {
          name: c.name,
          company: c.company,
          email: c.email,
          phone: c.phone,
          category: c.category,
          stage: c.stage,
          estimatedValue: c.estimatedValue,
          currency: c.currency,
          location: c.location,
          tags: c.tags,
          notes: c.notes,
        },
      });

      for (const d of c.deals) {
        await prisma.crmDeal.create({
          data: {
            clientId: client.id,
            title: d.title,
            value: d.value,
            currency: d.currency,
            stage: d.stage,
            probability: d.probability,
            expectedCloseDate: d.expectedCloseDate,
            notes: d.notes,
          },
        });
      }

      for (const a of c.activities) {
        await prisma.crmActivity.create({
          data: {
            clientId: client.id,
            type: a.type,
            title: a.title,
            description: a.description,
            outcome: a.outcome,
          },
        });
      }
    }
  }

  // 6. Seed Default System Settings
  const settings = [
    { key: "MFA_POLICY", value: "ENFORCED_FOR_ADMINS", description: "Enforce 2FA/MFA for all Super Admin and Admin roles" },
    { key: "SESSION_TIMEOUT_MINUTES", value: "720", description: "Inactivity session expiry timeout" },
    { key: "MAX_FAILED_LOGINS", value: "5", description: "Account lockout threshold for brute force protection" },
    { key: "IT_CREDENTIAL_APPROVAL_REQUIRED", value: "TRUE", description: "All password resets and credential updates require IT Department authorization" },
    { key: "HR_AUTO_ONBOARDING_PIPELINE", value: "ENABLED", description: "Automated onboarding document checklists for new staff" },
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

  console.log("✅ [Dexta Africa] Comprehensive CRM, HR & IT database seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ [Dexta Africa] Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
