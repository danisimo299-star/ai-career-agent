import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { ResumeContent } from "@/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type ResumeTemplate = "MODERN" | "PROFESSIONAL" | "MINIMAL";

const palette: Record<ResumeTemplate, { accent: string; heading: string; text: string; muted: string }> = {
  MODERN: { accent: "#2563eb", heading: "#0f172a", text: "#1e293b", muted: "#64748b" },
  PROFESSIONAL: { accent: "#1f2937", heading: "#111827", text: "#1f2937", muted: "#4b5563" },
  MINIMAL: { accent: "#000000", heading: "#000000", text: "#111111", muted: "#555555" },
};

function makeStyles(template: ResumeTemplate) {
  const colors = palette[template];
  return StyleSheet.create({
    page: {
      padding: template === "MINIMAL" ? 40 : 32,
      fontSize: 10,
      fontFamily: "Helvetica",
      color: colors.text,
    },
    name: {
      fontSize: template === "MODERN" ? 22 : 18,
      fontFamily: "Helvetica-Bold",
      color: colors.heading,
      marginBottom: 2,
    },
    contactRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      color: colors.muted,
      fontSize: 9,
      marginBottom: template === "MODERN" ? 12 : 8,
    },
    contactItem: { marginRight: 10 },
    sectionTitle: {
      fontSize: 11,
      fontFamily: "Helvetica-Bold",
      color: template === "MINIMAL" ? colors.heading : colors.accent,
      marginTop: 12,
      marginBottom: 6,
      textTransform: template === "MODERN" ? "uppercase" : "none",
      borderBottom: template === "PROFESSIONAL" ? `1 solid ${colors.muted}` : undefined,
      paddingBottom: template === "PROFESSIONAL" ? 3 : 0,
    },
    entry: { marginBottom: 8 },
    entryHeaderRow: { flexDirection: "row", justifyContent: "space-between" },
    entryTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: colors.heading },
    entrySubtitle: { fontSize: 9.5, color: colors.muted },
    entryDate: { fontSize: 9, color: colors.muted },
    bullet: { fontSize: 9.5, marginTop: 2, marginLeft: 8 },
    paragraph: { fontSize: 9.5, lineHeight: 1.4 },
    skillsRow: { flexDirection: "row", flexWrap: "wrap" },
    skillChip: {
      fontSize: 9,
      backgroundColor: template === "MINIMAL" ? "#ffffff" : "#f1f5f9",
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
}

export function ResumePdfDocument({ content, template, dict }: ResumePdfDocumentProps) {
  const s = makeStyles(template);
  const labels = dict.dashboard.resumePage.sections;
  const contact = [content.personalInfo.email, content.personalInfo.phone, content.personalInfo.city, content.personalInfo.linkedin, content.personalInfo.github, content.personalInfo.website].filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <Text style={s.name}>{content.personalInfo.fullName || " "}</Text>
        <View style={s.contactRow}>
          {contact.map((item, i) => (
            <Text key={i} style={s.contactItem}>
              {item}
              {i < contact.length - 1 ? "  ·" : ""}
            </Text>
          ))}
        </View>

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
                <Text style={s.entrySubtitle}>{edu.degree}</Text>
              </View>
            ))}
          </View>
        )}

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
      </Page>
    </Document>
  );
}
