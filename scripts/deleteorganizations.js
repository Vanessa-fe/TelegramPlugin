// scripts/delete-organizations.js
//
// Supprime une ou plusieurs organisations ET toutes les lignes qui en
// dépendent, même indirectement (ex: Organization -> PlatformSubscription -> Invoice),
// en respectant les contraintes de clé étrangère au lieu de se battre contre elles.
//
// PRINCIPE : Postgres refuse de supprimer une ligne tant que d'autres lignes
// pointent vers elle (c'est voulu, ça évite les données orphelines). Plutôt que
// de chercher à la main quelles tables bloquent, ce script essaie de supprimer,
// et à chaque erreur de contrainte il en déduit automatiquement la table et la
// colonne responsables (grâce au nom de la contrainte, ex: "AuditLog_organizationId_fkey"),
// nettoie cette table en premier, puis relance — jusqu'à ce que tout passe.
//
// SÉCURITÉ : tout se passe dans UNE SEULE transaction. Par défaut (DRY_RUN=true),
// le script fait vraiment les suppressions pour détecter la chaîne de dépendances,
// affiche ce qui aurait été supprimé table par table, puis ANNULE (ROLLBACK) —
// donc rien n'est perdu tant que tu n'as pas explicitement mis DRY_RUN=false.
//
// Installation (si besoin) : npm install pg
//
// Usage :
//   DATABASE_URL="postgresql://..." node scripts/delete-organizations.js <orgId1> <orgId2> ...
//
// Pour un vrai run destructeur, une fois que le dry-run te convient :
//   DRY_RUN=false DATABASE_URL="postgresql://..." node scripts/delete-organizations.js <orgId1> ...
//
// Note : si tu lances le script sans préciser DATABASE_URL sur la ligne de
// commande, il utilisera la variable d'environnement DATABASE_URL déjà présente
// (par ex. si tu as fait `source .env` ou si tu utilises dotenv dans ton shell).

const { Client } = require('pg')

const DRY_RUN = process.env.DRY_RUN !== 'false' // true par défaut = sécurité
const ORG_IDS = process.argv.slice(2)

if (ORG_IDS.length === 0) {
  console.error('Utilisation : node scripts/delete-organizations.js <orgId1> <orgId2> ...')
  process.exit(1)
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  console.log(DRY_RUN ? '=== MODE DRY RUN (rien ne sera vraiment supprimé) ===' : '=== MODE RÉEL (suppression définitive) ===')
  console.log(`Organisations ciblées : ${ORG_IDS.join(', ')}\n`)

  try {
    await client.query('BEGIN')

    // Pile de suppressions à effectuer. Chaque élément dit :
    // "supprime les lignes de `table` où `column` fait partie de `values`".
    // On part de la table Organization elle-même, filtrée sur son id.
    const stack = [{ table: 'Organization', column: 'id', values: ORG_IDS }]

    while (stack.length > 0) {
      const job = stack[stack.length - 1]

      try {
        // Create savepoint before attempting delete
        await client.query('SAVEPOINT delete_attempt')

        const result = await client.query(
          `DELETE FROM "${job.table}" WHERE "${job.column}"::text = ANY($1::text[])`,
          [job.values]
        )
        console.log(`✓ ${result.rowCount} ligne(s) supprimée(s) dans "${job.table}" (colonne ${job.column})`)
        await client.query('RELEASE SAVEPOINT delete_attempt')
        stack.pop()
      } catch (err) {
        // Rollback to savepoint to recover from failed delete
        await client.query('ROLLBACK TO SAVEPOINT delete_attempt')

        // Code Postgres 23503 = violation de contrainte de clé étrangère
        if (err.code === '23503' && err.table) {
          const blockingTable = err.table
          // Convention de nommage par défaut de Prisma : "<Table>_<colonne>_fkey"
          const match = err.constraint && err.constraint.match(new RegExp(`^${blockingTable}_(.+)_fkey$`))
          const blockingColumn = match ? match[1] : null

          if (!blockingColumn) {
            throw new Error(
              `Impossible de déterminer automatiquement la colonne bloquante pour la contrainte "${err.constraint}" sur la table "${blockingTable}". ` +
              `Regarde le message d'erreur complet et ajoute ce cas à la main dans le script.`
            )
          }

          console.log(`  → bloqué par "${blockingTable}"."${blockingColumn}" : on nettoie ça d'abord`)

          // On récupère les identifiants exacts des lignes qu'on s'apprête à
          // supprimer dans job.table, pour cibler précisément ce qui pointe vers ELLES
          // (utile quand la chaîne descend sur plusieurs niveaux, ex: Organization -> PlatformSubscription -> Invoice)
          const idsResult = await client.query(
            `SELECT id FROM "${job.table}" WHERE "${job.column}"::text = ANY($1::text[])`,
            [job.values]
          )
          const childValues = idsResult.rows.map((r) => r.id)

          stack.push({ table: blockingTable, column: blockingColumn, values: childValues })
        } else {
          throw err
        }
      }
    }

    if (DRY_RUN) {
      await client.query('ROLLBACK')
      console.log('\n[DRY RUN] Rien n\'a été réellement supprimé (rollback volontaire).')
      console.log('Relance avec DRY_RUN=false pour appliquer ces suppressions pour de vrai.')
    } else {
      await client.query('COMMIT')
      console.log('\nTerminé : suppression appliquée définitivement.')
    }
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('\nErreur — rien n\'a été supprimé (rollback) :', err.message)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

main()
