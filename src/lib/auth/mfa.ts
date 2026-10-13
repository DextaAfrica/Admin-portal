import { authenticator } from "otplib";
import QRCode from "qrcode";
import crypto from "crypto";
import { prisma } from "../prisma";

// Configure otplib window tolerance for mobile clock drift
authenticator.options = {
  window: 1, // +/- 30 seconds
};

export async function generateMfaSecret({ email }: { email: string }) {
  const secret = authenticator.generateSecret();
  const serviceName = "Dexta Africa Admin";
  const otpauth = authenticator.keyuri(email, serviceName, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauth, {
    width: 256,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });

  const currentOtp = authenticator.generate(secret);

  return {
    secret,
    otpauth,
    qrCodeDataUrl,
    currentOtp,
  };
}

export function verifyTotpToken({
  token,
  secret,
}: {
  token: string;
  secret: string;
}): boolean {
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex");
}

export async function generateAndStoreRecoveryCodes(userId: string): Promise<string[]> {
  // Delete old recovery codes
  await prisma.twoFactorRecoveryCode.deleteMany({
    where: { userId },
  });

  const rawCodes: string[] = [];
  const codeRecords = [];

  for (let i = 0; i < 10; i++) {
    const raw = crypto.randomBytes(5).toString("hex").toUpperCase(); // 10-char alphanumeric
    rawCodes.push(raw);
    codeRecords.push({
      userId,
      codeHash: hashCode(raw),
      isUsed: false,
    });
  }

  await prisma.twoFactorRecoveryCode.createMany({
    data: codeRecords,
  });

  return rawCodes;
}

export async function verifyAndBurnRecoveryCode({
  userId,
  code,
}: {
  userId: string;
  code: string;
}): Promise<boolean> {
  const hash = hashCode(code);
  const match = await prisma.twoFactorRecoveryCode.findFirst({
    where: {
      userId,
      codeHash: hash,
      isUsed: false,
    },
  });

  if (!match) return false;

  await prisma.twoFactorRecoveryCode.update({
    where: { id: match.id },
    data: {
      isUsed: true,
      usedAt: new Date(),
    },
  });

  return true;
}

