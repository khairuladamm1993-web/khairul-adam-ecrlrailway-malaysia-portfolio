-- REVIEW ONLY: Do NOT run against live Supabase MR Platform without separate approval.
-- MR-S10 hard cap: at most 100 enabled 'member' profiles.
-- Owner/Admin are excluded from the Member count.
-- Blocks races under simultaneous signups and admin re-enable actions.
-- Existing owner mapping and member-progress tables remain untouched.
BEGIN;
CREATE OR REPLACE FUNCTION app_private.guard_member_capacity_100()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO ''
AS $$
DECLARE occupied bigint;
BEGIN
  IF NEW.role = 'member' AND NEW.enabled THEN
    PERFORM pg_catalog.pg_advisory_xact_lock(730087, 100);
    SELECT count(*) INTO occupied
      FROM public.member_profiles
      WHERE role = 'member' AND enabled
        AND user_id IS DISTINCT FROM NEW.user_id;
    IF occupied >= 100 THEN
      IF TG_OP = 'INSERT' THEN
        NEW.enabled := false;
      ELSE
        RAISE EXCEPTION 'MR-S10 membership capacity reached'
          USING ERRCODE = '23514';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION app_private.guard_member_capacity_100()
FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS member_capacity_100 ON public.member_profiles;
CREATE TRIGGER member_capacity_100
BEFORE INSERT OR UPDATE OF role, enabled ON public.member_profiles
FOR EACH ROW EXECUTE FUNCTION app_private.guard_member_capacity_100();
COMMIT;

-- Only execute on separately provisioned test database before deployment review.
-- Acceptance: (1) 99 -> 100 enabled Member PASS;
-- (2) 100 -> 101 leaves fresh profiles disabled, Admin enable returns an error;
-- (3) concurrent 99 + 2 never yields 101 enabled Member;
-- (4) Admin/Owner excluded, (5) no changes to existing session / progress records.
