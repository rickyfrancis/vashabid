/**
 * Stand-in for the `server-only` marker package.
 *
 * `server-only` is not a real dependency: Next's bundler recognises the
 * specifier and fails the build if a client component reaches a module that
 * imports it. Vitest has no such notion and loads the whole graph, so a
 * component test that renders the app shell would otherwise fail to resolve it.
 *
 * Aliasing it to an empty module reproduces the bundler's runtime behaviour —
 * the import has no effect — while leaving the real guarantee in place, since
 * `pnpm build` still enforces the boundary.
 */
export {}
