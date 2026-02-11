-- Drop unique index to allow duplicate page slugs across organizations
DROP INDEX IF EXISTS "Organization_pageSlug_key";
