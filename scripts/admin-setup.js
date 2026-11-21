#!/usr/bin/env node

/**
 * Dexta Africa Enterprise IT Admin CLI Utility
 * 
 * Provides fail-safe administrative control, emergency access recovery,
 * password resets, user provisioning, and activation key management
 * directly on the production or development server.
 * 
 * Usage:
 *   node scripts/admin-setup.js --list
 *   node scripts/admin-setup.js --set-password <email> <newPassword>
 *   node scripts/admin-setup.js --create-admin <email> <fullName> <password> [department] [role]
 *   node scripts/admin-setup.js --generate-key <email>
 *   node scripts/admin-setup.js --disable-mfa <email>
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function printUsers() {
  console.log("\n================================================================================");
  console.log("            DEXTA AFRICA ENTERPRISE USER DIRECTORY (DATABASE)                   ");
  console.log("================================================================================\n");

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      department: true,
      jobTitle: true,
      status: true,
      twoFactorEnabled: true,
      mustChangePassword: true,
      activationKey: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (users.length === 0) {
    console.log("  No users found in database.");
  } else {
    users.forEach((u, i) => {
      console.log(`[${i + 1}] ${u.fullName} (${u.email})`);
      console.log(`    Role: ${u.role} | Dept: ${u.department} | Title: ${u.jobTitle || "N/A"}`);
      console.log(`    Status: ${u.status} | 2FA: ${u.twoFactorEnabled ? "ENABLED" : "DISABLED"} | MustChangePass: ${u.mustChangePassword}`);
      console.log(`    Activation Key: ${u.activationKey || "None (Activated)"}`);
      console.log(`    Last Login: ${u.lastLoginAt ? u.lastLoginAt.toISOString() : "Never"}`);
      console.log("--------------------------------------------------------------------------------");
    });
  }
  console.log(`Total Accounts: ${users.length}\n`);
}

async function setPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error("Error: Both <email> and <newPassword> are required.");
    console.error("Example: node scripts/admin-setup.js --set-password it.admin@dextaafrica.com MyNewSecret123!");
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    console.error(`Error: User with email "${cleanEmail}" does not exist in database.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      mustChangePassword: false,
      activationKey: null,
      status: "ACTIVE",
    },
  });

  console.log(`\n✅ Password successfully updated for ${user.fullName} (${cleanEmail})!`);
  console.log(`   Account status set to ACTIVE, mustChangePassword cleared.`);
  console.log(`   The user can now sign in at /login with their new password.\n`);
}

async function createAdmin(email, fullName, password, department = "IT", role = "ADMIN") {
  if (!email || !fullName || !password) {
    console.error("Error: <email>, <fullName>, and <password> are required.");
    console.error("Example: node scripts/admin-setup.js --create-admin it.admin@dextaafrica.com \"Systems IT Admin\" SecurePass123! IT ADMIN");
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  const existing = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: {
        fullName,
        passwordHash,
        role: role.toUpperCase(),
        department: department.toUpperCase(),
        status: "ACTIVE",
        mustChangePassword: false,
        activationKey: null,
      },
    });
    console.log(`\n✅ Existing user updated to Administrator: ${updated.fullName} (${updated.email})`);
    console.log(`   Role: ${updated.role} | Department: ${updated.department}\n`);
  } else {
    const newUser = await prisma.user.create({
      data: {
        email: cleanEmail,
        fullName: fullName.trim(),
        passwordHash,
        role: role.toUpperCase(),
        department: department.toUpperCase(),
        seniorityLevel: "SENIOR",
        jobTitle: department === "IT" ? "Systems Administrator" : "Executive Administrator",
        phone: "+234 800 000 0000",
        status: "ACTIVE",
        mustChangePassword: false,
        activationKey: null,
        twoFactorEnabled: false,
      },
    });
    console.log(`\n✅ New Administrator created: ${newUser.fullName} (${newUser.email})`);
    console.log(`   Role: ${newUser.role} | Department: ${newUser.department}\n`);
  }
}

async function generateKey(email) {
  if (!email) {
    console.error("Error: <email> is required.");
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    console.error(`Error: User with email "${cleanEmail}" does not exist.`);
    process.exit(1);
  }

  const activationKey = `DXT-ACT-${Math.floor(1000 + Math.random() * 9000)}`;
  const passwordHash = await bcrypt.hash(activationKey, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      activationKey,
      passwordHash,
      mustChangePassword: true,
    },
  });

  console.log(`\n✅ Generated new IT Activation Key for ${user.fullName} (${cleanEmail}):`);
  console.log(`   Key: ${activationKey}`);
  console.log(`   Activation URL: https://admin.dextaafrica.com/register?action=activate&email=${encodeURIComponent(cleanEmail)}&key=${activationKey}\n`);
}

async function disableMfa(email) {
  if (!email) {
    console.error("Error: <email> is required.");
    process.exit(1);
  }

  const cleanEmail = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (!user) {
    console.error(`Error: User with email "${cleanEmail}" does not exist.`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  console.log(`\n✅ 2FA disabled for ${user.fullName} (${cleanEmail}). The user can now authenticate directly with their password.\n`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case "--list":
      case "-l":
        await printUsers();
        break;

      case "--set-password":
      case "-p":
        await setPassword(args[1], args[2]);
        break;

      case "--create-admin":
      case "-c":
        await createAdmin(args[1], args[2], args[3], args[4], args[5]);
        break;

      case "--generate-key":
      case "-k":
        await generateKey(args[1]);
        break;

      case "--disable-mfa":
      case "-m":
        await disableMfa(args[1]);
        break;

      default:
        console.log(`
Dexta Africa Enterprise IT Admin CLI Utility
-------------------------------------------
Commands:
  node scripts/admin-setup.js --list
      Lists all users in the system with their role, 2FA status, and activation status.

  node scripts/admin-setup.js --set-password <email> <newPassword>
      Sets or resets the password for any enterprise user account directly.

  node scripts/admin-setup.js --create-admin <email> <fullName> <password> [department] [role]
      Creates or updates an enterprise administrator account.

  node scripts/admin-setup.js --generate-key <email>
      Issues a new DXT-ACT-XXXX activation key for an employee.

  node scripts/admin-setup.js --disable-mfa <email>
      Emergency 2FA bypass / reset if an admin loses their MFA authenticator.
`);
        break;
    }
  } catch (err) {
    console.error("Fatal execution error:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
