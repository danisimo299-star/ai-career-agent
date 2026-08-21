import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validation/auth.schema";
import { authService, EmailTakenError } from "@/server/services/auth.service";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  try {
    const user = await authService.register(parsed.data);
    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (error) {
    if (error instanceof EmailTakenError) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
