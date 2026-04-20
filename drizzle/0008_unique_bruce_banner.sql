ALTER TYPE "public"."discount_type" ADD VALUE 'flexible';--> statement-breakpoint
CREATE TABLE "sales_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"order_number" integer NOT NULL,
	"cash_register_id" uuid NOT NULL,
	"table_id" uuid,
	"table_number" integer,
	"customer_name" varchar(255),
	"payment_method" "payment_method" NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tip" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"discount" numeric(10, 2) DEFAULT '0',
	"discount_name" varchar(255),
	"items_json" text NOT NULL,
	"user_id" uuid,
	"loyalty_card_id" uuid,
	"split_bill_data" text,
	"created_at" timestamp NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_cash_register_id_cash_registers_id_fk" FOREIGN KEY ("cash_register_id") REFERENCES "public"."cash_registers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_history" ADD CONSTRAINT "sales_history_loyalty_card_id_loyalty_cards_id_fk" FOREIGN KEY ("loyalty_card_id") REFERENCES "public"."loyalty_cards"("id") ON DELETE no action ON UPDATE no action;