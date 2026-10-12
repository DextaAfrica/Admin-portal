import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folder = searchParams.get("folder");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (folder && folder !== "all") {
      where.folder = folder;
    }
    if (search) {
      where.fileName = { contains: search };
    }

    const assets = await prisma.storageAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        uploader: {
          select: { fullName: true, email: true },
        },
      },
    });

    const totalBytes = await prisma.storageAsset.aggregate({
      _sum: { fileSize: true },
      _count: { id: true },
    });

    return NextResponse.json({
      assets,
      stats: {
        totalFiles: totalBytes._count.id || 0,
        totalBytes: totalBytes._sum.fileSize || 0,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load assets" },
      { status: 500 }
    );
  }
}

