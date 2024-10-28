import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProjetoModule } from './projeto/projeto.module';
import { EscolaModule } from './escola/escola.module';
import { TamanhoModule } from './tamanho/tamanho.module';
import { ItemModule } from './item/item.module';
import { BarcodeModule } from './barCode/barCode.module';
import { ItemTamanhoModule } from './itemTamanho/itemTamanho.module';
import { UsuarioModule } from './usuario/usuario.module';
import { EstoqueModule } from './estoque/estoque.module';
import { GradeModule } from './grade/grade.module';
import { GradeItemModule } from './gradeItem/gradeItem.module';
import { CaixaModule } from './caixa/caixa.module';

@Module({
  imports: [
    ProjetoModule,
    EscolaModule,
    TamanhoModule,
    ItemModule,
    BarcodeModule,
    ItemTamanhoModule,
    UsuarioModule,
    EstoqueModule,
    GradeModule,
    GradeItemModule,
    CaixaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})

export class AppModule {}
