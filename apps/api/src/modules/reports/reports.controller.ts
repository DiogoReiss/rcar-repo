import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { Roles } from '../../common/decorators/roles.decorator.js';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('GESTOR_GERAL')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily')
  @ApiOperation({ summary: 'Resumo diário (lavajato + aluguel + estoque)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-06' })
  daily(@Query('date') date?: string) {
    return this.reportsService.getDailySummary(date);
  }

  @Get('monthly')
  @ApiOperation({ summary: 'Stats mensais (receita, clientes, contratos)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  monthly(@Query('year') year?: number, @Query('month') month?: number) {
    return this.reportsService.getMonthlyStats(year, month);
  }

  @Get('stock')
  @ApiOperation({ summary: 'Relatório completo de estoque' })
  stock() {
    return this.reportsService.getStockReport();
  }

  // A10: Single aggregated endpoint replacing 5 parallel frontend calls
  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs do dashboard (usuários, veículos, clientes, serviços, baixo estoque)' })
  dashboard() {
    return this.reportsService.getDashboardKpis();
  }

  @Get('charts')
  @ApiOperation({ summary: 'Dados de gráficos do dashboard (serviços semanais, hora de pico, uso de produtos, receita)' })
  charts() {
    return this.reportsService.getChartsData();
  }
}
