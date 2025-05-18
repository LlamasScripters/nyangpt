import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cors from 'cors';
import { Request, Response } from 'express';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    // config cors permissive
    const corsOptions = {
      origin: true, // Autorise toutes les origines
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
      allowedHeaders: 'Content-Type, Accept, Authorization',
    };

    app.use(cors(corsOptions));

    app.use((err: Error, _req: Request, res: Response) => {
      console.error('Erreur globale:', err);
      res.status(500).json({
        statusCode: 500,
        message: 'Erreur interne du serveur',
        error: err.message || 'Erreur inconnue',
      });
    });

    await app.listen(process.env.PORT || 3000);
    console.log(`Application démarrée sur le port ${process.env.PORT || 3000}`);
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(
      "Erreur critique lors du démarrage de l'application:",
      errorMessage,
    );
    process.exit(1);
  }
}

process.on('uncaughtException', (error: Error) => {
  console.error('Erreur non gérée:', error);
});

process.on('unhandledRejection', (reason: unknown) => {
  const reasonMessage =
    reason instanceof Error ? reason.message : String(reason);
  console.error('Promesse rejetée non gérée:', reasonMessage);
});

bootstrap();
