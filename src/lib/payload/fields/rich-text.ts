import {
  BoldFeature,
  HeadingFeature,
  InlineCodeFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import type { RichTextAdapterProvider } from 'payload'

/**
 * Structural shape of a stored Lexical value.
 *
 * Declared here rather than imported from `payload-types` so the helper stays
 * usable while types are being regenerated, and so seed data and tests can build
 * values without depending on any one collection.
 */
export interface RichTextNode {
  type: string
  version: number
  [key: string]: unknown
}

/**
 * Mirrors the shape Payload generates for a `richText` field, so values built
 * here are assignable straight into collection data without casting.
 */
export interface RichTextValue {
  root: {
    children: RichTextNode[]
    direction: 'ltr' | 'rtl' | null
    format: 'left' | 'start' | 'center' | 'right' | 'end' | 'justify' | ''
    indent: number
    type: string
    version: number
  }
  [key: string]: unknown
}

/**
 * Learner explanations need structure (short headings, ordered rules, emphasis
 * on German endings) but never uploads, blocks, or relationships. Restricting
 * the feature set keeps the public render surface small and predictable.
 */
export function createLearnerRichTextEditor(): RichTextAdapterProvider {
  return lexicalEditor({
    features: () => [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ['h3', 'h4'] }),
      UnorderedListFeature(),
      OrderedListFeature(),
      BoldFeature(),
      ItalicFeature(),
      InlineCodeFeature(),
      LinkFeature({ enabledCollections: ['words', 'grammar-topics'] }),
    ],
  })
}

function textNode(text: string): RichTextNode {
  return {
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  }
}

function paragraphNode(text: string): RichTextNode {
  return {
    children: [textNode(text)],
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    type: 'paragraph',
    version: 1,
  }
}

/**
 * Builds a minimal valid editor state from plain paragraphs. Used by seed data
 * and tests so deterministic fixtures do not need hand-written Lexical JSON.
 */
export function richTextParagraphs(...paragraphs: string[]): RichTextValue {
  return {
    root: {
      children: paragraphs.map(paragraphNode),
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

function collectText(nodes: unknown, into: string[]): void {
  if (!Array.isArray(nodes)) return

  for (const node of nodes) {
    if (node === null || typeof node !== 'object') continue

    const { children, text } = node as { children?: unknown; text?: unknown }

    if (typeof text === 'string' && text.length > 0) into.push(text)

    collectText(children, into)
  }
}

/**
 * Flattens an editor state to searchable, indexable plain text.
 *
 * Written by hand rather than delegating to `convertLexicalToPlaintext` so
 * search normalization and metadata descriptions stay deterministic and are not
 * coupled to converter changes between Payload releases.
 */
export function richTextToPlainText(value: unknown): string {
  const root = (value as { root?: { children?: unknown } } | null | undefined)
    ?.root
  const parts: string[] = []
  collectText(root?.children, parts)

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

export function isRichTextEmpty(value: unknown): boolean {
  return richTextToPlainText(value).length === 0
}
