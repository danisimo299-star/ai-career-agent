import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentUser } from "@/lib/auth/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { resumeService, ResumeAccessError } from "@/server/services/resume.service";
import { ResumePdfDocument } from "@/lib/pdf/resume-pdf";
import { isResumeContentMeaningful, type ResumeContent } from "@/types";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user?.id) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const resume = await resumeService.exportPdf(user.id, id);
    const locale = await getLocale();
    const dict = getDictionary(locale);
    const content = resume.content as unknown as ResumeContent;

    // A resume with nothing written yet would produce a technically-valid
    // but functionally blank PDF (just whatever placeholder name/email
    // exist) — treated as a real error rather than letting the user
    // download a document with nothing in it to send an employer.
    if (!isResumeContentMeaningful(content)) {
      return NextResponse.json({ error: "empty_resume" }, { status: 422 });
    }

    const buffer = await renderToBuffer(
      <ResumePdfDocument content={content} template={resume.template} dict={dict} />
    );

    const rawName = content.personalInfo.fullName.trim() || "resume";
    // `Content-Disposition` must be a valid ByteString (Latin1) — a Cyrillic
    // or other non-Latin1 name throws at the header-construction step, not
    // at render time, so it silently 500s the whole download otherwise.
    // `filename` carries an ASCII-safe fallback; `filename*` (RFC 5987)
    // carries the real UTF-8 name for the browsers (all modern ones) that
    // support it, so non-Latin names still produce a properly named file.
    const asciiName = rawName.replace(/[^\x20-\x7E]/g, "").trim() || "resume";
    const encodedName = encodeURIComponent(rawName);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${asciiName}.pdf"; filename*=UTF-8''${encodedName}.pdf`,
      },
    });
  } catch (error) {
    if (error instanceof ResumeAccessError) return NextResponse.json({ error: error.message }, { status: 404 });
    console.error("resume.exportPdf failed", error);
    return NextResponse.json({ error: "generic" }, { status: 500 });
  }
}
