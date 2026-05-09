import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageService } from 'primeng/api';
import { ApiService } from '@core/services/api.service';
import { FilaService } from '../fila.service';
import FilaPainelComponent from './fila-painel';

describe('FilaPainelComponent', () => {
  const filaMock = {
    queue: signal([]),
    services: signal([]),
    loading: signal(false),
    loadServices: vi.fn(() => of({ data: [{ id: 's1', nome: 'Lavagem', preco: 40 }] })),
    loadQueue: vi.fn(() => of({ data: [] })),
    connectStream: vi.fn(() => of({ queue: [] })),
    addToQueue: vi.fn(() => of({ id: 'q1' })),
    advance: vi.fn(() => of({})),
    pay: vi.fn(() => of({})),
  };

  const apiMock = {
    get: vi.fn(() => of({ data: [] })),
  };

  const toastMock = {
    add: vi.fn(),
  };

  let component: FilaPainelComponent;

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      imports: [FilaPainelComponent],
      providers: [
        { provide: FilaService, useValue: filaMock },
        { provide: ApiService, useValue: apiMock },
        { provide: MessageService, useValue: toastMock },
      ],
    });

    component = TestBed.createComponent(FilaPainelComponent).componentInstance;
  });

  it('should require nome in avulso mode', () => {
    component.addServiceId.set('s1');
    component.addMode.set('avulso');
    component.addNome.set('');

    expect(component.canSubmitAdd).toBe(false);

    component.addNome.set('Carlos');
    expect(component.canSubmitAdd).toBe(true);
  });

  it('should require customerId in cadastrado mode', () => {
    component.addServiceId.set('s1');
    component.addMode.set('cadastrado');
    component.addClienteId.set('');

    expect(component.canSubmitAdd).toBe(false);

    component.addClienteId.set('c1');
    expect(component.canSubmitAdd).toBe(true);
  });

  it('openAddDialog should reset fields and show dialog', () => {
    component.addMode.set('cadastrado');
    component.addNome.set('X');
    component.addPlaca.set('ABC1234');
    component.addClienteId.set('c1');

    component.openAddDialog();

    expect(component.addDialogVisible()).toBe(true);
    expect(component.addMode()).toBe('avulso');
    expect(component.addNome()).toBe('');
    expect(component.addPlaca()).toBe('');
    expect(component.addClienteId()).toBe('');
  });

  it('onSubmitAdd should submit and close dialog when form is valid', async () => {
    component.addServiceId.set('s1');
    component.addMode.set('avulso');
    component.addNome.set('Cliente Teste');
    component.addPlaca.set('ABC1234');
    component.addDialogVisible.set(true);

    await component.onSubmitAdd();

    expect(filaMock.addToQueue).toHaveBeenCalledOnce();
    expect(filaMock.loadQueue).toHaveBeenCalled();
    expect(component.addDialogVisible()).toBe(false);
    expect(toastMock.add).toHaveBeenCalled();
  });

  it('detailCanGeneratePdf should be true only for EM_ATENDIMENTO/CONCLUIDO', () => {
    component.detailItem.set({ id: 'q1', status: 'AGUARDANDO' } as any);
    expect(component.detailCanGeneratePdf).toBe(false);

    component.detailItem.set({ id: 'q1', status: 'EM_ATENDIMENTO' } as any);
    expect(component.detailCanGeneratePdf).toBe(true);

    component.detailItem.set({ id: 'q1', status: 'CONCLUIDO' } as any);
    expect(component.detailCanGeneratePdf).toBe(true);
  });
});


