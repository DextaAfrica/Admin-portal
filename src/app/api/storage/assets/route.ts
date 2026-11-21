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
    const scope = searchParams.get("scope"); // "mine" | "all"
    const search = searchParams.get("search")?.trim();

    const where: any = {};

    if (scope === "mine") {
      where.uploadedById = user.id;
    }

    if (folder && folder !== "all") {
      if (folder === "personal") {
        where.uploadedById = user.id;
        where.folder = "personal";
      } else {
        where.folder = folder;
      }
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search } },
        { folder: { contains: search } },
        { key: { contains: search } },
      ];
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

    const [totalAggregate, myAggregate] = await Promise.all([
      prisma.storageAsset.aggregate({
        _sum: { fileSize: true },
        _count: { id: true },
      }),
      prisma.storageAsset.aggregate({
        where: { uploadedById: user.id },
        _sum: { fileSize: true },
        _count: { id: true },
      }),
    ]);

    return NextResponse.json({
      assets,
      stats: {
        totalFiles: totalAggregate._count.id || 0,
        totalBytes: totalAggregate._sum.fileSize || 0,
        myFilesCount: myAggregate._count.id || 0,
        myFilesBytes: myAggregate._sum.fileSize || 0,
      },
    });
  } catch (err: unknown) {
    console.error("Storage assets error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load assets" },
      { status: 500 }
    );
  }
}
