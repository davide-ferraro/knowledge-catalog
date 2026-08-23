import { wikilinkRegex } from '../lib/wikilinks.mjs';
import { postHref } from '../lib/paths.mjs';

const SKIP = new Set(['link', 'linkReference', 'code', 'inlineCode', 'definition']);

export default function remarkWikilink({ base } = { base: '/' }) {
  return function transform(tree) {
    visit(tree);

    function visit(node) {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (SKIP.has(child.type)) continue;
        if (child.type !== 'text') {
          visit(child);
          continue;
        }
        const replacement = splitText(child.value);
        if (replacement) {
          node.children.splice(i, 1, ...replacement);
          i += replacement.length - 1;
        }
      }
    }

    function splitText(value) {
      if (!value.includes('[[')) return null;
      const re = wikilinkRegex();
      const parts = [];
      let cursor = 0;
      let match;
      while ((match = re.exec(value)) !== null) {
        if (match.index > cursor) {
          parts.push({ type: 'text', value: value.slice(cursor, match.index) });
        }
        const target = match[1].trim();
        const label = (match[2] ?? match[1]).trim();
        parts.push({
          type: 'link',
          url: postHref(target, base),
          children: [{ type: 'text', value: label }],
        });
        cursor = match.index + match[0].length;
      }
      if (parts.length === 0) return null;
      if (cursor < value.length) {
        parts.push({ type: 'text', value: value.slice(cursor) });
      }
      return parts;
    }
  };
}
