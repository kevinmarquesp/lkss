import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const groupsTable = sqliteTable("Groups", {
  id: text({ length: 8 }).unique().notNull(),
  title: text().notNull().default("Link groups"),
  token: text({ length: 12 }).unique().notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`),
});

// NOTE: This public schema objects can be helpful in the select/returning
// statements, to avoid writing so much of this object syntax.

export const publicGroupsSchema = {
  id: groupsTable.id,
  title: groupsTable.title,
  updatedAt: groupsTable.updatedAt,
};

export const linksTable = sqliteTable("Links", {
  id: text({ length: 8 }).unique().notNull(),
  groupId: text({ length: 8 }).references(() => groupsTable.id),
  url: text().notNull(),
  updatedAt: integer({ mode: "timestamp_ms" }).default(sql`CURRENT_TIMESTAMP`),
});

export const insertLinksSchema = createInsertSchema(linksTable, {
  url: z.string().url(),
});

export const publicLinkSchema = {
  id: linksTable.id,
  url: linksTable.url,
  updatedAt: linksTable.updatedAt,
};
