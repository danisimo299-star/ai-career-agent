import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { chatService } from "@/server/services/chat.service";
import { QUESTION_IDS } from "@/lib/ai/career/questionnaire";
import { AIProviderUnavailableError } from "@/lib/errors";
import { z } from "zod";

const sendMessageSchema = z
  .object({
    content: z.string().trim().max(4000).optional(),
    questionId: z.enum(QUESTION_IDS).optional(),
    selectedKeys: z.array(z.string().max(60)).max(10).optional(),
    skipped: z.boolean().optional(),
  })
  .refine((data) => Boolean(data.content?.length) || Boolean(data.selectedKeys?.length) || data.skipped, {
    message: "content, selectedKeys, or skipped is required",
  });

export async function GET() {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const locale = await getLocale();
  const [messages, progress] = await Promise.all([chatService.getConversation(user.id, locale), chatService.getProgress(user.id)]);
  return NextResponse.json({ messages, ...progress });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });

  const locale = await getLocale();

  try {
    const result = await chatService.sendMessage(user.id, locale, parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AIProviderUnavailableError) return NextResponse.json({ error: "ai_unavailable" }, { status: 503 });
    console.error("chat.sendMessage failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
