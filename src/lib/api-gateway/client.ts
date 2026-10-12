import crypto from "crypto";
import { prisma } from "../prisma";

export async function pingEndpoint(endpointId: string): Promise<{
  latencyMs: number;
  statusCode: number;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
}> {
  const endpoint = await prisma.apiEndpoint.findUnique({
    where: { id: endpointId },
  });

  if (!endpoint) throw new Error("Endpoint not found");

  const start = Date.now();
  let statusCode = 0;
  let status: "HEALTHY" | "DEGRADED" | "DOWN" = "DOWN";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(endpoint.baseUrl, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    statusCode = res.status;
    const latency = Date.now() - start;

    if (res.ok) {
      status = latency > 1500 ? "DEGRADED" : "HEALTHY";
    } else {
      status = "DEGRADED";
    }

    await prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: {
        lastLatencyMs: latency,
        healthStatus: status,
        lastPingAt: new Date(),
      },
    });

    return { latencyMs: latency, statusCode, status };
  } catch {
    const latency = Date.now() - start;
    await prisma.apiEndpoint.update({
      where: { id: endpointId },
      data: {
        lastLatencyMs: latency,
        healthStatus: "DOWN",
        lastPingAt: new Date(),
      },
    });

    return { latencyMs: latency, statusCode: 0, status: "DOWN" };
  }
}

export function generateHmacSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

