-- Offers could never be linked to a channel from the app, so paid buyers
-- never got access. Link each offer that has no channel to its
-- organization's channel when the organization has exactly one active channel.
INSERT INTO "ProductChannel" ("id", "productId", "channelId", "createdAt")
SELECT gen_random_uuid()::text, p."id", c."id", CURRENT_TIMESTAMP
FROM "Product" p
JOIN "Channel" c
  ON c."organizationId" = p."organizationId" AND c."isActive" = true
WHERE NOT EXISTS (
    SELECT 1 FROM "ProductChannel" pc WHERE pc."productId" = p."id"
  )
  AND (
    SELECT count(*) FROM "Channel" c2
    WHERE c2."organizationId" = p."organizationId" AND c2."isActive" = true
  ) = 1
ON CONFLICT ("productId", "channelId") DO NOTHING;
