import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/auth/audit";
import { ensureInitialEnterpriseData } from "@/lib/automation/engine";

export const dynamic = "force-dynamic";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureInitialEnterpriseData();

    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const type = searchParams.get("type");

    const where: any = {};
    if (department && department !== "ALL") where.department = department;
    if (type && type !== "ALL") where.type = type;

    const transactions = await db.financialTransaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      take: 50,
    });

    const inflowAgg = await db.financialTransaction.aggregate({
      where: { type: "CAPITAL_INFLOW", status: "SETTLED" },
      _sum: { amount: true },
    });

    const disbursementAgg = await db.financialTransaction.aggregate({
      where: {
        type: { in: ["PROJECT_DISBURSEMENT", "CONTRACTOR_PAYOUT", "PAYROLL", "TREASURY_TRANSFER"] },
        status: "SETTLED",
      },
      _sum: { amount: true },
    });

    const totalInflow = inflowAgg._sum.amount || 0;
    const totalDisbursed = disbursementAgg._sum.amount || 0;
    const netTreasuryBalance = totalInflow - totalDisbursed;

    return NextResponse.json({
      transactions,
      summary: {
        totalInflow,
        totalDisbursed,
        netTreasuryBalance,
        totalTransactions: transactions.length,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      title,
      description,
      amount,
      currency = "USD",
      department = "OPERATIONS",
      recipientOrEntity,
      status = "SETTLED",
    } = body;

    if (!type || !title || !amount || !recipientOrEntity) {
      return NextResponse.json(
        { error: "Transaction type, title, amount, and recipient/entity are required" },
        { status: 400 }
      );
    }

    const reference = `TXN-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction = await db.financialTransaction.create({
      data: {
        reference,
        type,
        title,
        description,
        amount: Number(amount),
        currency,
        department,
        status,
        recipientOrEntity,
        authorizedBy: user.fullName,
        approvedBy: user.role === "SUPER_ADMIN" ? user.fullName : null,
        transactionDate: new Date(),
      },
    });

    // Notify Executive & Finance
    await db.dashboardNotification.create({
      data: {
        department: "FINANCE",
        title: `New Transaction Recorded: ${reference}`,
        message: `${user.fullName} logged ${currency} ${Number(amount).toLocaleString()} (${title}).`,
        type: "TRANSACTION",
        link: "/dashboard?tab=finance",
        isRead: false,
      },
    });

    await logAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "FINANCIAL_TRANSACTION_RECORDED",
      entity: "FinancialTransaction",
      entityId: transaction.id,
      ipAddress: req.headers.get("x-forwarded-for") || "127.0.0.1",
      userAgent: req.headers.get("user-agent"),
      metadata: { reference, type, amount, currency, recipientOrEntity },
    });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}

