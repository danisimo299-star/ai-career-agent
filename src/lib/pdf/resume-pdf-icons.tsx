import { Svg, Path, Rect, Circle, Line } from "@react-pdf/renderer";

/**
 * Hand-ported from the exact `lucide-react` path data for these four icons
 * (mail/phone/map-pin/link-2, 24x24 viewBox, round joins) — react-pdf can't
 * render an actual `<svg>` font icon or emoji glyph (PT Sans has no
 * pictographic coverage and PDF standard fonts have no Cyrillic, let alone
 * emoji), so the contact row is drawn as real vector paths instead. Kept
 * pixel-identical to the icon set used everywhere else in the app so a
 * resume's header doesn't feel like a different product.
 */
interface IconProps {
  size?: number;
  color?: string;
}

const commonStroke = { fill: "none", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function MailIcon({ size = 10, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" stroke={color} {...commonStroke} />
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} {...commonStroke} />
    </Svg>
  );
}

export function PhoneIcon({ size = 10, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
        stroke={color}
        {...commonStroke}
      />
    </Svg>
  );
}

export function PinIcon({ size = 10, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"
        stroke={color}
        {...commonStroke}
      />
      <Circle cx={12} cy={10} r={3} stroke={color} {...commonStroke} />
    </Svg>
  );
}

export function LinkIcon({ size = 10, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 17H7A5 5 0 0 1 7 7h2" stroke={color} {...commonStroke} />
      <Path d="M15 7h2a5 5 0 1 1 0 10h-2" stroke={color} {...commonStroke} />
      <Line x1={8} x2={16} y1={12} y2={12} stroke={color} {...commonStroke} />
    </Svg>
  );
}

/**
 * Returns the icon element directly (rather than handing back a component
 * reference to be used as a JSX tag) — react-pdf's icons are plain
 * function components, and picking one dynamically by variable trips the
 * "no components created during render" lint rule even though nothing is
 * actually being defined at render time here.
 */
export function renderContactIcon(type: "email" | "phone" | "city" | "linkedin" | "github" | "website", size: number, color: string) {
  if (type === "email") return <MailIcon size={size} color={color} />;
  if (type === "phone") return <PhoneIcon size={size} color={color} />;
  if (type === "city") return <PinIcon size={size} color={color} />;
  return <LinkIcon size={size} color={color} />;
}
