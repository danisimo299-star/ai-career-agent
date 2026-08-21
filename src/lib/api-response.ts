import { NextResponse } from "next/server";

export function notImplemented(feature: string) {
  return NextResponse.json(
    { error: `${feature} is not implemented yet.` },
    { status: 501 }
  );
}
