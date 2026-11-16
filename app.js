// =====================================================================
// Treino — fichas, registro de séries, descanso e evolução de carga.
// Roda inteiro no celular (iPhone ou Android): os dados ficam no localStorage do navegador.
// =====================================================================
const { el, icone, toast, confirmar, pedirTexto } = UI;

const CHAVE = 'treino-dados';

// ------------------------------------------------------------------
// Aparelho: muda as instruções de instalação e os avisos de cada sistema.
// iPad novo se apresenta como Mac, então também olhamos se a tela é de toque.
// ------------------------------------------------------------------
const PLATAFORMA = /iphone|ipad|ipod/i.test(navigator.userAgent) || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1)
  ? 'ios'
  : /android/i.test(navigator.userAgent) ? 'android' : 'outro';
// Aberto pelo ícone (instalado) e não por uma aba do navegador
const instalado = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

// O Chrome do Android avisa quando o app pode ser instalado; guardamos o evento para
// mostrar o nosso botão "Instalar app" (o iPhone não tem isso: instala só pelo Safari).
let pedidoInstalacao = null;
window.addEventListener('beforeinstallprompt', (ev) => {
  ev.preventDefault();
  pedidoInstalacao = ev;
  if (typeof render === 'function') render();
});
window.addEventListener('appinstalled', () => {
  pedidoInstalacao = null;
  toast('App instalado! Abra pelo ícone na tela inicial.');
  render();
});
async function instalarApp() {
  if (!pedidoInstalacao) return;
  pedidoInstalacao.prompt();
  await pedidoInstalacao.userChoice.catch(() => {});
  pedidoInstalacao = null; // o mesmo pedido não pode ser usado duas vezes
  render();
}
const DESCANSOS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

// ------------------------------------------------------------------
// Dados
// ------------------------------------------------------------------
// notas: { "<nome sem acento>": "texto" } · corpo: [{ id, data, peso, cintura, ... }]
// Campos novos entram com valor padrão: backups antigos continuam abrindo.
function dadosVazios() {
  return {
    versao: 1, programas: [], ativo: null, sessoes: [], emAndamento: null, notas: {}, corpo: [],
    config: { som: true, telaLigada: true, barra: 20, ultimoBackup: null, backupAdiado: null },
  };
}

function carregar() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    if (salvo && salvo.versao === 1) return { ...dadosVazios(), ...salvo, config: { ...dadosVazios().config, ...salvo.config } };
  } catch {}
  return dadosVazios();
}

let dados = carregar();

function salvar() {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); }
  catch { toast('Não consegui salvar no aparelho (armazenamento cheio?)', 'erro'); }
}

const novoId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const programaAtivo = () => dados.programas.find((p) => p.id === dados.ativo) || null;

function adicionarModelo(m) {
  const p = {
    id: novoId(), nome: m.nome, descricao: m.descricao,
    dias: m.dias.map((d) => ({
      id: novoId(), nome: d.nome,
      exercicios: d.exercicios.map((e) => ({ id: novoId(), nome: e.n, series: e.s, reps: e.r, descanso: e.d })),
    })),
  };
  dados.programas.push(p);
  return p;
}

// O próximo dia é o seguinte ao último treinado nesta ficha (A → B → C → A...).
function proximoDia(prog) {
  for (let i = dados.sessoes.length - 1; i >= 0; i--) {
    const s = dados.sessoes[i];
    if (s.programaId !== prog.id) continue;
    const idx = prog.dias.findIndex((d) => d.id === s.diaId);
    if (idx >= 0) return (idx + 1) % prog.dias.length;
  }
  return 0;
}

// Séries de aquecimento (aq: true) ficam no histórico, mas não contam em volume, recordes nem sugestões.
const trabalho = (series) => series.filter((s) => !s.aq);
const mesmoExercicio = (a, b) => semAcento(a) === semAcento(b);

// Última vez que o exercício foi feito, em qualquer ficha (compara pelo nome). Só séries válidas.
function ultimaVez(nome) {
  for (let i = dados.sessoes.length - 1; i >= 0; i--) {
    const e = dados.sessoes[i].exercicios.find((x) => mesmoExercicio(x.nome, nome));
    if (e && trabalho(e.series).length) return { data: dados.sessoes[i].inicio, series: trabalho(e.series) };
  }
  return null;
}

const volume = (sessao) => sessao.exercicios.reduce((t, e) => t + trabalho(e.series).reduce((u, s) => u + (s.peso || 0) * (s.reps || 0), 0), 0);
const totalSeries = (sessao) => sessao.exercicios.reduce((t, e) => t + trabalho(e.series).length, 0);

// 1RM estimado pela fórmula de Epley: peso × (1 + reps/30)
const e1rm = (s) => (s.reps <= 1 ? s.peso : s.peso * (1 + s.reps / 30));

// Melhor marca de um conjunto de séries: carga máxima (desempate por reps) e 1RM; sem carga, máximo de reps.
function melhorMarca(series) {
  const validas = trabalho(series);
  const comPeso = validas.filter((s) => s.peso != null && s.peso > 0);
  if (comPeso.length) {
    const top = comPeso.reduce((a, b) => (b.peso > a.peso || (b.peso === a.peso && b.reps > a.reps) ? b : a));
    return { tipo: 'kg', peso: top.peso, reps: top.reps, rm: Math.max(...comPeso.map(e1rm)) };
  }
  return validas.length ? { tipo: 'reps', reps: Math.max(...validas.map((s) => s.reps || 0)) } : null;
}
const superou = (nova, antiga) => (nova.tipo === 'kg'
  ? antiga.tipo !== 'kg' || nova.peso > antiga.peso || (nova.peso === antiga.peso && nova.reps > antiga.reps)
  : antiga.tipo === 'reps' && nova.reps > antiga.reps);

const notaDe = (nome) => dados.notas[semAcento(nome)] || '';
function salvarNota(nome, texto) {
  const chave = semAcento(nome);
  if (texto?.trim()) dados.notas[chave] = texto.trim();
  else delete dados.notas[chave];
}

// ------------------------------------------------------------------
// Formatação
// ------------------------------------------------------------------
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const doisDig = (n) => String(n).padStart(2, '0');
const fmtDataCurta = (ts) => { const d = new Date(ts); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)}`; };
const fmtData = (ts) => `${DIAS_SEMANA[new Date(ts).getDay()]}, ${fmtDataCurta(ts)}`;
const fmtNum = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const fmtSerie = (s) => `${s.aq ? 'aq ' : ''}${s.peso != null ? `${fmtNum(s.peso)}×${s.reps}` : `${s.reps} reps`}`;
const fmtMarca = (m) => (m.tipo === 'kg' ? `${fmtNum(m.peso)} kg × ${m.reps}` : `${m.reps} reps`);
const DIA_MS = 864e5;
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const metaEx = (x) => `${x.series} × ${x.reps} · ${fmtSeg(x.descanso)}`;

function fmtSeg(s) {
  s = Math.max(0, Math.ceil(s));
  return `${Math.floor(s / 60)}:${doisDig(s % 60)}`;
}
function fmtDuracao(ms) {
  const min = Math.max(1, Math.round(ms / 60000));
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h${doisDig(min % 60)}`;
}
function lerNum(v) {
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}
// "8-12" → 12. Faixas em segundos ("30-45s") não entram na sugestão de carga.
function topoFaixa(reps) {
  if (/s\s*$/i.test(reps)) return null;
  const nums = String(reps).match(/\d+/g);
  return nums ? Number(nums[nums.length - 1]) : null;
}
// Bateu o topo da faixa em todas as séries da última vez → hora de subir a carga.
function podeSubir(series, reps, alvo) {
  const topo = topoFaixa(reps);
  return !!topo && series.length >= alvo && series.every((s) => s.peso != null && s.reps >= topo);
}

// ------------------------------------------------------------------
// Peças de interface
// ------------------------------------------------------------------
const botaoIcone = (nome, rotulo, onclick, desativado) =>
  el('button', { className: 'botao fantasma icone pequeno', 'aria-label': rotulo, title: rotulo, onclick, disabled: desativado }, icone(nome, 16));

const campo = (rotulo, entrada) => el('label', { className: 'campo' }, rotulo, el('div', { className: 'entrada' }, entrada));

const vazio = (nomeIcone, titulo, texto) =>
  el('div', { className: 'vazio' }, el('div', { className: 'vazio-icone' }, icone(nomeIcone, 26)), el('strong', {}, titulo), el('p', {}, texto));

function segmentado(opcoes, atual, aoTrocar) {
  return el('div', { className: 'segmentado', role: 'tablist' },
    opcoes.map(([valor, rotulo]) => el('button', { role: 'tab', 'aria-selected': String(valor === atual), onclick: () => aoTrocar(valor) }, rotulo)));
}

function mover(lista, de, para) {
  if (para < 0 || para >= lista.length) return;
  lista.splice(para, 0, lista.splice(de, 1)[0]);
  salvar();
  render();
}

function cartaoModelo(m, rotulo, acao) {
  return el('section', { className: 'cartao modelo' },
    el('h2', {}, m.nome),
    el('p', { className: 'mudo' }, m.descricao),
    el('ul', { className: 'chips' }, m.dias.map((d) => el('li', {}, d.nome))),
    el('button', { className: 'botao primario largo', onclick: acao }, rotulo));
}

// ------------------------------------------------------------------
// Navegação
// ------------------------------------------------------------------
const conteudo = document.getElementById('conteudo');
let tela = 'hoje';
let editando = null; // id da ficha aberta no editor

function irPara(nova) {
  tela = nova;
  editando = null;
  render();
  window.scrollTo(0, 0);
}

function render() {
  const y = window.scrollY;
  document.querySelectorAll('.abas button').forEach((b) => {
    if (b.dataset.tela === tela) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  const prog = programaAtivo();
  document.getElementById('subtitulo').textContent = prog ? prog.nome : 'Escolha uma divisão';
  const telas = { hoje: telaHoje, fichas: telaFichas, exercicios: telaExercicios, historico: telaHistorico, ajustes: telaAjustes };
  conteudo.replaceChildren(...[telas[tela]()].flat(Infinity).filter(Boolean));
  window.scrollTo(0, y);
}

document.querySelectorAll('.abas button').forEach((b) => b.addEventListener('click', () => irPara(b.dataset.tela)));

// ------------------------------------------------------------------
// Tela: Hoje
// ------------------------------------------------------------------
function telaHoje() {
  const partes = [];
  if (dados.emAndamento) partes.push(cartaoEmAndamento());

  const prog = programaAtivo();
  if (!prog) {
    partes.push(el('div', { className: 'boas-vindas' },
      el('h2', {}, 'Escolha uma divisão de treino'),
      el('p', { className: 'mudo' }, 'Comece com uma pronta e ajuste os exercícios do seu jeito depois, na aba Fichas.')));
    MODELOS.forEach((m) => partes.push(cartaoModelo(m, 'Usar esta divisão', () => {
      dados.ativo = adicionarModelo(m).id;
      salvar();
      render();
      toast('Divisão escolhida. Bom treino!');
    })));
    partes.push(el('button', { className: 'botao fantasma largo', onclick: criarEmBranco }, icone('plus'), 'Montar a minha do zero'));
    return partes;
  }

  if (precisaBackup()) partes.push(cartaoBackup());
  partes.push(cartaoSemana());
  if (!prog.dias.length) {
    partes.push(el('section', { className: 'cartao' }, vazio('lista', 'Esta ficha está vazia', 'Adicione os dias e exercícios na aba Fichas.')));
    return partes;
  }

  const iProx = proximoDia(prog);
  partes.push(cartaoDia(prog, prog.dias[iProx]));
  if (prog.dias.length > 1) {
    partes.push(el('h2', { className: 'secao' }, 'Outro dia'));
    partes.push(el('div', { className: 'outros-dias' }, prog.dias.map((d, i) => i === iProx ? null :
      el('button', { className: 'cartao dia-curto', onclick: () => iniciarTreino(prog, d) },
        el('span', {}, el('strong', {}, d.nome), el('small', { className: 'mudo' }, `${d.exercicios.length} exercícios`)),
        icone('direita', 18)))));
  }
  return partes;
}

function cartaoEmAndamento() {
  const s = dados.emAndamento;
  const feitas = s.exercicios.reduce((t, e) => t + e.series.filter((x) => x.feito).length, 0);
  const total = s.exercicios.reduce((t, e) => t + e.series.length, 0);
  return el('section', { className: 'cartao em-andamento' },
    el('div', {}, el('small', {}, 'Treino em andamento'), el('strong', {}, s.diaNome), el('small', { className: 'num' }, `${feitas} de ${total} séries`)),
    el('button', { className: 'botao primario', onclick: abrirSessao }, icone('play', 16), 'Continuar'));
}

// Lembrete: mais de 15 dias sem backup (contando do primeiro treino, se nunca fez).
// "Depois" esconde por 3 dias.
function precisaBackup() {
  if (!dados.sessoes.length) return false;
  const agora = Date.now();
  const base = dados.config.ultimoBackup ?? dados.sessoes[0].inicio;
  if (dados.config.backupAdiado && agora - dados.config.backupAdiado < 3 * DIA_MS) return false;
  return agora - base > 15 * DIA_MS;
}

function cartaoBackup() {
  const dias = dados.config.ultimoBackup ? Math.floor((Date.now() - dados.config.ultimoBackup) / DIA_MS) : null;
  return el('section', { className: 'cartao lembrete-backup' },
    el('div', { className: 'lembrete-topo' },
      icone('download', 20),
      el('div', {},
        el('strong', {}, 'Hora de fazer um backup'),
        el('p', {}, dias === null
          ? `Você já tem ${plural(dados.sessoes.length, 'treino', 'treinos')} salvos só neste celular e ainda não fez nenhum backup.`
          : `O último foi há ${dias} dias. Se os dados do navegador forem apagados, o histórico vai junto.`))),
    el('div', { className: 'ficha-acoes' },
      el('button', { className: 'botao primario pequeno', onclick: exportar }, icone('download', 16), 'Exportar agora'),
      el('button', { className: 'botao fantasma pequeno', onclick: () => { dados.config.backupAdiado = Date.now(); salvar(); render(); } }, 'Depois')));
}

function cartaoSemana() {
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7)); // segunda-feira
  const treinados = new Set(dados.sessoes.filter((s) => s.inicio >= inicio.getTime()).map((s) => new Date(s.inicio).getDay()));
  const hoje = new Date().getDay();
  const ordem = [1, 2, 3, 4, 5, 6, 0];
  return el('section', { className: 'cartao semana' },
    el('div', { className: 'semana-topo' },
      el('h2', {}, 'Esta semana'),
      el('span', { className: 'mudo num' }, `${plural(treinados.size, 'treino', 'treinos')} · ${dados.sessoes.length} no total`)),
    el('ol', { className: 'semana-dias' }, ordem.map((d) => el('li', {
      className: [treinados.has(d) && 'feito', d === hoje && 'hoje'].filter(Boolean).join(' '),
      'aria-label': `${DIAS_SEMANA[d]}${treinados.has(d) ? ': treinou' : ''}`,
    }, el('span', {}, DIAS_SEMANA[d].slice(0, 1).toUpperCase()), treinados.has(d) ? icone('check', 14) : null))));
}

function cartaoDia(prog, dia) {
  const minutos = Math.round(dia.exercicios.reduce((t, e) => t + e.series * (e.descanso + 40), 0) / 60);
  const andamento = dados.emAndamento && dados.emAndamento.diaId === dia.id;
  return el('section', { className: 'cartao proximo' },
    el('small', { className: 'rotulo' }, 'Próximo treino'),
    el('h2', {}, dia.nome),
    el('p', { className: 'mudo num' }, `${dia.exercicios.length} exercícios · cerca de ${minutos} min`),
    el('ol', { className: 'lista-resumo' }, dia.exercicios.map((e) => el('li', {},
      el('button', { className: 'link-guia', onclick: () => abrirGuia(e.nome) }, e.nome, guiaDe(e.nome) ? icone('info', 14) : null),
      el('span', { className: 'mudo num' }, `${e.series} × ${e.reps}`)))),
    el('button', { className: 'botao primario largo grande', onclick: () => andamento ? abrirSessao() : iniciarTreino(prog, dia), disabled: !dia.exercicios.length },
      icone('play', 18), andamento ? 'Continuar treino' : 'Começar treino'));
}

// ------------------------------------------------------------------
// Tela: Fichas (lista e editor)
// ------------------------------------------------------------------
function telaFichas() {
  if (editando) {
    const p = dados.programas.find((x) => x.id === editando);
    if (p) return telaEditor(p);
    editando = null;
  }
  const lista = dados.programas.map((p) => el('section', { className: 'cartao ficha' },
    el('div', { className: 'cartao-cabecalho' }, el('h2', {}, p.nome), p.id === dados.ativo ? el('span', { className: 'selo acento' }, 'Em uso') : null),
    el('p', { className: 'mudo' }, p.dias.map((d) => d.nome).join(' · ') || 'Sem dias'),
    el('div', { className: 'ficha-acoes' },
      p.id !== dados.ativo ? el('button', { className: 'botao primario pequeno', onclick: () => { dados.ativo = p.id; salvar(); render(); toast(`Usando "${p.nome}"`); } }, 'Usar esta') : null,
      el('button', { className: 'botao secundario pequeno', onclick: () => abrirEditor(p.id) }, icone('pencil', 16), 'Editar'),
      el('button', { className: 'botao secundario pequeno', onclick: () => duplicar(p) }, icone('copy', 16), 'Duplicar'),
      botaoIcone('trash', 'Excluir ficha', () => excluirFicha(p)))));

  return [
    el('h2', { className: 'secao' }, 'Minhas fichas'),
    lista.length ? el('div', { className: 'pilha' }, lista) : el('section', { className: 'cartao' }, vazio('lista', 'Nenhuma ficha', 'Adicione uma divisão pronta abaixo ou crie a sua.')),
    el('button', { className: 'botao secundario largo', onclick: criarEmBranco }, icone('plus'), 'Criar ficha em branco'),
    el('h2', { className: 'secao' }, 'Divisões prontas'),
    el('div', { className: 'pilha' }, MODELOS.map((m) => cartaoModelo(m, 'Adicionar às minhas fichas', () => {
      const p = adicionarModelo(m);
      if (!dados.ativo) dados.ativo = p.id;
      salvar();
      abrirEditor(p.id);
      toast('Ficha adicionada. Ajuste o que quiser.');
    }))),
  ];
}

function abrirEditor(id) {
  tela = 'fichas';
  editando = id;
  render();
  window.scrollTo(0, 0);
}

async function criarEmBranco() {
  const nome = await pedirTexto({ titulo: 'Nome da ficha', valor: 'Minha ficha', max: 60 });
  if (!nome?.trim()) return;
  const p = { id: novoId(), nome: nome.trim(), descricao: '', dias: [{ id: novoId(), nome: 'A', exercicios: [] }] };
  dados.programas.push(p);
  if (!dados.ativo) dados.ativo = p.id;
  salvar();
  abrirEditor(p.id);
}

function duplicar(p) {
  const copia = structuredClone(p);
  copia.id = novoId();
  copia.nome = `${p.nome} (cópia)`;
  copia.dias.forEach((d) => { d.id = novoId(); d.exercicios.forEach((e) => { e.id = novoId(); }); });
  dados.programas.push(copia);
  salvar();
  render();
  toast('Ficha duplicada');
}

async function excluirFicha(p) {
  const ok = await confirmar({ titulo: `Excluir "${p.nome}"?`, mensagem: 'O histórico de treinos continua salvo.', perigoso: true, textoOk: 'Excluir' });
  if (!ok) return;
  dados.programas = dados.programas.filter((x) => x.id !== p.id);
  if (dados.ativo === p.id) dados.ativo = dados.programas[0]?.id ?? null;
  salvar();
  render();
}

function telaEditor(prog) {
  const renomearFicha = async () => {
    const n = await pedirTexto({ titulo: 'Nome da ficha', valor: prog.nome, max: 60 });
    if (n?.trim()) { prog.nome = n.trim(); salvar(); render(); }
  };
  const adicionarDia = async () => {
    const n = await pedirTexto({ titulo: 'Novo dia', valor: `${String.fromCharCode(65 + prog.dias.length)} · `, max: 60 });
    if (n?.trim()) { prog.dias.push({ id: novoId(), nome: n.trim(), exercicios: [] }); salvar(); render(); }
  };
  return [
    el('button', { className: 'botao fantasma pequeno voltar', onclick: () => { editando = null; render(); window.scrollTo(0, 0); } }, icone('esquerda', 16), 'Fichas'),
    el('div', { className: 'editor-cab' }, el('h2', {}, prog.nome), botaoIcone('pencil', 'Renomear ficha', renomearFicha)),
    prog.descricao ? el('p', { className: 'mudo editor-desc' }, prog.descricao) : null,
    el('p', { className: 'mudo editor-desc' }, 'Toque num exercício para mudar séries, repetições e descanso.'),
    el('div', { className: 'pilha' }, prog.dias.map((d, i) => cartaoDiaEditor(prog, d, i))),
    el('button', { className: 'botao secundario largo', onclick: adicionarDia }, icone('plus'), 'Adicionar dia'),
  ];
}

function cartaoDiaEditor(prog, d, i) {
  const renomear = async () => {
    const n = await pedirTexto({ titulo: 'Nome do dia', valor: d.nome, max: 60 });
    if (n?.trim()) { d.nome = n.trim(); salvar(); render(); }
  };
  const excluir = async () => {
    const ok = await confirmar({ titulo: `Excluir "${d.nome}"?`, mensagem: 'Os exercícios deste dia saem da ficha. O histórico continua salvo.', perigoso: true, textoOk: 'Excluir' });
    if (ok) { prog.dias.splice(i, 1); salvar(); render(); }
  };
  // A nota fica guardada pelo nome do exercício (vale em todas as fichas), não dentro da ficha
  const separarNota = (r) => { const { nota, ...resto } = r; salvarNota(resto.nome, nota); return resto; };
  const editarEx = async (x, j) => {
    const r = await dialogoExercicio(x);
    if (r === 'excluir') d.exercicios.splice(j, 1);
    else if (r) Object.assign(x, separarNota(r));
    else return;
    salvar();
    render();
  };
  const novoEx = async () => {
    const r = await dialogoExercicio(null);
    if (!r || r === 'excluir') return;
    d.exercicios.push({ id: novoId(), ...separarNota(r) });
    salvar();
    render();
    atualizarListaExercicios();
  };

  return el('section', { className: 'cartao dia-editor' },
    el('div', { className: 'cartao-cabecalho' },
      el('h2', {}, d.nome),
      botaoIcone('pencil', 'Renomear dia', renomear),
      botaoIcone('sobe', 'Mover dia para cima', () => mover(prog.dias, i, i - 1), i === 0),
      botaoIcone('desce', 'Mover dia para baixo', () => mover(prog.dias, i, i + 1), i === prog.dias.length - 1),
      botaoIcone('trash', 'Excluir dia', excluir)),
    d.exercicios.length
      ? el('ol', { className: 'lista-ex' }, d.exercicios.map((x, j) => el('li', {},
          el('button', { className: 'ex-item', onclick: () => editarEx(x, j) },
            el('strong', {}, x.nome), el('small', { className: 'mudo num' }, metaEx(x)),
            notaDe(x.nome) ? el('small', { className: 'ex-item-nota' }, icone('nota', 12), notaDe(x.nome)) : null),
          botaoGuia(x.nome),
          botaoIcone('sobe', 'Subir exercício', () => mover(d.exercicios, j, j - 1), j === 0),
          botaoIcone('desce', 'Descer exercício', () => mover(d.exercicios, j, j + 1), j === d.exercicios.length - 1))))
      : el('p', { className: 'mudo' }, 'Nenhum exercício ainda.'),
    el('button', { className: 'botao fantasma pequeno', onclick: novoEx }, icone('plus', 16), 'Exercício'));
}

// Diálogo de criar/editar exercício. Devolve os campos, 'excluir' ou null (cancelou).
function dialogoExercicio(atual) {
  return new Promise((resolve) => {
    const novo = !atual;
    const v = atual || { nome: '', series: 3, reps: '8-12', descanso: 90 };
    const nome = el('input', { value: v.nome, required: true, maxLength: 80, autocomplete: 'off', placeholder: 'Ex.: Supino reto com barra' });
    nome.setAttribute('list', 'listaExercicios');
    const series = el('input', { type: 'number', min: 1, max: 10, value: v.series, inputMode: 'numeric', required: true });
    const reps = el('input', { value: v.reps, maxLength: 12, required: true, placeholder: '8-12' });
    const desc = el('select', {}, DESCANSOS.map((s) => el('option', { value: s, selected: s === v.descanso }, fmtSeg(s))));
    const nota = el('input', { value: novo ? '' : notaDe(v.nome), maxLength: 200, autocomplete: 'off', placeholder: 'Ex.: banco na posição 4' });

    let terminou = false;
    const terminar = (r) => {
      if (terminou) return;
      terminou = true;
      resolve(r);
      dlg.close();
      dlg.remove();
    };
    const form = el('form', {
      onsubmit: (e) => {
        e.preventDefault();
        terminar({
          nome: nome.value.trim(),
          series: Math.min(10, Math.max(1, parseInt(series.value, 10) || 3)),
          reps: reps.value.trim() || '8-12',
          descanso: Number(desc.value),
          nota: nota.value,
        });
      },
    },
      el('div', { className: 'dialogo-topo' }, el('div', { className: 'dialogo-icone' }, icone('haltere', 20)), el('h2', {}, novo ? 'Novo exercício' : 'Editar exercício')),
      campo('Exercício', nome),
      el('div', { className: 'grade-3' }, campo('Séries', series), campo('Repetições', reps), campo('Descanso', desc)),
      campo('Nota (opcional)', nota),
      el('div', { className: 'dialogo-botoes' },
        novo ? null : el('button', { type: 'button', className: 'botao fantasma perigo-texto', style: { marginRight: 'auto' }, onclick: () => terminar('excluir') }, icone('trash', 16), 'Excluir'),
        el('button', { type: 'button', className: 'botao secundario', onclick: () => terminar(null) }, 'Cancelar'),
        el('button', { type: 'submit', className: 'botao primario' }, 'Salvar')));

    const dlg = el('dialog', { className: 'dialogo' }, form);
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); terminar(null); });
    document.body.append(dlg);
    dlg.showModal();
    if (novo) nome.focus();
  });
}

// ------------------------------------------------------------------
// Guia do exercício: fotos alternando (início ↔ fim), músculos, passo a passo e dicas
// ------------------------------------------------------------------
const linkVideo = (nome) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`como fazer ${nome} execução correta`)}`;
const foto = (g, n) => `exercicios/${g.img}/${n}.jpg`;

function abrirGuia(nome) {
  const g = guiaDe(nome);
  let alternar = null;
  const fechar = () => { clearInterval(alternar); dlg.close(); dlg.remove(); };

  const fotos = g
    ? el('div', { className: 'guia-fotos', 'aria-label': `Fotos de ${g.nome}: posição inicial e final` },
        el('img', { src: foto(g, 0), alt: 'Posição inicial', className: 'mostrando' }),
        el('img', { src: foto(g, 1), alt: 'Posição final' }),
        el('span', { className: 'guia-etapa' }, 'Início'))
    : null;
  if (fotos) {
    const [a, b] = fotos.querySelectorAll('img');
    const etapa = fotos.querySelector('.guia-etapa');
    alternar = setInterval(() => {
      const fim = a.classList.toggle('mostrando') === false;
      b.classList.toggle('mostrando', fim);
      etapa.textContent = fim ? 'Fim' : 'Início';
    }, 1400);
  }

  const minhaNota = notaDe(nome);
  const corpo = g
    ? [
        minhaNota ? el('p', { className: 'ex-nota-texto guia-nota' }, icone('nota', 14), el('span', {}, minhaNota)) : null,
        el('div', { className: 'guia-musculos' },
          el('div', {}, el('small', {}, 'Principal'), el('strong', {}, g.principais)),
          g.secundarios ? el('div', {}, el('small', {}, 'Também trabalha'), el('span', {}, g.secundarios)) : null),
        el('h3', {}, 'Como fazer'),
        el('ol', { className: 'guia-passos' }, g.passos.map((p) => el('li', {}, p))),
        el('h3', {}, 'Dicas'),
        el('ul', { className: 'guia-dicas' }, g.dicas.map((d) => el('li', {}, d))),
      ]
    : [el('p', { className: 'mudo' }, 'Este exercício não tem fotos nem instruções no app. O vídeo abaixo procura no YouTube pelo nome.')];

  const dlg = el('dialog', { className: 'dialogo guia', 'aria-label': nome },
    fotos,
    el('div', { className: 'guia-conteudo' },
      el('div', { className: 'guia-topo' },
        el('div', {}, g ? el('span', { className: 'selo acento' }, g.grupo) : null, el('h2', {}, g ? g.nome : nome)),
        el('button', { className: 'botao fantasma icone pequeno', 'aria-label': 'Fechar', onclick: fechar }, icone('x', 18))),
      corpo,
      el('a', { className: 'botao secundario largo', href: linkVideo(g ? g.nome : nome), target: '_blank', rel: 'noopener' }, icone('play', 16), 'Ver vídeo no YouTube'),
      g ? el('p', { className: 'mudo guia-credito' }, 'Fotos: free-exercise-db (domínio público)') : null));
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); fechar(); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) fechar(); }); // toque fora
  document.body.append(dlg);
  dlg.showModal();
  dlg.scrollTop = 0;
}

const botaoGuia = (nome) => botaoIcone('info', `Como fazer ${nome}`, (ev) => { ev.stopPropagation(); abrirGuia(nome); });

// ------------------------------------------------------------------
// Tela: Exercícios (consulta)
// ------------------------------------------------------------------
let filtroGrupo = 'Todos';
let buscaExercicio = '';

function telaExercicios() {
  const lista = el('div', { className: 'pilha lista-guia' });
  const desenharLista = () => {
    const termo = semAcento(buscaExercicio);
    const achados = Object.values(GUIA).filter((g) =>
      (filtroGrupo === 'Todos' || g.grupo === filtroGrupo) &&
      (!termo || semAcento(`${g.nome} ${g.principais} ${g.secundarios}`).includes(termo)));
    lista.replaceChildren(...(achados.length
      ? achados.map((g) => el('button', { className: 'cartao item-guia', onclick: () => abrirGuia(g.nome) },
          el('img', { src: foto(g, 1), alt: '', loading: 'lazy', width: 72, height: 48 }),
          el('span', {}, el('strong', {}, g.nome), el('small', { className: 'mudo' }, g.principais)),
          icone('direita', 18)))
      : [el('section', { className: 'cartao' }, vazio('search', 'Nenhum exercício encontrado', 'Tente outro nome ou outro grupo.'))]));
  };
  const busca = el('input', { type: 'search', value: buscaExercicio, placeholder: 'Buscar exercício ou músculo', 'aria-label': 'Buscar exercício', autocomplete: 'off' });
  busca.addEventListener('input', () => { buscaExercicio = busca.value; desenharLista(); });
  const chips = el('div', { className: 'filtro-grupos', role: 'tablist' }, ['Todos', ...GRUPOS].map((gr) =>
    el('button', { role: 'tab', 'aria-selected': String(gr === filtroGrupo), onclick: () => { filtroGrupo = gr; render(); } }, gr)));
  desenharLista();
  return [
    el('div', { className: 'entrada' }, icone('search', 18), busca),
    chips,
    lista,
  ];
}

function atualizarListaExercicios() {
  const nomes = new Set(Object.values(EXERCICIOS).flat());
  dados.programas.forEach((p) => p.dias.forEach((d) => d.exercicios.forEach((e) => nomes.add(e.nome))));
  document.getElementById('listaExercicios').replaceChildren(...[...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((n) => el('option', { value: n })));
}

// ------------------------------------------------------------------
// Treino em andamento
// ------------------------------------------------------------------
const sessaoEl = document.getElementById('sessao');

async function iniciarTreino(prog, dia) {
  if (dados.emAndamento) {
    const ok = await confirmar({ titulo: 'Já tem um treino em andamento', mensagem: `Descartar "${dados.emAndamento.diaNome}" e começar "${dia.nome}"?`, perigoso: true, textoOk: 'Descartar e começar' });
    if (!ok) return;
  }
  dados.emAndamento = {
    id: novoId(), programaId: prog.id, diaId: dia.id, diaNome: dia.nome, inicio: Date.now(), timer: null,
    exercicios: dia.exercicios.map((e) => ({
      nome: e.nome, reps: e.reps, descanso: e.descanso,
      series: Array.from({ length: e.series }, () => ({ peso: '', reps: '', feito: false })),
    })),
  };
  salvar();
  destravarSom();
  abrirSessao();
}

function abrirSessao() {
  sessaoEl.hidden = false;
  document.body.classList.add('em-treino');
  renderSessao();
  sessaoEl.scrollTop = 0;
  manterTelaLigada();
}

function fecharSessao() {
  sessaoEl.hidden = true;
  document.body.classList.remove('em-treino');
  liberarTela();
  render();
}

// ------------------------------------------------------------------
// Tela sempre ligada durante o treino (Wake Lock: iOS 16.4+ e Chrome do Android).
// O sistema solta a trava quando o app vai para segundo plano; ao voltar, pedimos de novo.
// ------------------------------------------------------------------
let travaTela = null;
async function manterTelaLigada() {
  if (!dados.config.telaLigada || !('wakeLock' in navigator) || sessaoEl.hidden || travaTela) return;
  try {
    travaTela = await navigator.wakeLock.request('screen');
    travaTela.addEventListener('release', () => { travaTela = null; });
  } catch {}
}
function liberarTela() {
  travaTela?.release().catch(() => {});
  travaTela = null;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') manterTelaLigada(); });

// ------------------------------------------------------------------
// Calculadora de anilhas: quantas anilhas de cada lado para chegar no peso total
// ------------------------------------------------------------------
const ANILHAS = [25, 20, 15, 10, 5, 2.5, 1.25];
const BARRAS = [[20, 'Barra 20 kg'], [15, 'Barra 15 kg'], [10, 'Barra 10 kg'], [0, 'Sem barra']];
let ultimoPesoTocado = '';

// Guloso do maior para o menor: com estas anilhas sempre dá o menor número de peças.
function montarAnilhas(total, barra) {
  let lado = Math.round(((total - barra) / 2) * 100) / 100;
  const pecas = [];
  for (const a of ANILHAS) while (lado >= a - 1e-9) { pecas.push(a); lado = Math.round((lado - a) * 100) / 100; }
  return { pecas, sobra: lado * 2 };
}

function abrirCalculadora() {
  const total = el('input', { type: 'text', inputMode: 'decimal', value: ultimoPesoTocado || '', placeholder: 'Ex.: 80', autocomplete: 'off', 'aria-label': 'Peso total em kg' });
  const resultado = el('div', { className: 'calc-resultado', 'aria-live': 'polite' });
  let barra = dados.config.barra ?? 20;
  const barras = el('div', { className: 'filtro-grupos calc-barras', role: 'tablist' });
  const desenharBarras = () => barras.replaceChildren(...BARRAS.map(([kg, rotulo]) =>
    el('button', { type: 'button', role: 'tab', 'aria-selected': String(kg === barra), onclick: () => { barra = kg; dados.config.barra = kg; salvar(); desenharBarras(); calcular(); } }, rotulo)));
  const calcular = () => {
    const kg = lerNum(total.value);
    if (kg === null) { resultado.replaceChildren(el('p', { className: 'mudo' }, 'Digite o peso total que vai levantar.')); return; }
    if (kg < barra) { resultado.replaceChildren(el('p', { className: 'mudo' }, `O peso é menor que a barra (${fmtNum(barra)} kg).`)); return; }
    const { pecas, sobra } = montarAnilhas(kg, barra);
    resultado.replaceChildren(...[
      el('small', { className: 'mudo' }, barra ? 'Em cada lado da barra' : 'Em cada lado'),
      pecas.length
        ? el('div', { className: 'anilhas' }, pecas.map((a) => el('span', { className: `anilha a${String(a).replace('.', '_')}` }, fmtNum(a))))
        : el('p', {}, 'Só a barra.'),
      pecas.length ? el('p', { className: 'num' }, `${pecas.map(fmtNum).join(' + ')} kg de cada lado`) : null,
      sobra > 0.001 ? el('p', { className: 'calc-sobra' }, `Não fecha exato: ficaria ${fmtNum(kg - sobra)} kg (faltam ${fmtNum(sobra)} kg).`) : null,
    ].filter(Boolean));
  };
  total.addEventListener('input', calcular);
  desenharBarras();
  calcular();

  const fechar = () => { dlg.close(); dlg.remove(); };
  const dlg = el('dialog', { className: 'dialogo calc' },
    el('div', { className: 'calc-conteudo' },
      el('div', { className: 'dialogo-topo' }, el('div', { className: 'dialogo-icone' }, icone('calculadora', 20)),
        el('div', {}, el('h2', {}, 'Calculadora de anilhas'), el('p', {}, 'Anilhas de 25, 20, 15, 10, 5, 2,5 e 1,25 kg.'))),
      campo('Peso total (kg)', total),
      barras,
      resultado,
      el('button', { type: 'button', className: 'botao secundario largo', onclick: fechar }, 'Fechar')));
  dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
  dlg.addEventListener('click', (ev) => { if (ev.target === dlg) fechar(); });
  document.body.append(dlg);
  dlg.showModal();
}

function renderSessao() {
  const s = dados.emAndamento;
  sessaoEl.replaceChildren(
    el('header', { className: 'sessao-topo' },
      el('button', { className: 'botao fantasma icone', 'aria-label': 'Minimizar treino', title: 'Minimizar', onclick: fecharSessao }, icone('desce', 22)),
      el('div', { className: 'sessao-titulo' }, el('strong', {}, s.diaNome), el('small', { className: 'num', id: 'sessaoRelogio' })),
      el('button', { className: 'botao fantasma icone', 'aria-label': 'Calculadora de anilhas', title: 'Calculadora de anilhas', onclick: abrirCalculadora }, icone('calculadora', 20)),
      el('button', { className: 'botao primario pequeno', onclick: concluirTreino }, 'Concluir')),
    el('div', { className: 'sessao-progresso', role: 'progressbar', id: 'sessaoProgresso' }, el('span')),
    el('div', { className: 'sessao-lista' }, s.exercicios.map((_, i) => cartaoExercicioSessao(i))),
    el('div', { className: 'sessao-rodape' },
      el('p', { className: 'mudo dica-sessao' }, 'Toque no número de uma série para marcá-la como aquecimento: ela não conta no volume nem nos recordes.'),
      el('button', { className: 'botao fantasma largo perigo-texto', onclick: cancelarTreino }, icone('trash', 16), 'Descartar treino')));
  atualizarProgresso();
  atualizarRelogio();
}

function cartaoExercicioSessao(i) {
  const e = dados.emAndamento.exercicios[i];
  const ultima = ultimaVez(e.nome);
  const validas = trabalho(e.series).length;
  const nota = notaDe(e.nome);
  const g = guiaDe(e.nome);
  const mudou = () => { salvar(); trocarCartao(i); atualizarProgresso(); };
  const adicionarSerie = () => { e.series.push({ peso: '', reps: '', feito: false }); mudou(); };
  // Aquecimento entra antes das séries válidas
  const adicionarAquecimento = () => { e.series.splice(e.series.filter((s) => s.aq).length, 0, { peso: '', reps: '', feito: false, aq: true }); mudou(); };
  const removerSerie = () => { e.series.pop(); mudou(); };
  const editarNota = async () => {
    const t = await pedirTexto({ titulo: 'Nota do exercício', mensagem: 'Aparece sempre que este exercício vier no treino. Ex.: banco na posição 4, pegada fechada.', valor: nota, max: 200 });
    if (t === null) return;
    salvarNota(e.nome, t);
    salvar();
    trocarCartao(i);
  };

  return el('article', { className: 'cartao ex-sessao', dataset: { i } },
    el('div', { className: 'ex-topo' },
      g ? el('button', { className: 'ex-miniatura', 'aria-label': `Como fazer ${e.nome}`, onclick: () => abrirGuia(e.nome) },
        el('img', { src: foto(g, 1), alt: '', loading: 'lazy' }), el('span', {}, icone('info', 12))) : null,
      el('div', { className: 'ex-titulo' },
        el('h2', {}, e.nome),
        el('p', { className: 'mudo num' }, `${validas} × ${e.reps} · descanso ${fmtSeg(e.descanso)}`),
        e.original ? el('p', { className: 'ex-trocado' }, icone('trocar', 12), `Só hoje, no lugar de ${e.original}`) : null),
      g ? null : botaoGuia(e.nome),
      botaoIcone('trocar', 'Trocar exercício só hoje', () => trocarExercicio(i))),
    nota ? el('div', { className: 'ex-nota' },
      el('button', { className: 'ex-nota-texto', onclick: editarNota, 'aria-label': `Editar nota: ${nota}` }, icone('nota', 14), el('span', {}, nota)),
      botaoIcone('x', 'Apagar nota', () => { salvarNota(e.nome, ''); salvar(); trocarCartao(i); })) : null,
    ultima && podeSubir(ultima.series, e.reps, validas) ? el('span', { className: 'selo acento ex-subir' }, icone('setaCima', 12), 'Suba a carga') : null,
    ultima ? el('p', { className: 'ex-ultima num' }, el('span', { className: 'mudo' }, `Última vez (${fmtDataCurta(ultima.data)}): `), ultima.series.map(fmtSerie).join(' · ')) : null,
    el('div', { className: 'series' },
      el('div', { className: 'serie cabeca', 'aria-hidden': 'true' }, el('span', {}, 'Série'), el('span', {}, 'kg'), el('span', {}, 'Reps'), el('span')),
      e.series.map((_, j) => linhaSerie(i, j, ultima))),
    el('div', { className: 'ex-acoes' },
      el('button', { className: 'botao fantasma pequeno', onclick: adicionarSerie }, icone('plus', 16), 'Série'),
      el('button', { className: 'botao fantasma pequeno', onclick: adicionarAquecimento }, icone('fogo', 16), 'Aquecimento'),
      nota ? null : el('button', { className: 'botao fantasma pequeno', onclick: editarNota }, icone('nota', 16), 'Nota'),
      e.series.length > 1 ? el('button', { className: 'botao fantasma pequeno', onclick: removerSerie }, icone('x', 16), 'Tirar a última') : null));
}

// Troca o exercício só no treino de hoje (máquina ocupada): a ficha continua igual.
async function trocarExercicio(i) {
  const e = dados.emAndamento.exercicios[i];
  const novo = await dialogoTrocar(e.original || e.nome, e.nome);
  if (!novo || mesmoExercicio(novo, e.nome)) return;
  if (e.series.some((s) => s.feito)) {
    const ok = await confirmar({ titulo: 'Trocar o exercício?', mensagem: 'As séries já marcadas deste exercício serão apagadas.', textoOk: 'Trocar' });
    if (!ok) return;
  }
  const original = e.original || e.nome;
  e.nome = novo;
  if (mesmoExercicio(novo, original)) delete e.original;
  else e.original = original;
  e.series = e.series.map((s) => ({ peso: '', reps: '', feito: false, ...(s.aq && { aq: true }) }));
  salvar();
  trocarCartao(i);
  atualizarProgresso();
}

// Lista de substitutos: mesmo grupo muscular primeiro; a busca procura em todos. Devolve o nome ou null.
function dialogoTrocar(original, atual) {
  return new Promise((resolve) => {
    const grupo = guiaDe(original)?.grupo;
    let terminou = false;
    const terminar = (r) => { if (terminou) return; terminou = true; resolve(r); dlg.close(); dlg.remove(); };
    const lista = el('div', { className: 'trocar-lista' });
    const busca = el('input', { type: 'search', placeholder: 'Buscar outro exercício', autocomplete: 'off', 'aria-label': 'Buscar exercício' });
    const item = (nome, detalhe, img) => el('button', { type: 'button', className: 'trocar-item', onclick: () => terminar(nome) },
      img ? el('img', { src: img, alt: '', loading: 'lazy' }) : el('span', { className: 'trocar-sem-foto' }, icone('haltere', 18)),
      el('span', {}, el('strong', {}, nome), detalhe ? el('small', { className: 'mudo' }, detalhe) : null));
    const desenhar = () => {
      const termo = semAcento(busca.value);
      const candidatos = Object.values(GUIA).filter((g) => !mesmoExercicio(g.nome, atual) &&
        (termo ? semAcento(`${g.nome} ${g.principais}`).includes(termo) : g.grupo === grupo));
      const itens = [];
      if (!mesmoExercicio(original, atual)) itens.push(item(original, 'Voltar ao exercício da ficha', guiaDe(original) && foto(guiaDe(original), 1)));
      candidatos.forEach((g) => itens.push(item(g.nome, g.principais, foto(g, 1))));
      if (termo && !candidatos.some((g) => semAcento(g.nome) === termo)) itens.push(item(busca.value.trim(), 'Usar este nome', null));
      if (!itens.length) itens.push(el('p', { className: 'mudo' }, 'Digite o nome do exercício que vai fazer.'));
      lista.replaceChildren(...itens);
    };
    busca.addEventListener('input', desenhar);
    desenhar();
    const dlg = el('dialog', { className: 'dialogo trocar' },
      el('div', { className: 'trocar-conteudo' },
        el('div', { className: 'dialogo-topo' }, el('div', { className: 'dialogo-icone' }, icone('trocar', 20)),
          // autofocus no título: no iPhone, focar a busca abriria o teclado por cima da lista
          el('div', {}, el('h2', { tabIndex: -1, autofocus: true }, 'Trocar só hoje'), el('p', {}, grupo ? `Opções de ${grupo.toLowerCase()} no lugar de ${original}. A ficha não muda.` : 'A ficha não muda.'))),
        el('div', { className: 'entrada' }, icone('search', 18), busca),
        lista,
        el('button', { type: 'button', className: 'botao secundario largo', onclick: () => terminar(null) }, 'Cancelar')));
    dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); terminar(null); });
    document.body.append(dlg);
    dlg.showModal();
  });
}

// Troca só o cartão do exercício: redesenhar a tela inteira faria a rolagem voltar ao topo.
function trocarCartao(i) {
  sessaoEl.querySelector(`.ex-sessao[data-i="${i}"]`).replaceWith(cartaoExercicioSessao(i));
}

// Valor sugerido (aparece apagado no campo): carga da série anterior de hoje (do mesmo tipo:
// aquecimento puxa de aquecimento), senão o que foi feito na última vez; reps da última vez ou o topo da faixa.
function sugestao(e, j, ultima) {
  const sr = e.series[j];
  const ant = e.series.slice(0, j).reverse().find((x) => x.peso !== '' && !x.aq === !sr.aq);
  const k = trabalho(e.series.slice(0, j)).length; // posição entre as séries válidas
  const u = ultima && !sr.aq ? (ultima.series[k] || ultima.series[ultima.series.length - 1]) : null;
  const peso = ant ? ant.peso : (u && u.peso != null ? fmtNum(u.peso) : '');
  const reps = u ? String(u.reps) : sr.aq ? '' : String(topoFaixa(e.reps) ?? '');
  return { peso, reps };
}

function linhaSerie(i, j, ultima) {
  const e = dados.emAndamento.exercicios[i];
  const sr = e.series[j];
  const ref = sugestao(e, j, ultima);
  const n = sr.aq ? 'A' : trabalho(e.series.slice(0, j + 1)).length;
  const nome = sr.aq ? 'aquecimento' : `série ${n}`;
  const peso = el('input', { type: 'text', inputMode: 'decimal', className: 'num', value: sr.peso, placeholder: ref.peso || '–', autocomplete: 'off', 'aria-label': `Carga da ${nome} em kg` });
  const reps = el('input', { type: 'text', inputMode: 'numeric', className: 'num', value: sr.reps, placeholder: ref.reps || '–', autocomplete: 'off', 'aria-label': `Repetições da ${nome}` });
  peso.addEventListener('input', () => { sr.peso = peso.value.trim(); salvar(); });
  peso.addEventListener('focus', () => { ultimoPesoTocado = peso.value || peso.placeholder; });
  reps.addEventListener('input', () => { sr.reps = reps.value.trim(); salvar(); });
  // Tocar no número alterna entre série válida e aquecimento
  const alternarAq = () => {
    if (sr.aq) delete sr.aq; else sr.aq = true;
    salvar();
    trocarCartao(i);
  };
  return el('div', { className: `serie${sr.feito ? ' feita' : ''}${sr.aq ? ' aquecimento' : ''}` },
    el('button', { className: 'serie-n num', onclick: alternarAq, title: 'Tocar: alterna aquecimento', 'aria-label': sr.aq ? 'Aquecimento. Tocar para virar série válida' : `Série ${n}. Tocar para marcar como aquecimento` }, n),
    peso, reps,
    el('button', { className: 'marcar', 'aria-pressed': String(sr.feito), 'aria-label': `${nome} feita`, onclick: () => marcar(i, j) }, icone('check', 20)));
}

function marcar(i, j) {
  const s = dados.emAndamento;
  const e = s.exercicios[i];
  const sr = e.series[j];
  destravarSom();
  if (sr.feito) {
    sr.feito = false;
  } else {
    // Campo vazio = "fiz o sugerido": copia o valor apagado para dentro do campo.
    const ref = sugestao(e, j, ultimaVez(e.nome));
    if (sr.peso === '') sr.peso = ref.peso;
    if (sr.reps === '') sr.reps = ref.reps;
    if (lerNum(sr.reps) === null) { toast('Preencha as repetições', 'info'); return; }
    if (sr.peso !== '' && lerNum(sr.peso) === null) { toast('Carga inválida', 'erro'); return; }
    sr.feito = true;
    const faltam = s.exercicios.some((x) => x.series.some((y) => !y.feito));
    if (faltam) iniciarDescanso(sr.aq ? Math.min(e.descanso, 60) : e.descanso); // aquecimento: descanso curto
    else { pararDescanso(); toast('Todas as séries feitas! Toque em Concluir.'); }
  }
  salvar();
  trocarCartao(i);
  atualizarProgresso();
}

function atualizarProgresso() {
  const s = dados.emAndamento;
  const barra = document.getElementById('sessaoProgresso');
  if (!s || !barra) return;
  const total = s.exercicios.reduce((t, e) => t + e.series.length, 0);
  const feitas = s.exercicios.reduce((t, e) => t + e.series.filter((x) => x.feito).length, 0);
  barra.firstChild.style.width = `${total ? (feitas / total) * 100 : 0}%`;
  barra.setAttribute('aria-valuenow', feitas);
  barra.setAttribute('aria-valuemax', total);
  barra.setAttribute('aria-label', `${feitas} de ${total} séries`);
}

function atualizarRelogio() {
  const r = document.getElementById('sessaoRelogio');
  if (!r || !dados.emAndamento) return;
  r.textContent = fmtSeg((Date.now() - dados.emAndamento.inicio) / 1000);
}

async function concluirTreino() {
  const s = dados.emAndamento;
  const total = s.exercicios.reduce((t, e) => t + e.series.length, 0);
  const feitas = s.exercicios.reduce((t, e) => t + e.series.filter((x) => x.feito).length, 0);
  if (feitas === 0) {
    const ok = await confirmar({ titulo: 'Nenhuma série marcada', mensagem: 'Descartar este treino?', perigoso: true, textoOk: 'Descartar' });
    if (ok) encerrar();
    return;
  }
  if (feitas < total) {
    const ok = await confirmar({ titulo: 'Concluir o treino?', mensagem: `Você marcou ${feitas} de ${total} séries. As que não foram marcadas não ficam salvas.`, textoOk: 'Concluir' });
    if (!ok) return;
  }
  const registro = {
    id: s.id, programaId: s.programaId, diaId: s.diaId, diaNome: s.diaNome, inicio: s.inicio, fim: Date.now(),
    exercicios: s.exercicios
      .map((e) => ({
        nome: e.nome,
        ...(e.original && { original: e.original }),
        series: e.series.filter((x) => x.feito).map((x) => ({ peso: lerNum(x.peso), reps: lerNum(x.reps), ...(x.aq && { aq: true }) })),
      }))
      .filter((e) => e.series.length),
  };
  const recordes = novosRecordes(registro);
  dados.sessoes.push(registro);
  encerrar();
  mostrarResumo(registro, recordes);
}

// Compara cada exercício do treino com o melhor já feito antes. A primeira vez não conta como recorde.
function novosRecordes(registro) {
  const lista = [];
  for (const e of registro.exercicios) {
    const nova = melhorMarca(e.series);
    if (!nova) continue;
    let antiga = null;
    for (const s of dados.sessoes) {
      const x = s.exercicios.find((y) => mesmoExercicio(y.nome, e.nome));
      const m = x && melhorMarca(x.series);
      if (m && (!antiga || superou(m, antiga))) antiga = m;
    }
    if (antiga && superou(nova, antiga)) lista.push({ nome: e.nome, nova, antiga });
  }
  return lista;
}

function mostrarResumo(registro, recordes) {
  const vol = volume(registro);
  const fechar = () => { dlg.close(); dlg.remove(); };
  const dlg = el('dialog', { className: 'dialogo resumo' },
    el('div', { className: 'resumo-conteudo' },
      el('div', { className: 'resumo-topo' },
        el('div', { className: 'resumo-icone' }, icone(recordes.length ? 'trofeu' : 'check', 28)),
        el('h2', {}, recordes.length ? (recordes.length === 1 ? 'Novo recorde!' : `${recordes.length} novos recordes!`) : 'Treino concluído!'),
        el('p', { className: 'mudo' }, registro.diaNome)),
      el('div', { className: 'numeros' },
        numero('Duração', fmtDuracao(registro.fim - registro.inicio)),
        numero('Séries', String(totalSeries(registro))),
        numero('Volume', vol ? `${fmtNum(vol)} kg` : '–')),
      recordes.length ? el('ul', { className: 'lista-recordes' }, recordes.map((r) => el('li', {},
        icone('trofeu', 18),
        el('span', {}, el('strong', {}, r.nome), el('small', { className: 'mudo num' }, `${fmtMarca(r.nova)} · antes ${fmtMarca(r.antiga)}`))))) : null,
      el('button', { className: 'botao primario largo', onclick: fechar }, 'Fechar')));
  dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
  document.body.append(dlg);
  dlg.showModal();
}

async function cancelarTreino() {
  const ok = await confirmar({ titulo: 'Descartar o treino?', mensagem: 'As séries marcadas hoje serão perdidas.', perigoso: true, textoOk: 'Descartar' });
  if (ok) encerrar();
}

function encerrar() {
  dados.emAndamento = null;
  salvar();
  pararDescanso();
  tela = 'hoje';
  fecharSessao();
  window.scrollTo(0, 0);
}

// ------------------------------------------------------------------
// Cronômetro de descanso
// Guarda a HORA em que o descanso acaba (não um contador): no celular os timers
// param com o app em segundo plano, e ao voltar o tempo restante continua certo.
// ------------------------------------------------------------------
const descansoEl = document.getElementById('descanso');
const descansoTempo = document.getElementById('descansoTempo');
const descansoProgresso = document.getElementById('descansoProgresso');

function iniciarDescanso(segundos) {
  dados.emAndamento.timer = { fim: Date.now() + segundos * 1000, total: segundos, avisado: false };
  salvar();
  tickDescanso();
}

function pararDescanso() {
  if (dados.emAndamento) { dados.emAndamento.timer = null; salvar(); }
  descansoEl.hidden = true;
}

function ajustarDescanso(seg) {
  const t = dados.emAndamento?.timer;
  if (!t) return;
  t.fim = Math.max(Date.now() + 1000, t.fim + seg * 1000);
  t.total = Math.max(t.total, (t.fim - Date.now()) / 1000);
  t.avisado = false;
  salvar();
  tickDescanso();
}

function tickDescanso() {
  const t = dados.emAndamento?.timer;
  if (!t) { descansoEl.hidden = true; return; }
  const resta = (t.fim - Date.now()) / 1000;
  if (resta <= 0) {
    if (resta < -6) { pararDescanso(); return; } // some sozinho alguns segundos depois
    if (!t.avisado) { t.avisado = true; salvar(); tocarFim(); }
    descansoEl.classList.add('acabou');
    descansoTempo.textContent = 'Bora!';
    descansoProgresso.style.width = '0%';
  } else {
    descansoEl.classList.remove('acabou');
    descansoTempo.textContent = fmtSeg(resta);
    descansoProgresso.style.width = `${(resta / t.total) * 100}%`;
  }
  descansoEl.hidden = false;
}

document.getElementById('descansoMenos').addEventListener('click', () => ajustarDescanso(-15));
document.getElementById('descansoMais').addEventListener('click', () => ajustarDescanso(15));
document.getElementById('descansoPular').addEventListener('click', pararDescanso);

setInterval(() => { tickDescanso(); atualizarRelogio(); }, 250);

// Som: o navegador só libera áudio depois de um toque do usuário, então o
// AudioContext é criado/retomado nos cliques (começar treino, marcar série).
let audio = null;
function destravarSom() {
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
  } catch {}
}
function tocarFim() {
  navigator.vibrate?.([200, 100, 200]);
  if (!dados.config.som || !audio) return;
  const agora = audio.currentTime;
  [0, 0.22, 0.44].forEach((t, k) => {
    const osc = audio.createOscillator();
    const ganho = audio.createGain();
    osc.frequency.value = k === 2 ? 1320 : 880;
    ganho.gain.setValueAtTime(0.0001, agora + t);
    ganho.gain.exponentialRampToValueAtTime(0.4, agora + t + 0.02);
    ganho.gain.exponentialRampToValueAtTime(0.0001, agora + t + 0.18);
    osc.connect(ganho).connect(audio.destination);
    osc.start(agora + t);
    osc.stop(agora + t + 0.2);
  });
}

// ------------------------------------------------------------------
// Tela: Evolução (gráfico + histórico)
// ------------------------------------------------------------------
let exGrafico = null;
let metrica = 'carga';
let limiteHistorico = 15;

// Um ponto por treino: carga máxima ou 1RM estimado (fórmula de Epley: peso × (1 + reps/30)).
// Exercício sem carga (barra fixa, prancha) usa o máximo de repetições.
function pontosExercicio(nome) {
  const pontos = [];
  for (const s of dados.sessoes) {
    const e = s.exercicios.find((x) => mesmoExercicio(x.nome, nome));
    const m = e && melhorMarca(e.series);
    if (!m) continue;
    const detalhe = trabalho(e.series).map(fmtSerie).join(' · ');
    if (m.tipo === 'kg') pontos.push({ data: s.inicio, valor: metrica === 'carga' ? m.peso : Math.round(m.rm * 10) / 10, unidade: 'kg', detalhe });
    else pontos.push({ data: s.inicio, valor: m.reps, unidade: 'reps', detalhe });
  }
  return pontos;
}

let abaEvolucao = 'cargas';

function telaHistorico() {
  const abas = segmentado([['cargas', 'Cargas'], ['recordes', 'Recordes'], ['corpo', 'Corpo'], ['mes', 'Mês']], abaEvolucao, (v) => { abaEvolucao = v; render(); window.scrollTo(0, 0); });
  abas.classList.add('largo');
  if (abaEvolucao === 'corpo') return [abas, telaCorpo()];
  if (!dados.sessoes.length) {
    return [abas, el('section', { className: 'cartao' }, vazio('grafico', 'Nada por aqui ainda', 'Conclua o primeiro treino para ver a evolução, os recordes e o resumo do mês.'))];
  }
  if (abaEvolucao === 'recordes') return [abas, telaRecordes()];
  if (abaEvolucao === 'mes') return [abas, telaMes()];
  return [abas, telaCargas()];
}

function telaCargas() {
  // Exercícios do mais recente para o mais antigo
  const nomes = [];
  for (let i = dados.sessoes.length - 1; i >= 0; i--) {
    dados.sessoes[i].exercicios.forEach((e) => { if (!nomes.includes(e.nome)) nomes.push(e.nome); });
  }
  if (!nomes.includes(exGrafico)) exGrafico = nomes[0];
  const pontos = pontosExercicio(exGrafico);
  const unidade = pontos[0]?.unidade || 'kg';
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const recorde = Math.max(...pontos.map((p) => p.valor));
  const variacao = ultimo.valor - primeiro.valor;

  const seletor = el('select', { onchange: (ev) => { exGrafico = ev.target.value; render(); } },
    nomes.map((n) => el('option', { value: n, selected: n === exGrafico }, n)));

  const cartaoGrafico = el('section', { className: 'cartao grafico-cartao' },
    el('h2', {}, 'Evolução por exercício'),
    el('div', { className: 'entrada' }, seletor),
    unidade === 'kg' ? segmentado([['carga', 'Carga máxima'], ['1rm', '1RM estimado']], metrica, (v) => { metrica = v; render(); }) : null,
    el('div', { className: 'numeros' },
      numero('Recorde', `${fmtNum(recorde)} ${unidade}`),
      numero('Último', `${fmtNum(ultimo.valor)} ${unidade}`),
      numero('Desde o início', `${variacao > 0 ? '+' : ''}${fmtNum(variacao)} ${unidade}`)),
    graficoLinha(pontos, unidade, `Evolução de ${exGrafico}`),
    pontos.length < 2 ? el('p', { className: 'mudo nota' }, 'Faça este exercício mais vezes para ver a linha de evolução.') : null,
    metrica === '1rm' && unidade === 'kg' ? el('p', { className: 'mudo nota' }, '1RM estimado: a carga que você levantaria uma única vez, calculada pela melhor série do dia.') : null,
    el('details', { className: 'tabela-dados' },
      el('summary', {}, 'Ver em tabela'),
      el('table', {},
        el('thead', {}, el('tr', {}, el('th', {}, 'Data'), el('th', {}, metrica === 'carga' || unidade !== 'kg' ? 'Máximo' : '1RM'), el('th', {}, 'Séries'))),
        el('tbody', {}, pontos.slice().reverse().map((p) => el('tr', {}, el('td', { className: 'num' }, fmtDataCurta(p.data)), el('td', { className: 'num' }, `${fmtNum(p.valor)} ${p.unidade}`), el('td', { className: 'num mudo' }, p.detalhe)))))));

  const sessoes = dados.sessoes.slice().reverse();
  const lista = sessoes.slice(0, limiteHistorico).map((s) => {
    const vol = volume(s);
    return el('details', { className: 'cartao sessao-hist' },
      el('summary', {},
        el('span', {}, el('strong', {}, s.diaNome), el('small', { className: 'mudo num' }, `${fmtData(s.inicio)} · ${fmtDuracao(s.fim - s.inicio)} · ${totalSeries(s)} séries${vol ? ` · ${fmtNum(vol)} kg` : ''}`)),
        icone('desce', 18)),
      el('ul', { className: 'hist-ex' }, s.exercicios.map((e) => el('li', {},
        el('span', {}, e.nome, e.original ? el('small', { className: 'mudo' }, ` (no lugar de ${e.original})`) : null),
        el('span', { className: 'mudo num' }, e.series.map(fmtSerie).join(' · '))))),
      el('button', {
        className: 'botao fantasma pequeno perigo-texto',
        onclick: async () => {
          const ok = await confirmar({ titulo: 'Excluir este treino do histórico?', mensagem: `${s.diaNome}, ${fmtData(s.inicio)}`, perigoso: true, textoOk: 'Excluir' });
          if (ok) { dados.sessoes = dados.sessoes.filter((x) => x.id !== s.id); salvar(); render(); }
        },
      }, icone('trash', 16), 'Excluir registro'));
  });

  return [
    cartaoGrafico,
    el('h2', { className: 'secao' }, 'Histórico'),
    el('div', { className: 'pilha' }, lista),
    sessoes.length > limiteHistorico ? el('button', { className: 'botao secundario largo mais', onclick: () => { limiteHistorico += 15; render(); } }, 'Mostrar mais') : null,
  ];
}

const numero = (rotulo, valor) => el('div', {}, el('small', {}, rotulo), el('strong', { className: 'num' }, valor));

// ------------------------------------------------------------------
// Recordes pessoais: a melhor marca de cada exercício e quando foi feita
// ------------------------------------------------------------------
function telaRecordes() {
  const melhores = new Map(); // chave sem acento → { nome, marca, data }
  for (const s of dados.sessoes) {
    for (const e of s.exercicios) {
      const m = melhorMarca(e.series);
      if (!m) continue;
      const chave = semAcento(e.nome);
      const atual = melhores.get(chave);
      if (!atual || superou(m, atual.marca)) melhores.set(chave, { nome: e.nome, marca: m, data: s.inicio });
    }
  }
  const lista = [...melhores.values()].sort((a, b) => b.data - a.data);
  const recente = Date.now() - 7 * DIA_MS;
  return [
    el('p', { className: 'mudo editor-desc' }, 'Sua melhor série em cada exercício (carga mais alta; empate decide pelas repetições). Os mais recentes aparecem primeiro.'),
    el('div', { className: 'pilha lista-guia' }, lista.map((r) => {
      const g = guiaDe(r.nome);
      return el('button', { className: 'cartao item-guia recorde', onclick: () => { exGrafico = r.nome; abaEvolucao = 'cargas'; render(); window.scrollTo(0, 0); } },
        g ? el('img', { src: foto(g, 1), alt: '', loading: 'lazy', width: 72, height: 48 }) : el('span', { className: 'trocar-sem-foto' }, icone('trofeu', 18)),
        el('span', {},
          el('strong', {}, r.nome),
          el('small', { className: 'num' }, fmtMarca(r.marca), r.marca.tipo === 'kg' ? el('span', { className: 'mudo' }, ` · 1RM est. ${fmtNum(Math.round(r.marca.rm))} kg`) : null),
          el('small', { className: 'mudo num' }, fmtData(r.data))),
        r.data >= recente ? el('span', { className: 'selo acento' }, 'Novo') : icone('direita', 18));
    })),
  ];
}

// ------------------------------------------------------------------
// Corpo: peso e medidas
// ------------------------------------------------------------------
const MEDIDAS = [['peso', 'Peso', 'kg'], ['cintura', 'Cintura', 'cm'], ['peito', 'Peito', 'cm'], ['braco', 'Braço', 'cm'], ['coxa', 'Coxa', 'cm']];
let medidaGrafico = 'peso';

function telaCorpo() {
  const registros = dados.corpo.slice().sort((a, b) => a.data - b.data);
  const comDados = MEDIDAS.filter(([k]) => registros.some((r) => r[k] != null));
  if (!comDados.some(([k]) => k === medidaGrafico) && comDados.length) medidaGrafico = comDados[0][0];
  const [, nomeMedida, unidade] = MEDIDAS.find(([k]) => k === medidaGrafico);
  const pontos = registros.filter((r) => r[medidaGrafico] != null).map((r) => ({ data: r.data, valor: r[medidaGrafico], unidade, detalhe: '' }));

  const botaoNovo = el('button', { className: 'botao primario largo', onclick: () => registrarCorpo() }, icone('plus', 18), 'Registrar peso e medidas');
  if (!pontos.length) {
    return [botaoNovo, el('section', { className: 'cartao' }, vazio('atividade', 'Nenhuma medida ainda', 'Registre seu peso (e, se quiser, cintura, braço...) uma vez por semana, de manhã, para acompanhar a evolução.'))];
  }
  const primeiro = pontos[0];
  const ultimo = pontos[pontos.length - 1];
  const variacao = Math.round((ultimo.valor - primeiro.valor) * 10) / 10;

  return [
    botaoNovo,
    el('section', { className: 'cartao grafico-cartao' },
      el('h2', {}, nomeMedida),
      comDados.length > 1 ? el('div', { className: 'filtro-grupos' }, comDados.map(([k, n]) =>
        el('button', { role: 'tab', 'aria-selected': String(k === medidaGrafico), onclick: () => { medidaGrafico = k; render(); } }, n))) : null,
      el('div', { className: 'numeros' },
        numero('Atual', `${fmtNum(ultimo.valor)} ${unidade}`),
        numero('Desde o início', `${variacao > 0 ? '+' : ''}${fmtNum(variacao)} ${unidade}`),
        numero('Registros', String(pontos.length))),
      graficoLinha(pontos, unidade, nomeMedida),
      pontos.length < 2 ? el('p', { className: 'mudo nota' }, 'Registre de novo nos próximos dias para ver a linha de evolução.') : null),
    el('h2', { className: 'secao' }, 'Registros'),
    el('div', { className: 'pilha' }, registros.slice().reverse().map((r) => el('section', { className: 'cartao registro-corpo' },
      el('span', {},
        el('strong', { className: 'num' }, fmtData(r.data)),
        el('small', { className: 'mudo num' }, MEDIDAS.filter(([k]) => r[k] != null).map(([k, n, u]) => `${n} ${fmtNum(r[k])} ${u}`).join(' · '))),
      botaoIcone('pencil', 'Editar registro', () => registrarCorpo(r)),
      botaoIcone('trash', 'Excluir registro', async () => {
        const ok = await confirmar({ titulo: 'Excluir este registro?', mensagem: fmtData(r.data), perigoso: true, textoOk: 'Excluir' });
        if (ok) { dados.corpo = dados.corpo.filter((x) => x.id !== r.id); salvar(); render(); }
      })))),
  ];
}

// Data local no formato do <input type="date"> (yyyy-mm-dd)
const dataInput = (ts) => { const d = new Date(ts); return `${d.getFullYear()}-${doisDig(d.getMonth() + 1)}-${doisDig(d.getDate())}`; };

function registrarCorpo(atual) {
  const ultimo = dados.corpo.slice().sort((a, b) => b.data - a.data)[0];
  const data = el('input', { type: 'date', value: dataInput(atual?.data ?? Date.now()), required: true });
  const entradas = Object.fromEntries(MEDIDAS.map(([k]) => [k, el('input', {
    type: 'text', inputMode: 'decimal', autocomplete: 'off', value: atual?.[k] != null ? fmtNum(atual[k]) : '',
    placeholder: ultimo?.[k] != null ? fmtNum(ultimo[k]) : '–',
  })]));
  let terminou = false;
  const fechar = () => { if (terminou) return; terminou = true; dlg.close(); dlg.remove(); };
  const form = el('form', {
    onsubmit: (ev) => {
      ev.preventDefault();
      const valores = {};
      for (const [k] of MEDIDAS) {
        const n = lerNum(entradas[k].value);
        if (entradas[k].value.trim() && (n === null || n <= 0)) { toast('Confira os números', 'erro'); return; }
        if (n !== null) valores[k] = n;
      }
      if (!Object.keys(valores).length) { toast('Preencha pelo menos uma medida', 'info'); return; }
      const [a, m, d] = data.value.split('-').map(Number);
      const quando = new Date(a, m - 1, d, 12).getTime(); // meio-dia: evita pular de dia por fuso
      if (atual) {
        MEDIDAS.forEach(([k]) => delete atual[k]);
        Object.assign(atual, valores, { data: quando });
      } else {
        dados.corpo.push({ id: novoId(), data: quando, ...valores });
      }
      salvar();
      fechar();
      render();
      toast('Medidas salvas');
    },
  },
    el('div', { className: 'dialogo-topo' }, el('div', { className: 'dialogo-icone' }, icone('atividade', 20)),
      el('div', {}, el('h2', { tabIndex: -1, autofocus: true }, atual ? 'Editar medidas' : 'Peso e medidas'), el('p', {}, 'Preencha só o que quiser acompanhar. As medidas são em centímetros.'))),
    campo('Data', data),
    el('div', { className: 'grade-2' }, MEDIDAS.map(([k, n, u]) => campo(`${n} (${u})`, entradas[k]))),
    el('div', { className: 'dialogo-botoes' },
      el('button', { type: 'button', className: 'botao secundario', onclick: fechar }, 'Cancelar'),
      el('button', { type: 'submit', className: 'botao primario' }, 'Salvar')));
  const dlg = el('dialog', { className: 'dialogo' }, form);
  dlg.addEventListener('cancel', (ev) => { ev.preventDefault(); fechar(); });
  document.body.append(dlg);
  dlg.showModal();
}

// ------------------------------------------------------------------
// Resumo do mês: totais, comparação com o mês anterior e séries por grupo muscular
// ------------------------------------------------------------------
let mesDeslocamento = 0; // 0 = mês atual, 1 = anterior...

// ateDia: corta o mês nesse dia (para comparar o mês em andamento com o mesmo período do anterior)
function totaisDoMes(ano, mes, ateDia) {
  const ini = new Date(ano, mes, 1).getTime();
  const fimMes = new Date(ano, mes + 1, 1).getTime();
  const fim = ateDia ? Math.min(fimMes, new Date(ano, mes, ateDia + 1).getTime()) : fimMes;
  const sessoes = dados.sessoes.filter((s) => s.inicio >= ini && s.inicio < fim);
  return {
    sessoes,
    treinos: sessoes.length,
    tempo: sessoes.reduce((t, s) => t + (s.fim - s.inicio), 0),
    series: sessoes.reduce((t, s) => t + totalSeries(s), 0),
    volume: sessoes.reduce((t, s) => t + volume(s), 0),
  };
}

function telaMes() {
  const ref = new Date();
  ref.setDate(1);
  ref.setMonth(ref.getMonth() - mesDeslocamento);
  const atual = totaisDoMes(ref.getFullYear(), ref.getMonth());
  const emAndamento = mesDeslocamento === 0;
  const anterior = totaisDoMes(ref.getFullYear(), ref.getMonth() - 1, emAndamento ? new Date().getDate() : null);
  const nomeMes = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const nomeAnterior = new Date(ref.getFullYear(), ref.getMonth() - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
  const primeiroTreino = dados.sessoes.reduce((m, s) => Math.min(m, s.inicio), Infinity);
  const temAnterior = new Date(ref.getFullYear(), ref.getMonth(), 1).getTime() > primeiroTreino;

  // Séries válidas por grupo (exercício sem guia entra em "Outros")
  const porGrupo = new Map(GRUPOS.map((g) => [g, 0]));
  for (const s of atual.sessoes) {
    for (const e of s.exercicios) {
      const g = guiaDe(e.nome)?.grupo || 'Outros';
      porGrupo.set(g, (porGrupo.get(g) || 0) + trabalho(e.series).length);
    }
  }
  const grupos = [...porGrupo].sort((a, b) => b[1] - a[1]);
  const maior = Math.max(1, grupos[0][1]);
  const diferenca = atual.treinos - anterior.treinos;
  const periodo = emAndamento ? `no mesmo período de ${nomeAnterior} (até o dia ${new Date().getDate()})` : `em ${nomeAnterior}`;
  const comparacao = !anterior.treinos ? null
    : diferenca === 0 ? `Mesmo número de treinos que ${periodo}.`
    : `${plural(Math.abs(diferenca), 'treino', 'treinos')} a ${diferenca > 0 ? 'mais' : 'menos'} que ${periodo}.`;

  return [
    el('div', { className: 'mes-nav' },
      botaoIcone('esquerda', 'Mês anterior', () => { mesDeslocamento++; render(); }, !temAnterior),
      el('h2', {}, nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1)),
      botaoIcone('direita', 'Próximo mês', () => { mesDeslocamento--; render(); }, mesDeslocamento === 0)),
    el('section', { className: 'cartao' },
      el('div', { className: 'numeros numeros-4' },
        numero('Treinos', String(atual.treinos)),
        numero('Tempo', atual.tempo ? fmtDuracao(atual.tempo) : '–'),
        numero('Séries', String(atual.series)),
        numero('Volume', atual.volume ? `${fmtNum(Math.round(atual.volume / 100) / 10)} t` : '–')),
      comparacao ? el('p', { className: 'mudo nota mes-comparacao' }, comparacao) : null),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Séries por grupo muscular'),
      atual.series ? el('p', { className: 'mudo nota' }, `Mais treinado: ${grupos[0][0]}. Menos treinado: ${grupos.filter(([g]) => g !== 'Outros').at(-1)[0]}.`) : null,
      el('ul', { className: 'barras' }, grupos.filter(([g, n]) => g !== 'Outros' || n > 0).map(([g, n]) => el('li', {},
        el('span', { className: 'barra-rotulo' }, g),
        el('span', { className: 'barra-trilho' }, el('span', { className: 'barra-valor', style: { width: `${(n / maior) * 100}%` } })),
        el('span', { className: `barra-num num${n ? '' : ' mudo'}` }, n))))),
  ];
}

// Passo "redondo" para as linhas de grade (1, 2, 2,5, 5 × 10^n)
function passoBonito(bruto) {
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / pot;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pot;
}

function graficoLinha(pontos, unidade, rotulo) {
  const NS = 'http://www.w3.org/2000/svg';
  const s = (tag, attrs, texto) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    if (texto != null) e.textContent = texto;
    return e;
  };
  const W = Math.max(260, Math.min(608, conteudo.clientWidth - 34));
  const H = 190;
  const m = { t: 22, r: 14, b: 26, l: 42 };

  const valores = pontos.map((p) => p.valor);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (max - min < 4) { min -= 2; max += 2; }
  const passo = passoBonito((max - min) / 3);
  min = Math.max(0, Math.floor(min / passo) * passo);
  max = Math.ceil(max / passo) * passo;

  const t0 = pontos[0].data;
  const t1 = pontos[pontos.length - 1].data;
  const largura = W - m.l - m.r;
  const x = (p, i) => (pontos.length === 1 ? m.l + largura / 2 : t1 > t0 ? m.l + ((p.data - t0) / (t1 - t0)) * largura : m.l + (i / (pontos.length - 1)) * largura);
  const y = (v) => m.t + (1 - (v - min) / (max - min)) * (H - m.t - m.b);

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico', role: 'img', 'aria-label': `${rotulo} em ${unidade}` });
  const linhas = Math.round((max - min) / passo);
  for (let k = 0; k <= linhas; k++) {
    const v = min + k * passo;
    svg.append(s('line', { x1: m.l, x2: W - m.r, y1: y(v), y2: y(v), class: k === 0 ? 'base' : 'grade-linha' }));
    svg.append(s('text', { x: m.l - 8, y: y(v) + 4, class: 'eixo', 'text-anchor': 'end' }, fmtNum(v)));
  }
  svg.append(s('text', { x: m.l, y: H - 6, class: 'eixo', 'text-anchor': 'start' }, fmtDataCurta(t0)));
  if (pontos.length > 1) svg.append(s('text', { x: W - m.r, y: H - 6, class: 'eixo', 'text-anchor': 'end' }, fmtDataCurta(t1)));

  const xy = pontos.map((p, i) => [x(p, i), y(p.valor)]);
  if (pontos.length > 1) svg.append(s('path', { d: xy.map(([a, b], i) => `${i ? 'L' : 'M'}${a.toFixed(1)},${b.toFixed(1)}`).join(''), class: 'linha' }));
  xy.forEach(([a, b]) => svg.append(s('circle', { cx: a, cy: b, r: 4, class: 'ponto' })));

  // Rótulo direto só no último ponto
  const [ux, uy] = xy[xy.length - 1];
  svg.append(s('text', { x: Math.min(ux, W - m.r), y: uy - 10, class: 'rotulo-ponto', 'text-anchor': pontos.length === 1 ? 'middle' : 'end' }, `${fmtNum(pontos[pontos.length - 1].valor)} ${unidade}`));

  // Toque/arraste: mostra o treino mais próximo do dedo
  const marca = s('circle', { r: 6, class: 'ponto ativo', visibility: 'hidden' });
  svg.append(marca);
  const dica = el('div', { className: 'dica-grafico', hidden: true });
  const mostrar = (ev) => {
    const r = svg.getBoundingClientRect();
    const px = ((ev.clientX - r.left) * W) / r.width;
    let i = 0;
    xy.forEach(([a], k) => { if (Math.abs(a - px) < Math.abs(xy[i][0] - px)) i = k; });
    const [a, b] = xy[i];
    marca.setAttribute('cx', a);
    marca.setAttribute('cy', b);
    marca.setAttribute('visibility', 'visible');
    dica.replaceChildren(el('strong', { className: 'num' }, `${fmtNum(pontos[i].valor)} ${pontos[i].unidade}`), el('small', {}, fmtData(pontos[i].data)), el('small', { className: 'num' }, pontos[i].detalhe));
    dica.hidden = false;
    dica.style.left = `${(a / W) * 100}%`;
    dica.style.top = `${(b / H) * r.height}px`;
    dica.classList.toggle('a-esquerda', a > W * 0.6);
    dica.classList.toggle('a-direita', a < W * 0.4);
  };
  svg.addEventListener('pointermove', mostrar);
  svg.addEventListener('pointerdown', mostrar);
  svg.addEventListener('pointerleave', () => { dica.hidden = true; marca.setAttribute('visibility', 'hidden'); });
  return el('div', { className: 'grafico-caixa' }, svg, dica);
}

// ------------------------------------------------------------------
// Tela: Ajustes
// ------------------------------------------------------------------
function telaAjustes() {
  const som = el('input', {
    type: 'checkbox', className: 'chave', checked: dados.config.som,
    onchange: (e) => { dados.config.som = e.target.checked; salvar(); if (e.target.checked) { destravarSom(); tocarFim(); } },
  });
  const arquivo = el('input', { type: 'file', accept: 'application/json,.json', hidden: true, onchange: importar });
  const temWakeLock = 'wakeLock' in navigator;
  const telaLigada = el('input', {
    type: 'checkbox', className: 'chave', checked: dados.config.telaLigada && temWakeLock, disabled: !temWakeLock,
    onchange: (e) => { dados.config.telaLigada = e.target.checked; salvar(); },
  });
  const ultimoBackup = dados.config.ultimoBackup ? `Último backup: ${fmtData(dados.config.ultimoBackup)}.` : 'Nenhum backup feito ainda.';
  const avisoSom = {
    ios: 'No iPhone o som não toca com o modo silencioso ligado nem com o app fechado. O tempo continua contando certo mesmo assim.',
    android: 'O celular também vibra no fim do descanso. Com o app fechado não há aviso, mas o tempo continua contando certo.',
    outro: 'Com o app fechado não há aviso, mas o tempo continua contando certo.',
  }[PLATAFORMA];
  const semWakeLock = { ios: 'Este aparelho não permite. Precisa do iOS 16.4 ou mais novo.', android: 'Este navegador não permite. Use o Chrome atualizado.', outro: 'Este navegador não permite.' }[PLATAFORMA];

  return [
    el('section', { className: 'cartao' },
      el('h2', {}, 'Durante o treino'),
      el('label', { className: 'opcao' },
        el('span', {}, el('b', {}, 'Bipe quando o descanso acabar'), el('small', {}, avisoSom)),
        som),
      el('label', { className: 'opcao' },
        el('span', {}, el('b', {}, 'Manter a tela ligada'),
          el('small', {}, temWakeLock ? 'A tela não apaga sozinha enquanto o treino estiver aberto. Gasta um pouco mais de bateria.' : semWakeLock)),
        telaLigada)),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Backup'),
      el('p', { className: 'mudo paragrafo' }, `Tudo fica só neste aparelho (${plural(dados.sessoes.length, 'treino', 'treinos')}, ${plural(dados.programas.length, 'ficha', 'fichas')}). ${ultimoBackup} Se os dados do navegador forem apagados ou você trocar de celular, é o backup que salva o histórico. O arquivo de backup funciona tanto no iPhone quanto no Android.`),
      el('div', { className: 'ficha-acoes' },
        el('button', { className: 'botao primario pequeno', onclick: exportar }, icone('download', 16), 'Exportar backup'),
        el('button', { className: 'botao secundario pequeno', onclick: () => arquivo.click() }, icone('arquivo', 16), 'Restaurar backup'),
        arquivo)),
    cartaoInstalar(),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Apagar tudo'),
      el('p', { className: 'mudo paragrafo' }, 'Remove fichas, histórico e ajustes deste aparelho.'),
      el('button', { className: 'botao perigo pequeno', onclick: apagarTudo }, icone('trash', 16), 'Apagar todos os dados')),
  ];
}

// Instruções de instalação do sistema em uso (as do outro ficam num "ver também")
const PASSOS_INSTALAR = {
  ios: ['iPhone', [
    ['Abra este endereço no ', el('b', {}, 'Safari'), '.'],
    ['Toque em ', el('b', {}, 'Compartilhar'), ' (quadrado com a seta para cima; em versões novas, fica no menu ', el('b', {}, '⋯'), ').'],
    ['Escolha ', el('b', {}, 'Adicionar à Tela de Início'), '.'],
  ]],
  android: ['Android', [
    ['Abra este endereço no ', el('b', {}, 'Chrome'), '.'],
    ['Toque no menu ', el('b', {}, '⋮'), ' (três pontinhos, no canto de cima).'],
    ['Escolha ', el('b', {}, 'Instalar app'), ' (ou ', el('b', {}, 'Adicionar à tela inicial'), ').'],
  ]],
};
const listaPassos = (passos) => el('ol', { className: 'passos' },
  passos.map((p) => el('li', {}, ...p.map((x) => (x instanceof Node ? x.cloneNode(true) : x)))),
  el('li', {}, 'Abra pelo ícone: o app fica em tela cheia e funciona sem internet.'));

function cartaoInstalar() {
  if (instalado()) {
    return el('section', { className: 'cartao' },
      el('h2', {}, 'App instalado'),
      el('p', { className: 'mudo paragrafo' }, 'Você está usando o app pelo ícone da tela inicial. Para instalar em outro celular, abra o mesmo endereço nele: funciona em iPhone e Android.'));
  }
  const principal = PLATAFORMA === 'android' ? 'android' : 'ios';
  const outro = principal === 'ios' ? 'android' : 'ios';
  const [nome, passos] = PASSOS_INSTALAR[principal];
  return el('section', { className: 'cartao' },
    el('h2', {}, PLATAFORMA === 'outro' ? 'Instalar no celular' : `Instalar no ${nome}`),
    pedidoInstalacao ? el('button', { className: 'botao primario largo instalar', onclick: instalarApp }, icone('download', 18), 'Instalar app') : null,
    pedidoInstalacao ? el('p', { className: 'mudo nota' }, 'Ou, pelo menu do navegador:') : null,
    listaPassos(passos),
    el('details', { className: 'tabela-dados' },
      el('summary', {}, `Instalar no ${PASSOS_INSTALAR[outro][0]}`),
      listaPassos(PASSOS_INSTALAR[outro][1])));
}

async function exportar() {
  const texto = JSON.stringify({ ...dados, exportadoEm: new Date().toISOString() }, null, 2);
  const nome = `treino-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const arquivo = new File([texto], nome, { type: 'application/json' });
  // No celular abre a folha de compartilhamento ("Salvar em Arquivos", Drive, WhatsApp...).
  // Se a pessoa fechar a folha sem escolher nada, o share dá erro e o backup não conta como feito.
  if (navigator.canShare?.({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: 'Backup do Treino' }); } catch { return; }
  } else {
    const a = el('a', { href: URL.createObjectURL(arquivo), download: nome });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  dados.config.ultimoBackup = Date.now();
  dados.config.backupAdiado = null;
  salvar();
  render();
  toast('Backup exportado');
}

async function importar(ev) {
  const arquivo = ev.target.files[0];
  ev.target.value = '';
  if (!arquivo) return;
  let novo;
  try {
    novo = JSON.parse(await arquivo.text());
    if (novo.versao !== 1 || !Array.isArray(novo.programas) || !Array.isArray(novo.sessoes)) throw new Error();
  } catch {
    toast('Este arquivo não é um backup do Treino', 'erro');
    return;
  }
  const ok = await confirmar({
    titulo: 'Restaurar backup?',
    mensagem: `O arquivo tem ${novo.sessoes.length} treinos e ${novo.programas.length} fichas. Os dados atuais deste aparelho serão substituídos.`,
    perigoso: true, textoOk: 'Restaurar',
  });
  if (!ok) return;
  delete novo.exportadoEm;
  dados = { ...dadosVazios(), ...novo, config: { ...dadosVazios().config, ...novo.config } };
  salvar();
  atualizarListaExercicios();
  render();
  toast('Backup restaurado');
}

async function apagarTudo() {
  const ok = await confirmar({ titulo: 'Apagar todos os dados?', mensagem: 'Fichas e histórico deste aparelho serão apagados. Isso não tem volta, a não ser que você tenha um backup.', perigoso: true, textoOk: 'Apagar tudo' });
  if (!ok) return;
  dados = dadosVazios();
  salvar();
  pararDescanso();
  irPara('hoje');
}

// ------------------------------------------------------------------
// Início
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// Botão/gesto "voltar" do Android: fecha a janela aberta, minimiza o treino ou volta para Hoje,
// em vez de fechar o app. Truque: deixamos uma entrada extra no histórico; cada "voltar" a consome,
// fazemos a ação e colocamos outra no lugar. Na tela Hoje, sem nada aberto, o "voltar" sai do app.
// ------------------------------------------------------------------
const guardarVoltar = () => history.pushState({ treino: true }, '');
window.addEventListener('popstate', () => {
  const dialogo = [...document.querySelectorAll('dialog[open]')].pop();
  if (dialogo) dialogo.dispatchEvent(new Event('cancel', { cancelable: true })); // cada diálogo fecha no próprio "cancel"
  else if (!sessaoEl.hidden) fecharSessao();
  else if (editando) { editando = null; render(); window.scrollTo(0, 0); }
  else if (tela !== 'hoje') irPara('hoje');
  else return; // nada para fechar: deixa o app sair
  guardarVoltar();
});
guardarVoltar();

atualizarListaExercicios();
render();
if (dados.emAndamento) abrirSessao(); // reabriu o app no meio do treino
tickDescanso();

// Pede ao navegador para não apagar os dados quando faltar espaço
navigator.storage?.persist?.().catch(() => {});

// Service worker = funciona sem internet. Só é aceito em HTTPS (ou localhost).
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
