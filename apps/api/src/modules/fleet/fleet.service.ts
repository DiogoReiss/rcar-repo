import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { VehicleStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateVehicleDto } from './dto/create-vehicle.dto.js';
import { UpdateVehicleDto } from './dto/update-vehicle.dto.js';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto.js';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

@Injectable()
export class FleetService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: VehicleStatus, pagination?: PaginationDto) {
    const { page = 1, perPage = 20 } = pagination ?? {};
    const safePage = Math.max(1, page);
    const where: Prisma.VehicleWhereInput = {
      deletedAt: null,
      ...(status && { status }),
    };
    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy: { modelo: 'asc' },
        skip: (safePage - 1) * perPage,
        take: perPage,
      }),
      this.prisma.vehicle.count({ where }),
    ]);
    return {
      data,
      total,
      page: safePage,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }

  async findOne(id: string) {
    const v = await this.prisma.vehicle.findUnique({
      where: { id },
      include: { maintenances: { orderBy: { data: 'desc' }, take: 10 } },
    });
    if (!v) throw new NotFoundException('Veículo não encontrado');
    return v;
  }

  async findAvailable() {
    return this.prisma.vehicle.findMany({
      where: { status: 'DISPONIVEL', deletedAt: null },
      orderBy: { modelo: 'asc' },
    });
  }

  async create(dto: CreateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { placa: dto.placa },
    });
    if (existing) throw new ConflictException('Placa já cadastrada');
    return this.prisma.vehicle.create({ data: dto });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    await this.findOne(id);
    return this.prisma.vehicle.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.vehicle.update({
      where: { id },
      data: { status: 'INATIVO', deletedAt: new Date() },
    });
  }

  async addMaintenance(vehicleId: string, dto: CreateMaintenanceDto) {
    await this.findOne(vehicleId);
    const [maintenance] = await this.prisma.$transaction([
      this.prisma.vehicleMaintenance.create({
        data: {
          vehicleId,
          descricao: dto.descricao,
          custo: dto.custo,
          data: new Date(dto.data),
        },
      }),
      ...(dto.setMantencao
        ? [
            this.prisma.vehicle.update({
              where: { id: vehicleId },
              data: { status: 'MANUTENCAO' },
            }),
          ]
        : []),
    ]);
    return maintenance;
  }

  async completeMaintenance(vehicleId: string) {
    const vehicle = await this.findOne(vehicleId);
    if (vehicle.status !== 'MANUTENCAO') return vehicle;
    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: 'DISPONIVEL' },
    });
  }

  async getMaintenances(vehicleId: string) {
    await this.findOne(vehicleId);
    return this.prisma.vehicleMaintenance.findMany({
      where: { vehicleId },
      orderBy: { data: 'desc' },
    });
  }
}
