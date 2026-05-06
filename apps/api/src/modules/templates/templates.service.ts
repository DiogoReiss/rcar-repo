import { Injectable, NotFoundException } from '@nestjs/common';
import Handlebars from 'handlebars';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { PartialType } from '@nestjs/swagger';

class UpdateTemplateDto extends PartialType(CreateTemplateDto) {}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.template.findMany({ where: { ativo: true }, orderBy: { nome: 'asc' } });
  }

  async findOne(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) throw new NotFoundException('Template não encontrado');
    return t;
  }

  create(dto: CreateTemplateDto) {
    return this.prisma.template.create({ data: dto });
  }

  async update(id: string, dto: UpdateTemplateDto) {
    await this.findOne(id);
    return this.prisma.template.update({ where: { id }, data: dto });
  }

  async preview(id: string, variables: Record<string, unknown>) {
    const template = await this.findOne(id);
    const compiled = Handlebars.compile(template.conteudoHtml);
    return { html: compiled(variables) };
  }
}

