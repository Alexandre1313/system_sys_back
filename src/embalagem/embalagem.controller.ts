import { Body, Controller, Get, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { EmbalagemPrisma } from './embalagem.prisma';
import { Embalagem } from '@core/index';

@Controller('embalagem')
export class EmbalagemController {
    constructor(private readonly repo: EmbalagemPrisma) { }

    // Obter todas as embalagens    
    @Get()
    async obterEnbalagens(): Promise<Embalagem[]> {
        try {
            return await this.repo.obter();
        } catch (error) {
            throw new BadRequestException('Erro ao obter os dados da embalagem: ' + error.message);
        }        
    }

    // Salvar ou criar uma embalagem
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async salvarEmbalagem(@Body() embalagem: Omit<Embalagem, 'createdAt' | 'updatedAt'>): Promise<Embalagem> {
        try {
            return await this.repo.salvar(embalagem);
        } catch (error) {
            throw new BadRequestException('Erro ao salvar os dados da embalagem: ' + error.message);
        }
    }
}
