import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        nome: dto.nome,
        descricao: dto.descricao,
        unidade: dto.unidade,
        quantidadeAtual: dto.quantidadeAtual,
        estoqueMinimo: dto.estoqueMinimo,
        custoUnitario: dto.custoUnitario,
      },
    });
  }

  async findAllProducts(includeInactive = false) {
    return this.prisma.product.findMany({
      where: includeInactive ? {} : { ativo: true, deletedAt: null },
      orderBy: { nome: 'asc' },
    });
  }

  async findProductById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        movements: { orderBy: { createdAt: 'desc' }, take: 20 },
        services: { include: { service: true } },
      },
    });
    if (!product) throw new NotFoundException('Produto não encontrado');
    return product;
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    await this.findProductById(id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async deleteProduct(id: string) {
    await this.findProductById(id);
    return this.prisma.product.update({
      where: { id },
      data: { ativo: false, deletedAt: new Date() },
    });
  }

  async findLowStock() {
    return this.prisma.$queryRaw<Array<{ id: string; nome: string; unidade: string; quantidade_atual: number; estoque_minimo: number }>>(
      Prisma.sql`SELECT id, nome, unidade, quantidade_atual, estoque_minimo FROM products WHERE ativo = true AND deleted_at IS NULL AND quantidade_atual <= estoque_minimo ORDER BY nome`,
    );
  }

  async createMovement(dto: CreateStockMovementDto, userId?: string) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    let novaQuantidade: Prisma.Decimal;
    const currentQty = product.quantidadeAtual;
    const movQty = new Prisma.Decimal(dto.quantidade);

    switch (dto.tipo) {
      case 'ENTRADA':
        novaQuantidade = currentQty.add(movQty);
        break;
      case 'SAIDA':
        novaQuantidade = currentQty.sub(movQty);
        if (novaQuantidade.lessThan(0)) {
          throw new BadRequestException('Estoque insuficiente para esta saída');
        }
        break;
      case 'AJUSTE':
        novaQuantidade = movQty;
        break;
      default:
        throw new BadRequestException('Tipo de movimentação inválido');
    }

    const [movement] = await this.prisma.$transaction([
      this.prisma.stockMovement.create({
        data: {
          productId: dto.productId,
          tipo: dto.tipo,
          quantidade: dto.quantidade,
          motivo: dto.motivo,
          userId,
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: { quantidadeAtual: novaQuantidade },
      }),
    ]);

    return movement;
  }

  async findMovements(productId?: string) {
    return this.prisma.stockMovement.findMany({
      where: productId ? { productId } : {},
      include: { product: { select: { nome: true, unidade: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}

