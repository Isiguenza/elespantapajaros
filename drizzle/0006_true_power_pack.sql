CREATE TYPE "public"."reservation_status" AS ENUM('pending', 'confirmed', 'arrived', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."table_shape" AS ENUM('square', 'round');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'platform_delivery';--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_id" uuid NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(50),
	"guest_count" integer DEFAULT 1 NOT NULL,
	"reservation_date" date NOT NULL,
	"reservation_time" time NOT NULL,
	"duration" integer DEFAULT 120 NOT NULL,
	"status" "reservation_status" DEFAULT 'pending' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "is_beverage" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "course" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "platform_price" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "position_x" integer;--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "position_y" integer;--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "shape" "table_shape" DEFAULT 'square';--> statement-breakpoint
ALTER TABLE "tables" ADD COLUMN "rotation" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE cascade ON UPDATE no action;