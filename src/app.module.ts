import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetoModule } from './projeto/projeto.module';
import { EscolaModule } from './escola/escola.module';
import { TamanhoModule } from './tamanho/tamanho.module';
import { ItemModule } from './item/item.module';
import { BarcodeModule } from './barCode/barCode.module';
import { ItemTamanhoModule } from './itemTamanho/itemTamanho.module';

@Module({
  imports: [
    ProjetoModule,
    EscolaModule,
    TamanhoModule,
    ItemModule,
    BarcodeModule,
    ItemTamanhoModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
