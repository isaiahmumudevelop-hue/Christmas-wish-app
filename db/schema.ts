import {
  pgTable, uuid, text, boolean, timestamp, date, numeric,
  char, smallint, jsonb, bigserial, pgEnum, index, unique, primaryKey, integer,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

// ============ ENUMS ============
export const userRole = pgEnum("user_role", ["wisher", "sponsor", "admin", "reviewer"]);
export const kycStatus = pgEnum("kyc_status", ["none", "pending", "verified", "rejected"]);
export const userStatus = pgEnum("user_status", ["active", "suspended", "banned"]);
export const consentStatus = pgEnum("consent_status", ["pending", "granted", "revoked", "expired"]);
export const wishStatus = pgEnum("wish_status", [
  "draft", "submitted", "under_review", "info_requested", "verified",
  "rejected", "sponsored", "ordered", "shipped", "delivered", "cancelled", "failed",
]);
export const paymentStatus = pgEnum("payment_status", ["pending", "paid", "refunded", "failed"]);
export const orderStatus = pgEnum("order_status", [
  "created", "purchased", "dispatched", "in_transit", "delivered", "failed", "returned",
]);
export const sponsorVerification = pgEnum("sponsor_verification", ["pending", "verified", "rejected"]);

// ============ USERS ============
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique(),
  phone: text("phone").unique(),
  passwordHash: text("password_hash"),
  name: text("name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  role: text("role").notNull().default("wisher"),
  isMinor: boolean("is_minor").notNull().default(false),
  kycStatus: text("kyc_status").default("none"),
  status: text("status").default("active"),
  image: text("image"),
  invitationCode: text("invitation_code").unique(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ============ AUTH.JS TABLES ============
export const accounts = pgTable("accounts", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").$type<AdapterAccount["type"]>().notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("provider_account_id").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires", { mode: "date" }).notNull(),
}, (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]);

// ============ GUARDIANS ============
export const guardians = pgTable("guardians", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  minorUserId: uuid("minor_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  guardianName: text("guardian_name").notNull(),
  guardianEmail: text("guardian_email"),
  guardianPhone: text("guardian_phone").notNull(),
  relationship: text("relationship").notNull(),
  idDocumentUrl: text("id_document_url"),
  consentStatus: text("consent_status").default("pending"),
  consentMethod: text("consent_method"),
  consentToken: text("consent_token").unique(),
  grantedAt: timestamp("granted_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ CONSENT AUDIT ============
export const consentAudit = pgTable("consent_audit", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  guardianId: uuid("guardian_id").references(() => guardians.id),
  minorUserId: uuid("minor_user_id").references(() => users.id),
  action: text("action").notNull(),
  evidenceUrl: text("evidence_url"),
  performedBy: uuid("performed_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ WISHES ============
export const wishes = pgTable("wishes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wisherId: uuid("wisher_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).default("NGN"),
  reason: text("reason"),
  mediaUrls: jsonb("media_urls").default(sql`'[]'::jsonb`),
  status: text("status").notNull().default("draft"),
  deliveryAddressId: uuid("delivery_address_id"),
  riskScore: smallint("risk_score").default(0),
  fraudFlags: jsonb("fraud_flags").default(sql`'[]'::jsonb`),
  reviewerId: uuid("reviewer_id").references(() => users.id),
  reviewNotes: text("review_notes"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  statusIdx: index("idx_wishes_status").on(t.status),
  wisherIdx: index("idx_wishes_wisher").on(t.wisherId),
}));

// ============ ADDRESSES ============
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wisherId: uuid("wisher_id").notNull().references(() => users.id),
  encryptedPayload: text("encrypted_payload").notNull(),
  countryCode: char("country_code", { length: 2 }).notNull(),
  stateRegion: text("state_region"),
  city: text("city"),
  geocodeLat: numeric("geocode_lat", { precision: 9, scale: 6 }),
  geocodeLng: numeric("geocode_lng", { precision: 9, scale: 6 }),
  validated: boolean("validated").default(false),
  validationRef: text("validation_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ SPONSORS ============
export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull(),
  rcNumber: text("rc_number"),
  reason: text("reason"),
  logoUrl: text("logo_url"),
  verificationStatus: text("verification_status").default("pending"),
  contractUrl: text("contract_url"),
  monthlyBudget: numeric("monthly_budget", { precision: 14, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ SPONSORSHIPS ============
export const sponsorships = pgTable("sponsorships", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wishId: uuid("wish_id").notNull().references(() => wishes.id),
  sponsorId: uuid("sponsor_id").notNull().references(() => sponsors.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: char("currency", { length: 3 }).notNull(),
  paymentStatus: text("payment_status").default("pending"),
  paymentRef: text("payment_ref"),
  gateway: text("gateway").default("flutterwave"),
  pledgedAt: timestamp("pledged_at", { withTimezone: true }).defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
}, (t) => ({
  wishUnique: unique("sponsorships_wish_id_unique").on(t.wishId),
}));

// ============ ORDERS ============
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  wishId: uuid("wish_id").notNull().references(() => wishes.id),
  sponsorshipId: uuid("sponsorship_id").references(() => sponsorships.id),
  vendor: text("vendor"),
  vendorOrderRef: text("vendor_order_ref"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }),
  status: text("status").default("created"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ SHIPMENTS ============
export const shipments = pgTable("shipments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: uuid("order_id").notNull().references(() => orders.id),
  carrier: text("carrier").notNull(),
  trackingId: text("tracking_id").notNull().unique(),
  trackingUrl: text("tracking_url"),
  externalRef: text("external_ref"),
  status: text("status").notNull().default("label_created"),
  estimatedDelivery: date("estimated_delivery"),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  proofOfDeliveryUrl: text("proof_of_delivery_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============ TRACKING EVENTS ============
export const trackingEvents = pgTable("tracking_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  shipmentId: uuid("shipment_id").notNull().references(() => shipments.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  locationText: text("location_text"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  rawPayload: jsonb("raw_payload"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  shipmentIdx: index("idx_tracking_shipment").on(t.shipmentId, t.occurredAt),
}));

// ============ AUDIT LOG ============
export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorId: uuid("actor_id").references(() => users.id),
  actorRole: text("actor_role"),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  entityIdx: index("idx_audit_entity").on(t.entityType, t.entityId),
}));
