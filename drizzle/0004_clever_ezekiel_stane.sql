DO $$ BEGIN
 CREATE TYPE "public"."table_status" AS ENUM('available', 'occupied', 'reserved');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(50) NOT NULL,
	"name" varchar(255),
	"capacity" integer DEFAULT 4 NOT NULL,
	"status" "table_status" DEFAULT 'available' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tables_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "table_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;