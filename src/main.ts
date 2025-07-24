import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true, logger: ['error', 'warn'], });
  await app.listen(4997, '192.168.1.169', () => console.log('\x1b[32m%s\x1b[0m', '✅ Server running on IP 192.168.1.169 and listening on port 4997'));
}

bootstrap();
