import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpStatus, BadRequestException, NotFoundException } from '@nestjs/common';
import { EntryInputPrisma } from './entryinput.prisma';
import { EntryInput, QtyEmbDay } from '@core/index';

@Controller('entradas')
export class EntryInputController {
  constructor(private readonly repo: EntryInputPrisma) { } 

  // Obter somas
  @Get('totaldia/:embalagemId/:itemTamanhoId')
  async obterEntryInputsTotal(
    @Param('embalagemId') embalagemId: string,
    @Param('itemTamanhoId') itemTamanhoId: string,
  ): Promise<QtyEmbDay> {
    const entryInputTotal = await this.repo.buscarEntradasDoDiaPorEmbalagemEItem(
      +embalagemId,
      +itemTamanhoId,
    );
  
    if (!entryInputTotal) {
      throw new NotFoundException(`Entradas não encontradas.`);
    }  
    return entryInputTotal;
  }  

  // Obter uma EntryInput específica pelo ID
  @Get(':id')
  async obterEntryInput(@Param('id') id: string): Promise<EntryInput> {
    const entryInput = await this.repo.obterPorId(+id);
    if (!entryInput) {
      throw new NotFoundException(`Entrada com ID ${id} não encontrada.`);
    }
    return entryInput;
  }

   // Obter todas as EntryInputs
   @Get()
   async obterEntryInputs(): Promise<EntryInput[]> {
     return this.repo.obter();
   }

}
