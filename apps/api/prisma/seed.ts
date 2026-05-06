import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Admin user
  const senhaHash = await bcrypt.hash('mudar123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@rcar.com.br' },
    update: {},
    create: {
      nome: 'Admin RCar',
      email: 'admin@rcar.com.br',
      senhaHash,
      role: 'GESTOR_GERAL',
    },
  });
  console.log(`  ✓ User: ${admin.email} (${admin.role})`);

  // 2. Operador user
  const operador = await prisma.user.upsert({
    where: { email: 'operador@rcar.com.br' },
    update: {},
    create: {
      nome: 'Operador Lavajato',
      email: 'operador@rcar.com.br',
      senhaHash: await bcrypt.hash('mudar123', 10),
      role: 'OPERADOR',
    },
  });
  console.log(`  ✓ User: ${operador.email} (${operador.role})`);

  // 3. Wash services
  const servicos = [
    { nome: 'Lavagem Simples', descricao: 'Lavagem externa completa com secagem', preco: 40.00, duracaoMin: 30 },
    { nome: 'Lavagem Completa', descricao: 'Lavagem externa + interna + aspiração', preco: 70.00, duracaoMin: 60 },
    { nome: 'Polimento', descricao: 'Polimento cristalizado com proteção UV', preco: 150.00, duracaoMin: 120 },
    { nome: 'Higienização Interna', descricao: 'Limpeza profunda de estofados e painel', preco: 100.00, duracaoMin: 90 },
  ];

  for (const s of servicos) {
    await prisma.washService.upsert({
      where: { id: s.nome }, // Will fail on first run, create will be used
      update: {},
      create: s,
    });
  }
  // Use createMany for simplicity since upsert by nome isn't possible with unique id
  const existingServices = await prisma.washService.count();
  if (existingServices === 0) {
    await prisma.washService.createMany({ data: servicos });
  }
  console.log(`  ✓ Wash services: ${await prisma.washService.count()} total`);

  // 4. Vehicles
  const veiculos = [
    { placa: 'ABC-1234', modelo: 'Toyota Corolla', ano: 2023, cor: 'Prata', categoria: 'INTERMEDIARIO' as const },
    { placa: 'DEF-5678', modelo: 'Hyundai HB20', ano: 2024, cor: 'Branco', categoria: 'ECONOMICO' as const },
    { placa: 'GHI-9012', modelo: 'Jeep Compass', ano: 2023, cor: 'Preto', categoria: 'SUV' as const },
    { placa: 'JKL-3456', modelo: 'Fiat Argo', ano: 2024, cor: 'Vermelho', categoria: 'ECONOMICO' as const },
    { placa: 'MNO-7890', modelo: 'VW T-Cross', ano: 2024, cor: 'Cinza', categoria: 'SUV' as const },
  ];

  for (const v of veiculos) {
    await prisma.vehicle.upsert({
      where: { placa: v.placa },
      update: {},
      create: v,
    });
  }
  console.log(`  ✓ Vehicles: ${await prisma.vehicle.count()} total`);

  // 5. Template
  const existingTemplates = await prisma.template.count();
  if (existingTemplates === 0) {
    await prisma.template.create({
      data: {
        nome: 'Contrato de Locação Padrão',
        tipo: 'CONTRATO_LOCACAO',
        conteudoHtml: `<h1>CONTRATO DE LOCAÇÃO DE VEÍCULO</h1>
<p><strong>Locatário:</strong> {{cliente.nome}}</p>
<p><strong>CPF/CNPJ:</strong> {{cliente.cpfCnpj}}</p>
<p><strong>Veículo:</strong> {{veiculo.modelo}} - {{veiculo.placa}}</p>
<p><strong>Período:</strong> {{contrato.dataRetirada}} a {{contrato.dataDevolucao}}</p>
<p><strong>Valor Total:</strong> R$ {{contrato.valorTotal}}</p>`,
        variaveis: [
          'cliente.nome', 'cliente.cpfCnpj',
          'veiculo.placa', 'veiculo.modelo',
          'contrato.dataRetirada', 'contrato.dataDevolucao', 'contrato.valorTotal',
        ],
      },
    });
  }
  console.log(`  ✓ Templates: ${await prisma.template.count()} total`);

  // 6. Products (estoque lavajato)
  const produtos = [
    { nome: 'Shampoo Automotivo', descricao: 'Shampoo concentrado para lavagem externa', unidade: 'litro', quantidadeAtual: 20, estoqueMinimo: 5, custoUnitario: 25.00 },
    { nome: 'Cera Líquida', descricao: 'Cera protetora com brilho intenso', unidade: 'litro', quantidadeAtual: 10, estoqueMinimo: 3, custoUnitario: 45.00 },
    { nome: 'Pano Microfibra', descricao: 'Pano de secagem profissional', unidade: 'unidade', quantidadeAtual: 50, estoqueMinimo: 10, custoUnitario: 8.00 },
    { nome: 'Pretinho para Pneu', descricao: 'Revitalizador de pneus', unidade: 'litro', quantidadeAtual: 8, estoqueMinimo: 2, custoUnitario: 18.00 },
    { nome: 'Limpa Vidros', descricao: 'Limpador multiuso para vidros', unidade: 'litro', quantidadeAtual: 12, estoqueMinimo: 3, custoUnitario: 15.00 },
  ];

  const existingProducts = await prisma.product.count();
  if (existingProducts === 0) {
    await prisma.product.createMany({ data: produtos });
  }
  console.log(`  ✓ Products: ${await prisma.product.count()} total`);

  console.log('\n✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });






