-- Make the tenant key immutable for every table that carries a schoolId.
-- Application APIs must never move a row between schools. A reassignment is
-- only possible through an explicit, audited administrative procedure that
-- disables this trigger for the target table inside a transaction.

CREATE OR REPLACE FUNCTION "public"."prevent_tenant_reassignment"()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW."schoolId" IS DISTINCT FROM OLD."schoolId" THEN
    RAISE EXCEPTION 'schoolId is immutable on table %', TG_TABLE_NAME
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$function$;

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema
     AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'schoolId'
      AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE OF "schoolId" ON %I ' ||
      'FOR EACH ROW EXECUTE FUNCTION "public"."prevent_tenant_reassignment"()',
      t.table_name || '_school_id_immutable',
      t.table_name
    );
  END LOOP;
END
$$;
