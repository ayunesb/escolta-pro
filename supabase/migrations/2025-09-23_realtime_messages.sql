-- Add messages table to supabase_realtime publication if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_catalog.pg_namespace n JOIN pg_catalog.pg_class c ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relname = 'messages') THEN
    -- safe: only add if publication exists
    PERFORM 1 FROM pg_catalog.pg_publication WHERE pubname = 'supabase_realtime';
    IF FOUND THEN
      BEGIN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
      EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
  END IF;
END$$;
