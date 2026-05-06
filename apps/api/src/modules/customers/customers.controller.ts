import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CustomersService } from './customers.service.js';
import { CreateCustomerDto } from './dto/create-customer.dto.js';
import { UpdateCustomerDto } from './dto/update-customer.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @ApiOperation({ summary: 'Lista clientes' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) { return this.customersService.findAll(search); }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do cliente' })
  findOne(@Param('id') id: string) { return this.customersService.findOne(id); }

  @Post()
  @ApiOperation({ summary: 'Cadastra cliente' })
  create(@Body() dto: CreateCustomerDto) { return this.customersService.create(dto); }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza cliente' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto) { return this.customersService.update(id, dto); }

  @Delete(':id')
  @Roles('GESTOR_GERAL')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desativa cliente' })
  async remove(@Param('id') id: string) { await this.customersService.remove(id); }
}

