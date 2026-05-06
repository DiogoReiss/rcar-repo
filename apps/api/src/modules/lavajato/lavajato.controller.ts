import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Res, Sse, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { Observable, interval, map } from 'rxjs';
import { LavajatoService } from './lavajato.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import { CreateQueueEntryDto, CreatePaymentDto } from './dto/create-queue-entry.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';

@ApiTags('Lavajato')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('lavajato')
export class LavajatoController {
  constructor(private readonly lavajatoService: LavajatoService) {}

  // ─── Schedules ──────────────────────────────────────────────────────────

  @Get('schedules')
  @ApiOperation({ summary: 'Lista agendamentos (filtro por data)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-10' })
  getSchedules(@Query('date') date?: string) {
    return this.lavajatoService.getSchedules(date);
  }

  @Post('schedules')
  @ApiOperation({ summary: 'Cria agendamento' })
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.lavajatoService.createSchedule(dto);
  }

  @Patch('schedules/:id/status')
  @ApiOperation({ summary: 'Atualiza status do agendamento' })
  updateScheduleStatus(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.lavajatoService.updateScheduleStatus(id, dto);
  }

  @Delete('schedules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela agendamento' })
  async cancelSchedule(@Param('id') id: string) {
    await this.lavajatoService.cancelSchedule(id);
  }

  // ─── Queue ──────────────────────────────────────────────────────────────

  @Get('queue')
  @ApiOperation({ summary: 'Retorna fila de atendimento atual' })
  getQueue() {
    return this.lavajatoService.getQueue();
  }

  @Post('queue')
  @ApiOperation({ summary: 'Adiciona cliente à fila' })
  addToQueue(@Body() dto: CreateQueueEntryDto) {
    return this.lavajatoService.addToQueue(dto);
  }

  @Patch('queue/:id/advance')
  @ApiOperation({ summary: 'Avança status na fila (aguardando → em atendimento → concluído)' })
  advanceQueue(@Param('id') id: string) {
    return this.lavajatoService.advanceQueue(id);
  }

  @Delete('queue/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove/conclui entrada da fila' })
  async removeFromQueue(@Param('id') id: string) {
    await this.lavajatoService.removeFromQueue(id);
  }

  @Sse('queue/stream')
  @ApiOperation({ summary: 'SSE: stream de atualizações da fila' })
  queueStream(): Observable<MessageEvent> {
    return interval(3000).pipe(
      map(() => ({ data: { ping: true, ts: new Date().toISOString() } } as MessageEvent)),
    );
  }

  // ─── Atendimentos do dia ─────────────────────────────────────────────────

  @Get('atendimentos')
  @ApiOperation({ summary: 'Atendimentos concluídos no dia' })
  @ApiQuery({ name: 'date', required: false })
  getAtendimentos(@Query('date') date?: string) {
    return this.lavajatoService.getAtendimentosDia(date);
  }

  // ─── Payments ───────────────────────────────────────────────────────────

  @Post('schedules/:id/payment')
  @ApiOperation({ summary: 'Registra pagamento de agendamento' })
  paySchedule(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.lavajatoService.registerPayment('WASH_SCHEDULE', id, dto);
  }

  @Post('queue/:id/payment')
  @ApiOperation({ summary: 'Registra pagamento de atendimento na fila' })
  payQueue(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.lavajatoService.registerPayment('WASH_QUEUE', id, dto);
  }
}

