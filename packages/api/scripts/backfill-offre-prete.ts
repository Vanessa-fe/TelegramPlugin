/**
 * Re-backfill the Brevo attribute OFFRE_PRETE for every creator, using the
 * rule in src/common/offer-readiness.ts (a buyer can pay right now).
 *
 * Dry run by default: lists each creator, the value they will get and what
 * still blocks a sale, inside a read-only transaction. Nothing is written.
 * Add --apply to write the values to Brevo.
 *
 * In production, once the API is deployed (the image ships dist/scripts):
 *   fly ssh console -a sublynk-api -C "node /app/packages/api/dist/scripts/backfill-offre-prete.js"
 *   fly ssh console -a sublynk-api -C "node /app/packages/api/dist/scripts/backfill-offre-prete.js --apply"
 */
import { Prisma, PrismaClient, ProductStatus } from '@prisma/client';
import { upsertBrevoContact } from '../src/common/brevo-sync';
import { readyOffersWhere } from '../src/common/offer-readiness';

type CreatorReadiness = {
  name: string;
  email: string;
  ready: boolean;
  previousRule: boolean;
  blockers: string[];
};

// Stay well under Brevo's contacts API rate limit
const BREVO_DELAY_MS = 150;

async function loadCreators(
  tx: Prisma.TransactionClient,
): Promise<CreatorReadiness[]> {
  const organizations = await tx.organization.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      name: true,
      billingEmail: true,
      saasActive: true,
      stripeAccountId: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  const creators: CreatorReadiness[] = [];
  for (const org of organizations) {
    if (!org.billingEmail) {
      continue;
    }

    const activeOffer = {
      organizationId: org.id,
      status: ProductStatus.ACTIVE,
    };
    const withPlan = { plans: { some: { isActive: true } } };
    const withChannel = { channels: { some: { channel: { isActive: true } } } };
    const [offers, offersWithPlan, offersWithChannel, offersWithBoth, ready] =
      await Promise.all([
        tx.product.count({ where: activeOffer }),
        tx.product.count({ where: { ...activeOffer, ...withPlan } }),
        tx.product.count({ where: { ...activeOffer, ...withChannel } }),
        tx.product.count({
          where: { ...activeOffer, ...withPlan, ...withChannel },
        }),
        tx.product.count({ where: readyOffersWhere(org.id) }),
      ]);

    const blockers: string[] = [];
    if (!org.saasActive) blockers.push('abonnement Sublynk inactif');
    if (!org.stripeAccountId) blockers.push('Stripe non connecté');
    if (offers === 0) {
      blockers.push('aucune offre active');
    } else {
      if (offersWithPlan === 0) blockers.push('aucune formule active');
      if (offersWithChannel === 0) blockers.push('aucun canal actif coché');
      if (offersWithPlan > 0 && offersWithChannel > 0 && offersWithBoth === 0) {
        blockers.push('formule et canal sur des offres différentes');
      }
    }

    creators.push({
      name: org.name,
      email: org.billingEmail,
      ready: ready > 0,
      // Rule of commit ccf2714b: active offer linked to an active channel
      previousRule: offersWithChannel > 0,
      blockers,
    });
  }
  return creators;
}

function printCreators(creators: CreatorReadiness[]): void {
  const yesNo = (value: boolean) => (value ? 'Oui' : 'Non');
  console.log(
    'OFFRE_PRETE | ancienne règle | créateur | email | ce qui bloque',
  );
  for (const c of creators) {
    const changed = c.ready !== c.previousRule ? ' (change)' : '';
    console.log(
      [
        `${yesNo(c.ready)}${changed}`,
        yesNo(c.previousRule),
        c.name,
        c.email,
        c.blockers.join(', ') || '—',
      ].join(' | '),
    );
  }

  const ready = creators.filter((c) => c.ready).length;
  const changed = creators.filter((c) => c.ready !== c.previousRule).length;
  console.log(
    `\n${creators.length} créateurs : ${ready} Oui, ${creators.length - ready} Non, ` +
      `${changed} différent(s) de l'ancienne règle.`,
  );
}

async function writeToBrevo(creators: CreatorReadiness[]): Promise<number> {
  let failures = 0;
  for (const c of creators) {
    try {
      await upsertBrevoContact(c.email, {
        attributes: { OFFRE_PRETE: c.ready },
      });
    } catch (error) {
      failures += 1;
      console.error(
        `Échec Brevo pour ${c.email} : ${(error as Error).message}`,
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
    const creators = await prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SET TRANSACTION READ ONLY`;
        return loadCreators(tx);
      },
      { timeout: 120_000 },
    );

    printCreators(creators);

    if (!apply) {
      console.log('\nSimulation : rien n’a été écrit. Relancer avec --apply.');
      return;
    }

    const failures = await writeToBrevo(creators);
    console.log(
      `\nBrevo : ${creators.length - failures} contact(s) mis à jour, ${failures} échec(s).`,
    );
    if (failures > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Backfill OFFRE_PRETE impossible :', error);
  process.exitCode = 1;
});
