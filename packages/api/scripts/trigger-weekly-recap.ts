import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SchedulerService } from '../src/modules/scheduler/scheduler.service';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'warn', 'error'],
  });

  try {
    const scheduler = app.get(SchedulerService);
    await scheduler.sendWeeklyRecap();
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Failed to trigger weekly recap:', error);
  process.exitCode = 1;
});
