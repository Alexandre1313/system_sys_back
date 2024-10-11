import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetoModule } from './projeto/projeto.module';
import { EscolaModule } from './escola/escola.module';

@Module({
  imports: [
    ProjetoModule,
    EscolaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
