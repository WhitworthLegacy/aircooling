import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, ...data }, { status });
}

export function jsonError(
  code: string,
  message: string,
  requestId: string,
  status = 400
) {
  return NextResponse.json(
    { success: false, error: { code, message, requestId } },
    { status }
  );
}

export function jsonUnauthorized(message = "Non authentifié") {
  return NextResponse.json(
    { success: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

export function jsonForbidden(message = "Accès interdit") {
  return NextResponse.json(
    { success: false, error: { code: "FORBIDDEN", message } },
    { status: 403 }
  );
}
