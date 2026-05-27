/**
 * Random id generator. Ported from client-web-old/.../shared/utils/uid.ts.
 * Uses the browser's `crypto.randomUUID()` — available in all evergreen browsers
 * and in Node 19+, which covers jsdom in the test environment.
 */

export const uid = (): string => crypto.randomUUID()
