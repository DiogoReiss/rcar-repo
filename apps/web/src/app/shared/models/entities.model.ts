/**
 * Q9: This file now re-exports all types from @rcar/shared-types.
 * It exists for backward compatibility — existing imports of
 * `@shared/models/entities.model` continue to work without changes.
 *
 * New code should import directly from '@rcar/shared-types'.
 */
export type {
  UserRole,
  CustomerType,
  VehicleStatus,
  VehicleCategory,
  WashScheduleStatus,
  WashQueueStatus,
  RentalModality,
  ContractStatus,
  PaymentMethod,
  PaymentStatus,
  PaymentRefType,
  StockMovementType,
  InspectionType,
  TemplateType,
  AuthTokens,
  LoginCredentials,
  User,
  Customer,
  VehicleMaintenance,
  Vehicle,
  WashService,
  WashSchedule,
  WashQueueEntry,
  Product,
  StockMovement,
  RentalContract,
  Inspection,
  Payment,
  Template,
  AvailabilitySlot,
  AvailabilityResponse,
  FinancialSummary,
  RentalReceivablesReport,
  RentalReceivableRow,
  MaintenanceCostsReport,
  StockCostAnalysisReport,
  PaginatedResponse,
} from '@rcar/shared-types';
