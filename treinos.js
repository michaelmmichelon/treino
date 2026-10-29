// =====================================================================
// Divisões de treino prontas (a lista de exercícios fica em exercicios.js)
//   s = séries · r = repetições (faixa) · d = descanso em segundos
// =====================================================================

const ex = (n, s, r, d) => ({ n, s, r, d });

const MODELOS = [
  {
    nome: 'Full Body · 3x por semana',
    descricao: 'Corpo inteiro em todo treino, alternando A e B. Ótimo para começar ou para quem tem pouco tempo.',
    dias: [
      { nome: 'A · Corpo inteiro', exercicios: [
        ex('Agachamento livre', 3, '8-10', 120), ex('Supino reto com barra', 3, '8-10', 120), ex('Remada curvada', 3, '8-10', 90),
        ex('Desenvolvimento com halteres', 3, '10-12', 90), ex('Mesa flexora', 3, '10-12', 60), ex('Prancha', 3, '30-45s', 45)] },
      { nome: 'B · Corpo inteiro', exercicios: [
        ex('Leg press 45°', 3, '10-12', 90), ex('Puxada frontal', 3, '8-12', 90), ex('Supino inclinado com halteres', 3, '8-12', 90),
        ex('Stiff', 3, '8-10', 90), ex('Elevação lateral', 3, '12-15', 60), ex('Rosca direta', 2, '10-12', 60), ex('Tríceps na polia', 2, '10-12', 60)] },
    ],
  },
  {
    nome: 'ABC · Empurrar / Puxar / Pernas',
    descricao: 'Cada dia trabalha músculos que se movem juntos. Faça 3x (ABC) ou 6x por semana (ABCABC).',
    dias: [
      { nome: 'A · Peito, ombro e tríceps', exercicios: [
        ex('Supino reto com barra', 4, '6-10', 120), ex('Supino inclinado com halteres', 3, '8-12', 90), ex('Desenvolvimento com halteres', 3, '8-12', 90),
        ex('Elevação lateral', 4, '12-15', 60), ex('Crossover', 3, '12-15', 60), ex('Tríceps na polia', 3, '10-12', 60), ex('Tríceps francês', 3, '10-12', 60)] },
      { nome: 'B · Costas e bíceps', exercicios: [
        ex('Puxada frontal', 4, '8-10', 90), ex('Remada curvada', 4, '8-10', 90), ex('Remada baixa', 3, '10-12', 90),
        ex('Face pull', 3, '12-15', 60), ex('Rosca direta', 3, '8-12', 60), ex('Rosca martelo', 3, '10-12', 60)] },
      { nome: 'C · Pernas e abdômen', exercicios: [
        ex('Agachamento livre', 4, '6-10', 150), ex('Leg press 45°', 3, '10-12', 120), ex('Stiff', 3, '8-10', 120),
        ex('Cadeira extensora', 3, '12-15', 60), ex('Mesa flexora', 3, '10-12', 60), ex('Panturrilha em pé', 4, '10-15', 60), ex('Abdominal na polia', 3, '12-15', 60)] },
    ],
  },
  {
    nome: 'Upper / Lower · 4x por semana',
    descricao: 'Superior e inferior duas vezes na semana: um dia mais pesado (força) e outro com mais repetições (volume).',
    dias: [
      { nome: 'A · Superior (força)', exercicios: [
        ex('Supino reto com barra', 4, '5-8', 150), ex('Remada curvada', 4, '6-8', 120), ex('Desenvolvimento militar', 3, '6-8', 120),
        ex('Puxada frontal', 3, '8-10', 90), ex('Rosca direta', 2, '8-10', 60), ex('Tríceps testa', 2, '8-10', 60)] },
      { nome: 'B · Inferior (força)', exercicios: [
        ex('Agachamento livre', 4, '5-8', 180), ex('Stiff', 3, '6-8', 150), ex('Leg press 45°', 3, '8-10', 120),
        ex('Mesa flexora', 3, '8-10', 60), ex('Panturrilha em pé', 4, '8-12', 60)] },
      { nome: 'C · Superior (volume)', exercicios: [
        ex('Supino inclinado com halteres', 3, '10-12', 90), ex('Remada baixa', 3, '10-12', 90), ex('Remada unilateral com halter', 3, '10-12', 75),
        ex('Elevação lateral', 4, '12-15', 60), ex('Crucifixo na máquina (peck deck)', 3, '12-15', 60), ex('Face pull', 3, '12-15', 60),
        ex('Rosca alternada', 3, '10-12', 60), ex('Tríceps corda', 3, '10-12', 60)] },
      { nome: 'D · Inferior (volume)', exercicios: [
        ex('Agachamento búlgaro', 3, '10-12', 90), ex('Elevação pélvica', 3, '10-12', 90), ex('Cadeira extensora', 3, '12-15', 60),
        ex('Cadeira flexora', 3, '12-15', 60), ex('Panturrilha sentado', 4, '12-15', 60), ex('Elevação de pernas', 3, '12-15', 60)] },
    ],
  },
  {
    nome: 'ABCD · 4x por semana',
    descricao: 'Divisão clássica de academia: um ou dois grupos por dia, com mais exercícios para cada um.',
    dias: [
      { nome: 'A · Peito e tríceps', exercicios: [
        ex('Supino reto com barra', 4, '6-10', 120), ex('Supino inclinado com halteres', 3, '8-12', 90), ex('Crucifixo na máquina (peck deck)', 3, '12-15', 60),
        ex('Crossover', 3, '12-15', 60), ex('Tríceps na polia', 3, '10-12', 60), ex('Tríceps testa', 3, '10-12', 60)] },
      { nome: 'B · Costas e bíceps', exercicios: [
        ex('Barra fixa', 4, '6-10', 120), ex('Remada curvada', 4, '8-10', 90), ex('Puxada com pegada fechada', 3, '10-12', 90),
        ex('Remada unilateral com halter', 3, '10-12', 75), ex('Rosca direta', 3, '8-12', 60), ex('Rosca Scott', 3, '10-12', 60)] },
      { nome: 'C · Pernas', exercicios: [
        ex('Agachamento livre', 4, '6-10', 150), ex('Leg press 45°', 4, '10-12', 120), ex('Cadeira extensora', 3, '12-15', 60),
        ex('Stiff', 3, '8-10', 120), ex('Mesa flexora', 3, '10-12', 60), ex('Panturrilha em pé', 4, '10-15', 60)] },
      { nome: 'D · Ombros e abdômen', exercicios: [
        ex('Desenvolvimento com halteres', 4, '8-10', 90), ex('Elevação lateral', 4, '12-15', 60), ex('Elevação frontal', 3, '10-12', 60),
        ex('Crucifixo inverso', 3, '12-15', 60), ex('Encolhimento', 3, '10-12', 60), ex('Abdominal na polia', 3, '12-15', 60), ex('Prancha', 3, '30-60s', 45)] },
    ],
  },
];
