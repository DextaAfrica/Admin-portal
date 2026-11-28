import { NextResponse } from "next/server";
import {
  VISIT_DEPARTMENTS,
  VISIT_PURPOSES,
  VISITOR_COUNTRY_CODES,
} from "@/lib/visitors/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      purposes: VISIT_PURPOSES,
      departments: VISIT_DEPARTMENTS,
      countryCodes: VISITOR_COUNTRY_CODES,
    },
    { headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=600" } }
  );
}
