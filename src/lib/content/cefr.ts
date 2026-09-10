/**
 * The CEFR levels the whole product classifies German content by.
 *
 * This lives here, away from `src/lib/payload/fields/`, because that module
 * imports Payload at runtime and so cannot be reached from a client component.
 * Onboarding needs the same list in the browser that the collections use on the
 * server, and one shared list is the only way those two stay in step.
 */
export const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
export type CefrLevel = (typeof cefrLevels)[number]
