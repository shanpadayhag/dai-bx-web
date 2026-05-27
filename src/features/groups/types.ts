/**
 * Group entity — ported 1:1 from client-web-old/.../groups/data-access/groups.types.ts.
 * IDB row shape is identical to the in-memory shape (no tree relationship).
 */

export interface Group {
  id: string;
  name: string;
  order: number;
  isOpen: boolean;
  isHidden: boolean;
}

export type GroupRow = Group
