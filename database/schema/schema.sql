

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."auto_create_snapshot"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    op_count INTEGER;
    snapshot_interval INTEGER := 100; -- Create snapshot every 100 operations
BEGIN
    SELECT COUNT(*) INTO op_count
    FROM counter_operations
    WHERE session_id = NEW.session_id
    AND created_at > (
        SELECT COALESCE(MAX(created_at), '1970-01-01'::TIMESTAMPTZ)
        FROM counter_snapshots
        WHERE session_id = NEW.session_id
    );
    
    IF op_count >= snapshot_interval THEN
        INSERT INTO counter_snapshots (session_id, snapshot_value, operation_count, snapshot_type)
        VALUES (NEW.session_id, NEW.value_after, op_count, 'automatic');
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."auto_create_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_counter_history"("p_session_id" "uuid", "p_limit" integer DEFAULT 100, "p_offset" integer DEFAULT 0) RETURNS TABLE("operation_id" "uuid", "operation_type" character varying, "operation_value" integer, "value_before" integer, "value_after" integer, "created_at" timestamp with time zone, "metadata" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        co.id,
        co.operation_type,
        co.operation_value,
        co.value_before,
        co.value_after,
        co.created_at,
        co.metadata
    FROM counter_operations co
    WHERE co.session_id = p_session_id
    ORDER BY co.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."get_counter_history"("p_session_id" "uuid", "p_limit" integer, "p_offset" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."perform_counter_operation"("p_session_id" "uuid", "p_operation_type" character varying, "p_operation_value" integer DEFAULT 1, "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS TABLE("success" boolean, "new_value" integer, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_current_value INTEGER;
    v_new_value INTEGER;
    v_is_active BOOLEAN;
BEGIN
    -- Get current session state
    SELECT current_value, is_active INTO v_current_value, v_is_active
    FROM counter_sessions
    WHERE id = p_session_id;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::INTEGER, 'Session not found'::TEXT;
        RETURN;
    END IF;
    
    IF NOT v_is_active THEN
        RETURN QUERY SELECT false, v_current_value, 'Session is not active'::TEXT;
        RETURN;
    END IF;
    
    -- Calculate new value based on operation
    CASE p_operation_type
        WHEN 'increment' THEN
            v_new_value := v_current_value + p_operation_value;
        WHEN 'decrement' THEN
            v_new_value := v_current_value - p_operation_value;
        WHEN 'reset' THEN
            SELECT initial_value INTO v_new_value FROM counter_sessions WHERE id = p_session_id;
        WHEN 'set' THEN
            v_new_value := p_operation_value;
        WHEN 'multiply' THEN
            v_new_value := v_current_value * p_operation_value;
        WHEN 'divide' THEN
            IF p_operation_value = 0 THEN
                RETURN QUERY SELECT false, v_current_value, 'Cannot divide by zero'::TEXT;
                RETURN;
            END IF;
            v_new_value := v_current_value / p_operation_value;
        ELSE
            RETURN QUERY SELECT false, v_current_value, 'Invalid operation type'::TEXT;
            RETURN;
    END CASE;
    
    -- Insert operation record (triggers will handle the rest)
    INSERT INTO counter_operations (
        session_id, operation_type, operation_value, 
        value_before, value_after, user_id, metadata
    ) VALUES (
        p_session_id, p_operation_type, p_operation_value,
        v_current_value, v_new_value, p_user_id, p_metadata
    );
    
    RETURN QUERY SELECT true, v_new_value, 'Operation successful'::TEXT;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT false, v_current_value, SQLERRM::TEXT;
END;
$$;


ALTER FUNCTION "public"."perform_counter_operation"("p_session_id" "uuid", "p_operation_type" character varying, "p_operation_value" integer, "p_user_id" "uuid", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_counter_current_value"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE counter_sessions
    SET 
        current_value = NEW.value_after,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_counter_current_value"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_counter_boundaries"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    min_val INTEGER;
    max_val INTEGER;
BEGIN
    SELECT min_value, max_value INTO min_val, max_val
    FROM counter_sessions
    WHERE id = NEW.session_id;
    
    IF min_val IS NOT NULL AND NEW.value_after < min_val THEN
        RAISE EXCEPTION 'Counter value % is below minimum boundary %', NEW.value_after, min_val;
    END IF;
    
    IF max_val IS NOT NULL AND NEW.value_after > max_val THEN
        RAISE EXCEPTION 'Counter value % exceeds maximum boundary %', NEW.value_after, max_val;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_counter_boundaries"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."counter_operations" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "operation_type" character varying(50) NOT NULL,
    "operation_value" integer,
    "value_before" integer NOT NULL,
    "value_after" integer NOT NULL,
    "user_id" "uuid",
    "client_ip" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_operation_value" CHECK ((((("operation_type")::"text" = ANY ((ARRAY['increment'::character varying, 'decrement'::character varying, 'set'::character varying, 'multiply'::character varying, 'divide'::character varying])::"text"[])) AND ("operation_value" IS NOT NULL)) OR (("operation_type")::"text" = 'reset'::"text"))),
    CONSTRAINT "counter_operations_operation_type_check" CHECK ((("operation_type")::"text" = ANY ((ARRAY['increment'::character varying, 'decrement'::character varying, 'reset'::character varying, 'set'::character varying, 'multiply'::character varying, 'divide'::character varying])::"text"[])))
);


ALTER TABLE "public"."counter_operations" OWNER TO "postgres";


COMMENT ON TABLE "public"."counter_operations" IS 'Audit log of all operations performed on counters';



COMMENT ON COLUMN "public"."counter_operations"."operation_value" IS 'The value used in the operation (e.g., increment by 5)';



CREATE TABLE IF NOT EXISTS "public"."counter_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_name" character varying(255),
    "description" "text",
    "user_id" "uuid",
    "initial_value" integer DEFAULT 0,
    "current_value" integer DEFAULT 0,
    "min_value" integer,
    "max_value" integer,
    "is_active" boolean DEFAULT true,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_current_value_boundaries" CHECK (((("min_value" IS NULL) OR ("current_value" >= "min_value")) AND (("max_value" IS NULL) OR ("current_value" <= "max_value")))),
    CONSTRAINT "check_value_boundaries" CHECK ((("min_value" IS NULL) OR ("max_value" IS NULL) OR ("min_value" <= "max_value")))
);


ALTER TABLE "public"."counter_sessions" OWNER TO "postgres";


COMMENT ON TABLE "public"."counter_sessions" IS 'Stores counter session information including current value and boundaries';



COMMENT ON COLUMN "public"."counter_sessions"."min_value" IS 'Optional minimum boundary for counter value';



COMMENT ON COLUMN "public"."counter_sessions"."max_value" IS 'Optional maximum boundary for counter value';



CREATE TABLE IF NOT EXISTS "public"."counter_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "snapshot_value" integer NOT NULL,
    "operation_count" integer DEFAULT 0,
    "snapshot_type" character varying(50) DEFAULT 'automatic'::character varying,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "counter_snapshots_snapshot_type_check" CHECK ((("snapshot_type")::"text" = ANY ((ARRAY['automatic'::character varying, 'manual'::character varying, 'daily'::character varying, 'hourly'::character varying])::"text"[])))
);


ALTER TABLE "public"."counter_snapshots" OWNER TO "postgres";


COMMENT ON TABLE "public"."counter_snapshots" IS 'Periodic snapshots of counter values for historical analysis';



COMMENT ON COLUMN "public"."counter_snapshots"."operation_count" IS 'Number of operations since last snapshot';



CREATE OR REPLACE VIEW "public"."counter_statistics" AS
 SELECT "cs"."id" AS "session_id",
    "cs"."session_name",
    "cs"."current_value",
    "cs"."initial_value",
    "cs"."created_at" AS "session_created_at",
    "count"(DISTINCT "co"."id") AS "total_operations",
    "count"(DISTINCT "co"."id") FILTER (WHERE (("co"."operation_type")::"text" = 'increment'::"text")) AS "increment_count",
    "count"(DISTINCT "co"."id") FILTER (WHERE (("co"."operation_type")::"text" = 'decrement'::"text")) AS "decrement_count",
    "count"(DISTINCT "co"."id") FILTER (WHERE (("co"."operation_type")::"text" = 'reset'::"text")) AS "reset_count",
    "max"("co"."created_at") AS "last_operation_at",
    "min"("co"."value_after") AS "min_value_reached",
    "max"("co"."value_after") AS "max_value_reached",
    ("avg"("co"."value_after"))::numeric(10,2) AS "average_value"
   FROM ("public"."counter_sessions" "cs"
     LEFT JOIN "public"."counter_operations" "co" ON (("cs"."id" = "co"."session_id")))
  GROUP BY "cs"."id", "cs"."session_name", "cs"."current_value", "cs"."initial_value", "cs"."created_at";


ALTER VIEW "public"."counter_statistics" OWNER TO "postgres";


COMMENT ON VIEW "public"."counter_statistics" IS 'Aggregated statistics for counter sessions';



CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "stock_quantity" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "products_price_check" CHECK (("price" >= (0)::numeric)),
    CONSTRAINT "products_stock_quantity_check" CHECK (("stock_quantity" >= 0))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


COMMENT ON TABLE "public"."products" IS 'Products catalog table for e-commerce testing';



COMMENT ON COLUMN "public"."products"."id" IS 'Unique identifier for each product';



COMMENT ON COLUMN "public"."products"."name" IS 'Product name (required)';



COMMENT ON COLUMN "public"."products"."description" IS 'Detailed product description';



COMMENT ON COLUMN "public"."products"."price" IS 'Product price in USD (must be >= 0)';



COMMENT ON COLUMN "public"."products"."stock_quantity" IS 'Available inventory count (must be >= 0)';



COMMENT ON COLUMN "public"."products"."created_at" IS 'Timestamp when product was created';



COMMENT ON COLUMN "public"."products"."updated_at" IS 'Timestamp when product was last updated';



CREATE TABLE IF NOT EXISTS "public"."simple_counter" (
    "id" integer NOT NULL,
    "amount" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."simple_counter" OWNER TO "postgres";


ALTER TABLE ONLY "public"."counter_operations"
    ADD CONSTRAINT "counter_operations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counter_sessions"
    ADD CONSTRAINT "counter_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."counter_snapshots"
    ADD CONSTRAINT "counter_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."simple_counter"
    ADD CONSTRAINT "simple_counter_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_counter_operations_created_at" ON "public"."counter_operations" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_counter_operations_session_id" ON "public"."counter_operations" USING "btree" ("session_id");



CREATE INDEX "idx_counter_operations_type" ON "public"."counter_operations" USING "btree" ("operation_type");



CREATE INDEX "idx_counter_operations_user_id" ON "public"."counter_operations" USING "btree" ("user_id");



CREATE INDEX "idx_counter_sessions_created_at" ON "public"."counter_sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_counter_sessions_is_active" ON "public"."counter_sessions" USING "btree" ("is_active");



CREATE INDEX "idx_counter_sessions_user_id" ON "public"."counter_sessions" USING "btree" ("user_id");



CREATE INDEX "idx_counter_snapshots_created_at" ON "public"."counter_snapshots" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_counter_snapshots_session_id" ON "public"."counter_snapshots" USING "btree" ("session_id");



CREATE INDEX "idx_counter_snapshots_type" ON "public"."counter_snapshots" USING "btree" ("snapshot_type");



CREATE INDEX "idx_products_name" ON "public"."products" USING "btree" ("name");



CREATE INDEX "idx_products_price" ON "public"."products" USING "btree" ("price");



CREATE INDEX "idx_products_stock" ON "public"."products" USING "btree" ("stock_quantity");



CREATE OR REPLACE TRIGGER "trigger_auto_snapshot" AFTER INSERT ON "public"."counter_operations" FOR EACH ROW EXECUTE FUNCTION "public"."auto_create_snapshot"();



CREATE OR REPLACE TRIGGER "trigger_update_counter_value" AFTER INSERT ON "public"."counter_operations" FOR EACH ROW EXECUTE FUNCTION "public"."update_counter_current_value"();



CREATE OR REPLACE TRIGGER "trigger_validate_boundaries" BEFORE INSERT ON "public"."counter_operations" FOR EACH ROW EXECUTE FUNCTION "public"."validate_counter_boundaries"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."counter_operations"
    ADD CONSTRAINT "counter_operations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."counter_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."counter_operations"
    ADD CONSTRAINT "counter_operations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."counter_sessions"
    ADD CONSTRAINT "counter_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."counter_snapshots"
    ADD CONSTRAINT "counter_snapshots_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."counter_sessions"("id") ON DELETE CASCADE;



CREATE POLICY "Allow authenticated users to manage products" ON "public"."products" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Allow public read access to products" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Service role has full access to counter_operations" ON "public"."counter_operations" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to counter_sessions" ON "public"."counter_sessions" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Service role has full access to counter_snapshots" ON "public"."counter_snapshots" TO "service_role" USING (true) WITH CHECK (true);



CREATE POLICY "Users can create counter sessions" ON "public"."counter_sessions" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can create operations for own sessions" ON "public"."counter_operations" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."counter_sessions" "cs"
  WHERE (("cs"."id" = "counter_operations"."session_id") AND (("cs"."user_id" = "auth"."uid"()) OR ("cs"."user_id" IS NULL)) AND ("cs"."is_active" = true)))));



CREATE POLICY "Users can delete own counter sessions" ON "public"."counter_sessions" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can update own counter sessions" ON "public"."counter_sessions" FOR UPDATE TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL))) WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view operations for own sessions" ON "public"."counter_operations" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counter_sessions" "cs"
  WHERE (("cs"."id" = "counter_operations"."session_id") AND (("cs"."user_id" = "auth"."uid"()) OR ("cs"."user_id" IS NULL))))));



CREATE POLICY "Users can view own counter sessions" ON "public"."counter_sessions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "Users can view snapshots for own sessions" ON "public"."counter_snapshots" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."counter_sessions" "cs"
  WHERE (("cs"."id" = "counter_snapshots"."session_id") AND (("cs"."user_id" = "auth"."uid"()) OR ("cs"."user_id" IS NULL))))));



CREATE POLICY "allow_all_operations" ON "public"."simple_counter" USING (true) WITH CHECK (true);



ALTER TABLE "public"."counter_operations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counter_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."counter_snapshots" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."simple_counter" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."auto_create_snapshot"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_create_snapshot"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_create_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_counter_history"("p_session_id" "uuid", "p_limit" integer, "p_offset" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_counter_history"("p_session_id" "uuid", "p_limit" integer, "p_offset" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_counter_history"("p_session_id" "uuid", "p_limit" integer, "p_offset" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."perform_counter_operation"("p_session_id" "uuid", "p_operation_type" character varying, "p_operation_value" integer, "p_user_id" "uuid", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."perform_counter_operation"("p_session_id" "uuid", "p_operation_type" character varying, "p_operation_value" integer, "p_user_id" "uuid", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."perform_counter_operation"("p_session_id" "uuid", "p_operation_type" character varying, "p_operation_value" integer, "p_user_id" "uuid", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_counter_current_value"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_counter_current_value"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_counter_current_value"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_counter_boundaries"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_counter_boundaries"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_counter_boundaries"() TO "service_role";


















GRANT ALL ON TABLE "public"."counter_operations" TO "anon";
GRANT ALL ON TABLE "public"."counter_operations" TO "authenticated";
GRANT ALL ON TABLE "public"."counter_operations" TO "service_role";



GRANT ALL ON TABLE "public"."counter_sessions" TO "anon";
GRANT ALL ON TABLE "public"."counter_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."counter_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."counter_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."counter_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."counter_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."counter_statistics" TO "anon";
GRANT ALL ON TABLE "public"."counter_statistics" TO "authenticated";
GRANT ALL ON TABLE "public"."counter_statistics" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."simple_counter" TO "anon";
GRANT ALL ON TABLE "public"."simple_counter" TO "authenticated";
GRANT ALL ON TABLE "public"."simple_counter" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
