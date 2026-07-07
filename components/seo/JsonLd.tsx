/**
 * Renders a JSON-LD <script>. Content is trusted (built server-side from lib/business),
 * so serialization is safe; we escape `<` to avoid any script-break edge cases.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
