import {
  pgTable,
  text,
  timestamp,
  integer,
  primaryKey,
  uuid,
  jsonb,
  varchar,
  index,
  real,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ─── Auth tables (NextAuth standard) ─────────────────────────────

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  passwordHash: text("password_hash"),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── Application tables ──────────────────────────────────────────

export const userActions = pgTable(
  "user_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    actionType: varchar("action_type", { length: 100 }).notNull(),
    actionData: jsonb("action_data").$type<Record<string, unknown>>(),
    pagePath: text("page_path"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("user_actions_user_id_idx").on(table.userId),
    index("user_actions_action_type_idx").on(table.actionType),
    index("user_actions_created_at_idx").on(table.createdAt),
  ]
);

// ─── Document Analysis tables ───────────────────────────────────

export const documentAnalyses = pgTable(
  "document_analyses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address"),
    lat: real("lat"),
    lng: real("lng"),
    radiusKm: real("radius_km"),
    status: varchar("status", { length: 50 }).notNull().default("pending"),
    currentStep: varchar("current_step", { length: 50 }),
    documentCount: integer("document_count").notNull().default(0),
    classificationResult: jsonb("classification_result"),
    entityResult: jsonb("entity_result"),
    riskExtractionResult: jsonb("risk_extraction_result"),
    contradictionResult: jsonb("contradiction_result"),
    dataMeshResult: jsonb("data_mesh_result"),
    masterRiskRegister: jsonb("master_risk_register"),
    handoffPackage: jsonb("handoff_package"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }),
  },
  (table) => [
    index("doc_analyses_user_id_idx").on(table.userId),
    index("doc_analyses_status_idx").on(table.status),
  ]
);

// ─── Reports table ──────────────────────────────────────────────

export const reports = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    address: text("address").notNull(),
    lat: real("lat").notNull(),
    lng: real("lng").notNull(),
    radiusKm: real("radius_km").notNull(),
    reportData: jsonb("report_data").notNull(),
    analysisId: uuid("analysis_id").references(() => documentAnalyses.id),
    shareToken: varchar("share_token", { length: 64 }).unique(),
    sharePasswordHash: text("share_password_hash"),
    sharedAt: timestamp("shared_at", { mode: "date" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [
    index("reports_user_id_idx").on(table.userId),
    index("reports_share_token_idx").on(table.shareToken),
    index("reports_created_at_idx").on(table.createdAt),
  ]
);

export const analysisDocuments = pgTable(
  "analysis_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => documentAnalyses.id, { onDelete: "cascade" }),
    fileName: text("file_name").notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(),
    fileSizeBytes: integer("file_size_bytes").notNull(),
    classification: varchar("classification", { length: 100 }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => [index("analysis_docs_analysis_id_idx").on(table.analysisId)]
);
