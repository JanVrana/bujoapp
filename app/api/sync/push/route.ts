import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, unauthorized, badRequest } from "@/lib/auth-helpers";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  const body = await req.json();
  const { operations } = body;

  if (!operations || !Array.isArray(operations)) {
    return badRequest("Operations array is required");
  }

  const results = [];

  for (const operation of operations) {
    const { type, endpoint, method, body: opBody } = operation;

    try {
      const baseUrl = new URL(req.url).origin;
      const url = `${baseUrl}${endpoint}`;

      const fetchOptions: RequestInit = {
        method: method || "POST",
        headers: {
          "Content-Type": "application/json",
          cookie: req.headers.get("cookie") || "",
        },
      };

      if (opBody && method !== "GET" && method !== "DELETE") {
        fetchOptions.body = JSON.stringify(opBody);
      }

      const response = await fetch(url, fetchOptions);
      const data = await response.json();

      results.push({
        type,
        status: response.status,
        data,
        success: response.ok,
      });
    } catch (error) {
      results.push({
        type,
        status: 500,
        data: null,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({ results });
}
