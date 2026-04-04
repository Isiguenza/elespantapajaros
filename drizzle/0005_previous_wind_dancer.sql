ALTER TYPE "public"."payment_method" ADD VALUE 'split';--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "seat" varchar(10);--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "delivered_to_table" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "voided" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "voided_by" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "subtotal" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "tip" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "split_bill_data" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "has_variants" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "variants" text;--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "guest_count" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voided_by_user_profiles_id_fk" FOREIGN KEY ("voided_by") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;