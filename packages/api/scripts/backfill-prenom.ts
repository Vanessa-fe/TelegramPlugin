/**
 * Backfill the Brevo attributes PRENOM and NOM for every verified user.
 *
 * Until the fix that came with this script, the API sent the names as
 * FIRSTNAME / LASTNAME, which don't exist in the Sublynk Brevo account, so
 * Brevo dropped them and emails greeted everyone "Bonjour à vous". New logins
 * now send PRENOM / NOM; this catches up the users who won't log in soon,
 * starting with the inactive creators the re-engagement workflow targets.
 *
 * Dry run by default: lists each user and the names they will get, inside a
 * read-only transaction. Nothing is written. Add --apply to write to Brevo.
 *
 * In production, once the API is deployed (the image ships dist/scripts):
 *   fly ssh console -a sublynk-api -C "node /app/packages/api/dist/scripts/backfill-prenom.js"
 *   fly ssh console -a sublynk-api -C "node /app/packages/api/dist/scripts/backfill-prenom.js --apply"
 */
import { Prisma, PrismaClient } from '@prisma/client';
import { upsertBrevoContact } from '../src/common/brevo-sync';

type NamedUser = {
  email: string;
  firstName: string | null;
  lastName: string | null;
};

// Stay well under Brevo's contacts API rate limit
const BREVO_DELAY_MS = 150;

/** Same users and email as NotificationsService.syncBrevoContact. */
async function loadUsers(tx: Prisma.TransactionClient): Promise<NamedUser[]> {
  const users = await tx.user.findMany({
    where: {
      isActive: true,
      emailVerifiedAt: { not: null },
      OR: [{ firstName: { not: null } }, { lastName: { not: null } }],
    },
    select: { email: true, firstName: true, lastName: true },
    orderBy: { createdAt: 'asc' },
  });

  return users
    .map((user) => ({
      email: user.email.trim().toLowerCase(),
      firstName: user.firstName?.trim() || null,
      lastName: user.lastName?.trim() || null,
    }))
    .filter((user) => user.firstName || user.lastName);
}

function brevoAttributes(user: NamedUser): Record<string, string> {
  return {
    ...(user.firstName ? { PRENOM: user.firstName } : {}),
    ...(user.lastName ? { NOM: user.lastName } : {}),
  };
}

function printUsers(users: NamedUser[]): void {
  console.log('PRENOM | NOM | email');
  for (const user of users) {
    console.log(
      [user.firstName ?? '—', user.lastName ?? '—', user.email].join(' | '),
    );
  }
  const withFirstName = users.filter((user) => user.firstName).length;
  console.log(
    `\n${users.length} utilisateur(s) avec un nom, dont ${withFirstName} avec un prénom.`,
  );
}

async function writeToBrevo(users: NamedUser[]): Promise<number> {
  let failures = 0;
  for (const user of users) {
    try {
      await upsertBrevoContact(user.email, {
        attributes: brevoAttributes(user),
      });
    } catch (error) {
      failures += 1;
      console.error(
        `Échec Brevo pour ${user.email} : ${(error as Error).message}`,
      );
    }
    await new Promise((resolve) => setTimeout(resolve, BREVO_DELAY_MS));
  }
  return failures;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (apply && !process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY manquant : rien n’a été écrit.');
  }

  const prisma = new PrismaClient();
  try {
    const users = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      return loadUsers(tx);
    });

    printUsers(users);

    if (!apply) {
      console.log('\nSimulation : rien n’a été écrit. Relancer avec --apply.');
      return;
    }

    const failures = await writeToBrevo(users);
    console.log(
      `\nBrevo : ${users.length - failures} contact(s) mis à jour, ${failures} échec(s).`,
    );
    if (failures > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Backfill PRENOM / NOM impossible :', error);
  process.exitCode = 1;
});
