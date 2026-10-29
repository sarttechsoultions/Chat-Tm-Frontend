export function storyReplyReference(body: string) {
  const match = /^Replied to your story \(([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\):\r?\n([\s\S]*)$/i.exec(body);
  return match ? { id: match[1], body: match[2] } : null;
}
