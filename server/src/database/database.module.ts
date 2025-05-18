import { Module, Global, Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

const logger = new Logger('DatabaseModule');

let pool: Pool;
try {
  const connectionString = process.env.DATABASE_URL;
  logger.log(
    `Tentative de connexion à la base de données: ${connectionString}`,
  );

  pool = new Pool({
    connectionString,
    max: 20, // limiter le nombre de connexions
    idleTimeoutMillis: 30000, // fermer les connexions inactives après 30s
    connectionTimeoutMillis: 5000, // timeout après 5s si pas de connexion
  });

  pool.on('error', (err) => {
    logger.error('Erreur inattendue du pool PostgreSQL', err);
  });

  logger.log('Connexion à la base de données réussie');
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
  logger.error(
    `Erreur lors de la création du pool PostgreSQL: ${errorMsg}`,
    errorStack,
  );
  pool = {
    query: () => {
      throw new Error('Base de données non disponible');
    },
  } as unknown as Pool;
}

const db = drizzle(pool, { schema });

@Global()
@Module({
  providers: [
    {
      provide: 'DB_DEV',
      useValue: db,
    },
  ],
  exports: ['DB_DEV'],
})
export class DatabaseModule {}
