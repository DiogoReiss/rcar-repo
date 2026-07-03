import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Sse,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Observable, switchMap, startWith } from 'rxjs';
import { map } from 'rxjs/operators';
import { LavajatoService } from './lavajato.service.js';
import { CreateScheduleDto } from './dto/create-schedule.dto.js';
import { UpdateScheduleDto } from './dto/update-schedule.dto.js';
import {
  CreateQueueEntryDto,
  CreatePaymentDto,
} from './dto/create-queue-entry.dto.js';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { FeaturesGuard } from '@common/guards/features.guard';
import { RequiresFeatures } from '@common/decorators/features.decorator';
import { QueueEventsService } from './queue-events.service.js';
import { from } from 'rxjs';

@ApiTags('Lavajato')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, FeaturesGuard)
@RequiresFeatures('LAVAJATO')
@Controller('lavajato')
export class LavajatoController {
  constructor(
    private readonly lavajatoService: LavajatoService,
    private readonly queueEvents: QueueEventsService,
  ) {}

  // ─── Schedules ──────────────────────────────────────────────────────────

  @Get('schedules/availability')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({
    summary: 'Retorna slots disponíveis para um dia (lógica sem sobreposição)',
  })
  @ApiQuery({ name: 'date', required: true, example: '2026-05-10' })
  @ApiQuery({
    name: 'serviceId',
    required: false,
    description: 'UUID do serviço para calcular duração',
  })
  getAvailability(
    @Query('date') date: string,
    @Query('serviceId') serviceId?: string,
  ) {
    return this.lavajatoService.getAvailability(date, serviceId);
  }

  @Get('schedules')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Lista agendamentos (filtro por data ou mês)' })
  @ApiQuery({ name: 'date', required: false, example: '2026-05-10' })
  @ApiQuery({
    name: 'month',
    required: false,
    example: '2026-05',
    description: 'Todos agendamentos do mês (YYYY-MM)',
  })
  getSchedules(@Query('date') date?: string, @Query('month') month?: string) {
    return this.lavajatoService.getSchedules(date, month);
  }

  @Post('schedules')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Cria agendamento' })
  createSchedule(@Body() dto: CreateScheduleDto) {
    return this.lavajatoService.createSchedule(dto);
  }

  @Patch('schedules/:id/status')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Atualiza status do agendamento' })
  updateScheduleStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateScheduleDto,
  ) {
    return this.lavajatoService.updateScheduleStatus(id, dto);
  }

  @Delete('schedules/:id')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela agendamento' })
  async cancelSchedule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.lavajatoService.cancelSchedule(id);
  }

  // ─── Queue ──────────────────────────────────────────────────────────────

  @Get('queue')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Retorna fila de atendimento atual' })
  getQueue() {
    return this.lavajatoService.getQueue();
  }

  @Post('queue')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Adiciona cliente à fila' })
  addToQueue(@Body() dto: CreateQueueEntryDto) {
    return this.lavajatoService.addToQueue(dto);
  }

  @Patch('queue/:id/advance')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({
    summary: 'Avança status na fila (aguardando → em atendimento → concluído)',
  })
  advanceQueue(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.lavajatoService.advanceQueue(id);
  }

  @Delete('queue/:id')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove/conclui entrada da fila' })
  async removeFromQueue(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    await this.lavajatoService.removeFromQueue(id);
  }

  @Sse('queue/stream')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({
    summary:
      'SSE: stream de atualizações da fila (push on change, not polling)',
  })
  queueStream(): Observable<MessageEvent> {
    // A15: Push queue snapshot only on actual change (event-driven, not polling)
    // S12: Auth is via httpOnly cookie (JwtAuthGuard reads cookie) — no ?token= query param
    return this.queueEvents.queueChanged$().pipe(
      startWith(null),
      switchMap(() => from(this.lavajatoService.getQueue())),
      map(
        (queue) =>
          ({ data: { queue, ts: new Date().toISOString() } }) as MessageEvent,
      ),
    );
  }

  // ─── Atendimentos do dia ─────────────────────────────────────────────────

  @Get('atendimentos')
  @Roles('GESTOR_GERAL', 'OPERADOR', 'OPERADOR_LEITURA')
  @ApiOperation({ summary: 'Atendimentos concluídos no dia' })
  @ApiQuery({ name: 'date', required: false })
  getAtendimentos(@Query('date') date?: string) {
    return this.lavajatoService.getAtendimentosDia(date);
  }

  // ─── Payments ───────────────────────────────────────────────────────────

  @Post('schedules/:id/payment')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Registra pagamento de agendamento' })
  paySchedule(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.lavajatoService.registerPayment('WASH_SCHEDULE', id, dto);
  }

  @Post('queue/:id/payment')
  @Roles('GESTOR_GERAL', 'OPERADOR')
  @ApiOperation({ summary: 'Registra pagamento de atendimento na fila' })
  payQueue(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.lavajatoService.registerPayment('WASH_QUEUE', id, dto);
  }
}
