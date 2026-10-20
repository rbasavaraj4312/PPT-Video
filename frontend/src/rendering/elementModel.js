// Consume legacy aliases once so interpolated values cannot be shadowed by them.
export function canonicalElement(element) {
  const { text, fill_color, stroke_color, text_color, font_bold, font_italic, ...rest } = element;
  return { ...rest, content: text ?? rest.content, fill: fill_color ?? rest.fill,
    stroke: stroke_color ?? rest.stroke, font_color: text_color ?? rest.font_color,
    font_weight: font_bold !== undefined ? (font_bold ? 'bold' : 'normal') : rest.font_weight,
    font_style: font_italic !== undefined ? (font_italic ? 'italic' : 'normal') : rest.font_style };
}
