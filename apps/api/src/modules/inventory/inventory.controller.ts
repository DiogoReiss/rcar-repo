import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';
import { UpdateProductDto } from './dto/update-product.dto.js';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ─── Products ───────────────────────────────────────────────────────────────

  @Get('products')
  @ApiOperation({ summary: 'Lista todos os produtos do estoque (paginado)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  async findAllProducts(
    @Query('includeInactive') includeInactive?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.inventoryService.findAllProducts(
      includeInactive === 'true',
      pagination,
    );
  }

  @Get('products/low-stock')
  @ApiOperation({ summary: 'Produtos com estoque abaixo do mínimo' })
  async findLowStock() {
    return this.inventoryService.findLowStock();
  }

  @Get('products/:id')
  @ApiOperation({
    summary: 'Detalhe de um produto com histórico de movimentações',
  })
  async findProductById(@Param('id', ParseUUIDPipe) id: string) {
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
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.inventoryService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa um produto (soft delete)' })
  async deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    await this.inventoryService.deleteProduct(id);
  }

  // ─── Stock Movements ────────────────────────────────────────────────────────

  @Post('movements')
  @ApiOperation({ summary: 'Registra uma movimentação de estoque' })
  @ApiHeader({
    name: 'x-idempotency-key',
    description: 'Chave de idempotência opcional para evitar duplicação',
    required: false,
  })
  async createMovement(
    @Body() dto: CreateStockMovementDto,
    @CurrentUser('id') userId: string,
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    return this.inventoryService.createMovement(dto, userId, idempotencyKey);
  }

  @Get('movements')
  @ApiOperation({ summary: 'Histórico de movimentações (paginado)' })
  @ApiQuery({ name: 'productId', required: false })
  async findMovements(
    @Query('productId') productId?: string,
    @Query() pagination?: PaginationDto,
  ) {
    return this.inventoryService.findMovements(productId, pagination);
  }
}
