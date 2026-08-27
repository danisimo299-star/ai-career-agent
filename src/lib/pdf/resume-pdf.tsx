import path from "node:path";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { getResumeContactItems, type ResumeContactItem, type ResumeContent } from "@/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { getInitials } from "@/lib/utils";
import { renderContactIcon } from "./resume-pdf-icons";

/**
 * `@react-pdf/renderer`'s built-in "Helvetica" is a PDF standard font with
 * no Cyrillic glyphs at all — rendering Russian text with it doesn't throw,
 * it silently produces invisible/garbled glyphs, which is exactly why
 * downloaded resumes looked "empty" for the app's default (Russian) locale.
 * PT Sans (SIL OFL 1.1, embedding/redistribution explicitly permitted — see
 * `fonts/OFL.txt`) was designed by ParaType specifically for full Cyrillic +
 * Latin coverage, and is registered once per process here so every PDF
 * request reuses it instead of re-registering per render. `process.cwd()`
 * resolves correctly both in `next dev` and in a standard Next.js server
 * build, where these files are traced and bundled as local assets.
 */
const FONTS_DIR = path.join(process.cwd(), "src/lib/pdf/fonts");
Font.register({
  family: "PT Sans",
  fonts: [
    { src: path.join(FONTS_DIR, "PTSans-Regular.ttf"), fontWeight: "normal" },
    { src: path.join(FONTS_DIR, "PTSans-Bold.ttf"), fontWeight: "bold" },
    { src: path.join(FONTS_DIR, "PTSans-Italic.ttf"), fontStyle: "italic" },
  ],
});
// Long unbroken strings (e.g. emails) otherwise never wrap inside a fixed-width PDF page.
Font.registerHyphenationCallback((word) => [word]);

type ResumeTemplate = "MODERN" | "PROFESSIONAL" | "MINIMAL";

const palette: Record<
  ResumeTemplate,
  { accent: string; heading: string; text: string; muted: string; sidebarBg: string; avatarBg: string; avatarText: string }
> = {
  MODERN: { accent: "#2563eb", heading: "#0f172a", text: "#1e293b", muted: "#64748b", sidebarBg: "#eff6ff", avatarBg: "#2563eb", avatarText: "#ffffff" },
  PROFESSIONAL: { accent: "#1f2937", heading: "#111827", text: "#1f2937", muted: "#4b5563", sidebarBg: "#f3f4f6", avatarBg: "#1f2937", avatarText: "#ffffff" },
  MINIMAL: { accent: "#000000", heading: "#000000", text: "#111111", muted: "#555555", sidebarBg: "#ffffff", avatarBg: "#ffffff", avatarText: "#000000" },
};

function makeStyles(template: ResumeTemplate) {
  const colors = palette[template];
  const isModern = template === "MODERN";
  return StyleSheet.create({
    page: {
      padding: template === "MINIMAL" ? 40 : 32,
      fontSize: 10,
      fontFamily: "PT Sans",
      color: colors.text,
    },
    twoColumn: { flexDirection: "row", gap: 20 },
    sidebar: {
      width: "32%",
      backgroundColor: colors.sidebarBg,
      borderRadius: 6,
      padding: 14,
    },
    main: { width: "68%" },
    headerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
    avatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: colors.avatarBg,
      border: template === "MINIMAL" ? `1.5 solid ${colors.heading}` : undefined,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { fontFamily: "PT Sans", fontWeight: "bold", fontSize: 13, color: colors.avatarText },
    name: {
      fontSize: isModern ? 20 : 18,
      fontFamily: "PT Sans",
      fontWeight: "bold",
      color: colors.heading,
    },
    roleTagline: { fontSize: 11, fontFamily: "PT Sans", fontWeight: "bold", color: colors.accent, marginTop: 1 },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      color: colors.muted,
      fontSize: 9,
      marginBottom: isModern ? 12 : 8,
      columnGap: 12,
      rowGap: 3,
    },
    contactColumn: { color: colors.muted, fontSize: 9, gap: 5 },
    contactItemRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    sidebarDivider: { borderTop: `1 solid ${isModern ? "#dbeafe" : "#e5e7eb"}`, marginTop: 12, marginBottom: 12 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "PT Sans",
      fontWeight: "bold",
      color: template === "MINIMAL" ? colors.heading : colors.accent,
      marginTop: 12,
      marginBottom: 6,
      textTransform: isModern ? "uppercase" : "none",
      letterSpacing: isModern ? 0.5 : undefined,
      borderBottom: template === "PROFESSIONAL" ? `1 solid ${colors.muted}` : undefined,
      paddingBottom: template === "PROFESSIONAL" ? 3 : 0,
    },
    entry: { marginBottom: 8 },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontFamily: "PT Sans", fontWeight: "bold", fontSize: 10.5, color: colors.heading },
    entrySubtitle: { fontSize: 9.5, color: colors.muted },
    entryDate: { fontSize: 9, color: colors.muted },
    bullet: { fontSize: 9.5, marginTop: 2, marginLeft: 8, lineHeight: 1.35 },
    paragraph: { fontSize: 9.5, lineHeight: 1.4 },
    skillsRow: { flexDirection: "row", flexWrap: "wrap" },
    skillChip: {
      fontSize: 9,
      backgroundColor: template === "MINIMAL" ? "#ffffff" : isModern ? "#ffffff" : "#f1f5f9",
      border: template === "MINIMAL" ? `1 solid ${colors.muted}` : undefined,
      borderRadius: 3,
      paddingVertical: 3,
      paddingHorizontal: 6,
      marginRight: 6,
      marginBottom: 6,
      color: colors.text,
    },
  });
}

interface ResumePdfDocumentProps {
  content: ResumeContent;
  template: ResumeTemplate;
  dict: Dictionary;
  /** The resume's target role (`Resume.title`) — shown as a tagline under the name, same as the on-screen preview. */
  targetRole?: string;
}

function ContactRow({ item, color, style }: { item: ResumeContactItem; color: string; style: Style }) {
  return (
    <View style={style}>
      {renderContactIcon(item.type, 8.5, color)}
      <Text>{item.value}</Text>
    </View>
  );
}

/** `View`/`Text` builders shared between the single-column and the MODERN two-column layouts, so both read from exactly the same data with no risk of drifting out of sync. */
function buildSections(content: ResumeContent, dict: Dictionary, s: ReturnType<typeof makeStyles>) {
  const labels = dict.dashboard.resumePage.sections;

  const main = (
    <>
      {content.careerObjective && (
        <View>
          <Text style={s.sectionTitle}>{labels.careerObjective}</Text>
          <Text style={s.paragraph}>{content.careerObjective}</Text>
        </View>
      )}

      {content.summary && (
        <View>
          <Text style={s.sectionTitle}>{labels.summary}</Text>
          <Text style={s.paragraph}>{content.summary}</Text>
        </View>
      )}

      {content.experience.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.experience}</Text>
          {content.experience.map((exp, i) => (
            <View key={i} style={s.entry}>
              <View style={s.entryHeaderRow}>
                <Text style={s.entryTitle}>
                  {exp.role} — {exp.company}
                </Text>
                <Text style={s.entryDate}>
                  {exp.startDate}
                  {exp.endDate ? ` – ${exp.endDate}` : ""}
                </Text>
              </View>
              {exp.bullets.map((bullet, j) => (
                <Text key={j} style={s.bullet}>
                  • {bullet}
                </Text>
              ))}
            </View>
          ))}
        </View>
      )}

      {content.projects.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.projects}</Text>
          {content.projects.map((project, i) => (
            <View key={i} style={s.entry}>
              <Text style={s.entryTitle}>
                {project.name}
                {project.technologies.length > 0 ? ` — ${project.technologies.join(", ")}` : ""}
              </Text>
              <Text style={s.paragraph}>{project.description}</Text>
            </View>
          ))}
        </View>
      )}

      {content.education.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.education}</Text>
          {content.education.map((edu, i) => (
            <View key={i} style={s.entry}>
              <View style={s.entryHeaderRow}>
                <Text style={s.entryTitle}>{edu.school}</Text>
                <Text style={s.entryDate}>
                  {edu.startDate}
                  {edu.endDate ? ` – ${edu.endDate}` : ""}
                </Text>
              </View>
              {edu.degree && <Text style={s.entrySubtitle}>{edu.degree}</Text>}
            </View>
          ))}
        </View>
      )}
    </>
  );

  const side = (
    <>
      {content.skills.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.skills}</Text>
          <View style={s.skillsRow}>
            {content.skills.map((skill, i) => (
              <Text key={i} style={s.skillChip}>
                {skill}
              </Text>
            ))}
          </View>
        </View>
      )}

      {content.languages.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.languages}</Text>
          <Text style={s.paragraph}>{content.languages.map((l) => `${l.name} (${l.level})`).join("   ·   ")}</Text>
        </View>
      )}

      {content.certificates.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>{labels.certificates}</Text>
          {content.certificates.map((cert, i) => (
            <Text key={i} style={s.paragraph}>
              {cert.name}
              {cert.issuer ? ` — ${cert.issuer}` : ""}
              {cert.date ? ` (${cert.date})` : ""}
            </Text>
          ))}
        </View>
      )}
    </>
  );

  return { main, side };
}

export function ResumePdfDocument({ content, template, dict, targetRole }: ResumePdfDocumentProps) {
  const s = makeStyles(template);
  const colors = palette[template];
  const contact = getResumeContactItems(content.personalInfo);
  const initials = getInitials(content.personalInfo.fullName);
  const { main, side } = buildSections(content, dict, s);

  const avatar = (
    <View style={s.avatar}>
      <Text style={s.avatarText}>{initials}</Text>
    </View>
  );

  // MODERN mirrors the on-screen preview's two-column layout — a tinted
  // sidebar carrying identity + skills/languages/certificates, main
  // narrative content on the right. PROFESSIONAL/MINIMAL stay a single
  // flowing column, matching what the preview renders for those templates.
  if (template === "MODERN") {
    return (
      <Document>
        <Page size="A4" style={s.page}>
          <View style={s.twoColumn}>
            <View style={s.sidebar}>
              <View style={s.headerRow}>
                {avatar}
                <View>
                  <Text style={s.name}>{content.personalInfo.fullName || " "}</Text>
                  {targetRole && <Text style={s.roleTagline}>{targetRole}</Text>}
                </View>
              </View>
              <View style={s.sidebarDivider} />
              <View style={s.contactColumn}>
                {contact.map((item, i) => (
                  <ContactRow key={i} item={item} color={colors.accent} style={s.contactItemRow} />
                ))}
              </View>
              {side}
            </View>
            <View style={s.main}>{main}</View>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          {avatar}
          <View>
            <Text style={s.name}>{content.personalInfo.fullName || " "}</Text>
            {targetRole && <Text style={s.roleTagline}>{targetRole}</Text>}
          </View>
        </View>
        <View style={s.contactRow}>
          {contact.map((item, i) => (
            <ContactRow key={i} item={item} color={colors.muted} style={s.contactItemRow} />
          ))}
        </View>
        {main}
        {side}
      </Page>
    </Document>
  );
}
