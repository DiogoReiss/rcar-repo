import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto.js';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

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

  async findAllProducts(includeInactive = false, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const where = includeInactive ? {} : { ativo: true, deletedAt: null };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, orderBy: { nome: 'asc' }, skip: (safePage - 1) * perPage, take: perPage }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total, page: safePage, perPage, totalPages: Math.ceil(total / perPage) };
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

  async createMovement(dto: CreateStockMovementDto, userId?: string, idempotencyKey?: string) {
    // D9: Idempotency — skip duplicate if same key already processed
    if (idempotencyKey) {
      const existing = await this.prisma.stockMovement.findFirst({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        where: { idempotencyKey } as any,
      });
      if (existing) return existing;
    }

    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException('Produto não encontrado');

    let novaQuantidade: Prisma.Decimal;
    let novoCustoUnitario = product.custoUnitario;
    const currentQty = product.quantidadeAtual;
    const movQty = new Prisma.Decimal(dto.quantidade);

    switch (dto.tipo) {
      case 'ENTRADA':
        novaQuantidade = currentQty.add(movQty);
        if (dto.custoUnitario !== undefined && dto.custoUnitario !== null) {
          const custoEntrada = new Prisma.Decimal(dto.custoUnitario);
          const custoAtual = product.custoUnitario ?? new Prisma.Decimal(0);
          // Weighted-average cost: ((qtyAtual * custoAtual) + (qtyEntrada * custoEntrada)) / qtyFinal
          const valorAtual = currentQty.mul(custoAtual);
          const valorEntrada = movQty.mul(custoEntrada);
          novoCustoUnitario = novaQuantidade.greaterThan(0)
            ? valorAtual.add(valorEntrada).div(novaQuantidade)
            : custoEntrada;
        }
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
          custoUnitario: dto.custoUnitario,
          motivo: dto.motivo,
          userId,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(idempotencyKey && { idempotencyKey } as any),
        },
      }),
      this.prisma.product.update({
        where: { id: dto.productId },
        data: {
          quantidadeAtual: novaQuantidade,
          ...(dto.tipo === 'ENTRADA' ? { custoUnitario: novoCustoUnitario } : {}),
        },
      }),
    ]);

    return movement;
  }

  async findMovements(productId?: string, pagination?: PaginationDto) {
    const { page = 1, perPage = 50 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const where = productId ? { productId } : {};
    const [data, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: { product: { select: { nome: true, unidade: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.stockMovement.count({ where }),
    ]);
    return { data, total, page: safePage, perPage, totalPages: Math.ceil(total / perPage) };
  }
}

