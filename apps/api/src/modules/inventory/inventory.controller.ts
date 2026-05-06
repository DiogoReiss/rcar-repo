import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Products ───────────────────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Lista todos os produtos do estoque' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAllProducts(@Query('includeInactive') includeInactive?: string) {
    return this.inventoryService.findAllProducts(includeInactive === 'true');
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Produtos com estoque abaixo do mínimo' })
  async findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Detalhe de um produto com histórico de movimentações' })
  async findProductById(@Param('id') id: string) {
    return this.inventoryService.findProductById(id);
  }

  @Post('products')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Cadastra um novo produto' })
  async createProduct(@Body() dto: CreateProductDto) {
    return this.inventoryService.createProduct(dto);
  }

  @Patch('products/:id')
  @Roles('GESTOR_GERAL')
  @ApiOperation({ summary: 'Atualiza um produto' })
  async updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.inventoryService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa um produto (soft delete)' })
  async deleteProduct(@Param('id') id: string) {
    await this.inventoryService.deleteProduct(id);
  }

  // ─── Stock Movements ────────────────────────────────────────────────────────

  @Post('movements')
  @ApiOperation({ summary: 'Registra uma movimentação de estoque' })
  async createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.inventoryService.createMovement(dto, userId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Histórico de movimentações' })
  @ApiQuery({ name: 'productId', required: false })
  async findMovements(@Query('productId') productId?: string) {
    return this.inventoryService.findMovements(productId);
  }
}

