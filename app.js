// =====================================================================
// Treino — fichas, registro de séries, descanso e evolução de carga.
// Roda inteiro no celular: os dados ficam no localStorage do Safari.
// =====================================================================
const { el, icone, toast, confirmar, pedirTexto } = UI;

const CHAVE = 'treino-dados';
const DESCANSOS = [30, 45, 60, 75, 90, 120, 150, 180, 240, 300];

// ------------------------------------------------------------------
// Dados
// ------------------------------------------------------------------
function dadosVazios() {
  return { versao: 1, programas: [], ativo: null, sessoes: [], emAndamento: null, config: { som: true } };
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

// Última vez que o exercício foi feito, em qualquer ficha (compara pelo nome).
function ultimaVez(nome) {
  const alvo = nome.trim().toLowerCase();
  for (let i = dados.sessoes.length - 1; i >= 0; i--) {
    const e = dados.sessoes[i].exercicios.find((x) => x.nome.trim().toLowerCase() === alvo);
    if (e) return { data: dados.sessoes[i].inicio, series: e.series };
  }
  return null;
}

const volume = (sessao) => sessao.exercicios.reduce((t, e) => t + e.series.reduce((u, s) => u + (s.peso || 0) * (s.reps || 0), 0), 0);
const totalSeries = (sessao) => sessao.exercicios.reduce((t, e) => t + e.series.length, 0);

// ------------------------------------------------------------------
// Formatação
// ------------------------------------------------------------------
const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const doisDig = (n) => String(n).padStart(2, '0');
const fmtDataCurta = (ts) => { const d = new Date(ts); return `${doisDig(d.getDate())}/${doisDig(d.getMonth() + 1)}`; };
const fmtData = (ts) => `${DIAS_SEMANA[new Date(ts).getDay()]}, ${fmtDataCurta(ts)}`;
const fmtNum = (n) => Number(n).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const fmtSerie = (s) => (s.peso != null ? `${fmtNum(s.peso)}×${s.reps}` : `${s.reps} reps`);
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
  conteudo.replaceChildren(...[telas[tela]()].flat().filter(Boolean));
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
  const editarEx = async (x, j) => {
    const r = await dialogoExercicio(x);
    if (r === 'excluir') d.exercicios.splice(j, 1);
    else if (r) Object.assign(x, r);
    else return;
    salvar();
    render();
  };
  const novoEx = async () => {
    const r = await dialogoExercicio(null);
    if (!r || r === 'excluir') return;
    d.exercicios.push({ id: novoId(), ...r });
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
          el('button', { className: 'ex-item', onclick: () => editarEx(x, j) }, el('strong', {}, x.nome), el('small', { className: 'mudo num' }, metaEx(x))),
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
        });
      },
    },
      el('div', { className: 'dialogo-topo' }, el('div', { className: 'dialogo-icone' }, icone('haltere', 20)), el('h2', {}, novo ? 'Novo exercício' : 'Editar exercício')),
      campo('Exercício', nome),
      el('div', { className: 'grade-3' }, campo('Séries', series), campo('Repetições', reps), campo('Descanso', desc)),
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

  const corpo = g
    ? [
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
}

function fecharSessao() {
  sessaoEl.hidden = true;
  document.body.classList.remove('em-treino');
  render();
}

function renderSessao() {
  const s = dados.emAndamento;
  sessaoEl.replaceChildren(
    el('header', { className: 'sessao-topo' },
      el('button', { className: 'botao fantasma icone', 'aria-label': 'Minimizar treino', title: 'Minimizar', onclick: fecharSessao }, icone('desce', 22)),
      el('div', { className: 'sessao-titulo' }, el('strong', {}, s.diaNome), el('small', { className: 'num', id: 'sessaoRelogio' })),
      el('button', { className: 'botao primario pequeno', onclick: concluirTreino }, 'Concluir')),
    el('div', { className: 'sessao-progresso', role: 'progressbar', id: 'sessaoProgresso' }, el('span')),
    el('div', { className: 'sessao-lista' }, s.exercicios.map((_, i) => cartaoExercicioSessao(i))),
    el('div', { className: 'sessao-rodape' },
      el('button', { className: 'botao fantasma largo perigo-texto', onclick: cancelarTreino }, icone('trash', 16), 'Descartar treino')));
  atualizarProgresso();
  atualizarRelogio();
}

function cartaoExercicioSessao(i) {
  const e = dados.emAndamento.exercicios[i];
  const ultima = ultimaVez(e.nome);
  const adicionarSerie = () => { e.series.push({ peso: '', reps: '', feito: false }); salvar(); trocarCartao(i); atualizarProgresso(); };
  const removerSerie = () => { e.series.pop(); salvar(); trocarCartao(i); atualizarProgresso(); };

  return el('article', { className: 'cartao ex-sessao', dataset: { i } },
    el('div', { className: 'ex-topo' },
      guiaDe(e.nome) ? el('button', { className: 'ex-miniatura', 'aria-label': `Como fazer ${e.nome}`, onclick: () => abrirGuia(e.nome) },
        el('img', { src: foto(guiaDe(e.nome), 1), alt: '', loading: 'lazy' }), el('span', {}, icone('info', 12))) : null,
      el('div', { className: 'ex-titulo' }, el('h2', {}, e.nome), el('p', { className: 'mudo num' }, `${e.series.length} × ${e.reps} · descanso ${fmtSeg(e.descanso)}`)),
      guiaDe(e.nome) ? null : botaoGuia(e.nome)),
    ultima && podeSubir(ultima.series, e.reps, e.series.length) ? el('span', { className: 'selo acento ex-subir' }, icone('setaCima', 12), 'Suba a carga') : null,
    ultima ? el('p', { className: 'ex-ultima num' }, el('span', { className: 'mudo' }, `Última vez (${fmtDataCurta(ultima.data)}): `), ultima.series.map(fmtSerie).join(' · ')) : null,
    el('div', { className: 'series' },
      el('div', { className: 'serie cabeca', 'aria-hidden': 'true' }, el('span', {}, 'Série'), el('span', {}, 'kg'), el('span', {}, 'Reps'), el('span')),
      e.series.map((_, j) => linhaSerie(i, j, ultima))),
    el('div', { className: 'ex-acoes' },
      el('button', { className: 'botao fantasma pequeno', onclick: adicionarSerie }, icone('plus', 16), 'Série'),
      e.series.length > 1 ? el('button', { className: 'botao fantasma pequeno', onclick: removerSerie }, icone('x', 16), 'Tirar a última') : null));
}

// Troca só o cartão do exercício: redesenhar a tela inteira faria a rolagem voltar ao topo.
function trocarCartao(i) {
  sessaoEl.querySelector(`.ex-sessao[data-i="${i}"]`).replaceWith(cartaoExercicioSessao(i));
}

// Valor sugerido (aparece apagado no campo): carga da série anterior de hoje,
// senão o que foi feito na última vez; repetições da última vez ou o topo da faixa.
function sugestao(e, j, ultima) {
  const ant = e.series.slice(0, j).reverse().find((x) => x.peso !== '');
  const u = ultima ? (ultima.series[j] || ultima.series[ultima.series.length - 1]) : null;
  const peso = ant ? ant.peso : (u && u.peso != null ? fmtNum(u.peso) : '');
  const reps = u ? String(u.reps) : String(topoFaixa(e.reps) ?? '');
  return { peso, reps };
}

function linhaSerie(i, j, ultima) {
  const e = dados.emAndamento.exercicios[i];
  const sr = e.series[j];
  const ref = sugestao(e, j, ultima);
  const peso = el('input', { type: 'text', inputMode: 'decimal', className: 'num', value: sr.peso, placeholder: ref.peso || '–', autocomplete: 'off', 'aria-label': `Carga da série ${j + 1} em kg` });
  const reps = el('input', { type: 'text', inputMode: 'numeric', className: 'num', value: sr.reps, placeholder: ref.reps || '–', autocomplete: 'off', 'aria-label': `Repetições da série ${j + 1}` });
  peso.addEventListener('input', () => { sr.peso = peso.value.trim(); salvar(); });
  reps.addEventListener('input', () => { sr.reps = reps.value.trim(); salvar(); });
  return el('div', { className: `serie${sr.feito ? ' feita' : ''}` },
    el('span', { className: 'serie-n num' }, j + 1), peso, reps,
    el('button', { className: 'marcar', 'aria-pressed': String(sr.feito), 'aria-label': `Série ${j + 1} feita`, onclick: () => marcar(i, j) }, icone('check', 20)));
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
    if (faltam) iniciarDescanso(e.descanso);
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
      .map((e) => ({ nome: e.nome, series: e.series.filter((x) => x.feito).map((x) => ({ peso: lerNum(x.peso), reps: lerNum(x.reps) })) }))
      .filter((e) => e.series.length),
  };
  dados.sessoes.push(registro);
  encerrar();
  const vol = volume(registro);
  toast(`Treino salvo: ${fmtDuracao(registro.fim - registro.inicio)} · ${feitas} séries${vol ? ` · ${fmtNum(vol)} kg` : ''}`, 'sucesso', 4500);
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
// Guarda a HORA em que o descanso acaba (não um contador): no iPhone os timers
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

// Som: o iPhone só libera áudio depois de um toque do usuário, então o
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
  const alvo = nome.toLowerCase();
  const pontos = [];
  for (const s of dados.sessoes) {
    const e = s.exercicios.find((x) => x.nome.toLowerCase() === alvo);
    if (!e) continue;
    const comPeso = e.series.filter((x) => x.peso != null);
    if (comPeso.length) {
      const melhor = comPeso.reduce((a, b) => (b.peso > a.peso || (b.peso === a.peso && b.reps > a.reps) ? b : a));
      const rm = Math.max(...comPeso.map((x) => (x.reps <= 1 ? x.peso : x.peso * (1 + x.reps / 30))));
      pontos.push({ data: s.inicio, valor: metrica === 'carga' ? melhor.peso : Math.round(rm * 10) / 10, unidade: 'kg', detalhe: e.series.map(fmtSerie).join(' · ') });
    } else {
      pontos.push({ data: s.inicio, valor: Math.max(...e.series.map((x) => x.reps || 0)), unidade: 'reps', detalhe: e.series.map(fmtSerie).join(' · ') });
    }
  }
  return pontos;
}

function telaHistorico() {
  if (!dados.sessoes.length) {
    return el('section', { className: 'cartao' }, vazio('grafico', 'Nada por aqui ainda', 'Conclua o primeiro treino para ver o histórico e a evolução das cargas.'));
  }
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
    graficoLinha(pontos, unidade),
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
      el('ul', { className: 'hist-ex' }, s.exercicios.map((e) => el('li', {}, el('span', {}, e.nome), el('span', { className: 'mudo num' }, e.series.map(fmtSerie).join(' · '))))),
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

// Passo "redondo" para as linhas de grade (1, 2, 2,5, 5 × 10^n)
function passoBonito(bruto) {
  const pot = 10 ** Math.floor(Math.log10(bruto));
  const n = bruto / pot;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pot;
}

function graficoLinha(pontos, unidade) {
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

  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'grafico', role: 'img', 'aria-label': `Evolução de ${exGrafico} em ${unidade}` });
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

  return [
    el('section', { className: 'cartao' },
      el('h2', {}, 'Descanso'),
      el('label', { className: 'opcao' },
        el('span', {}, el('b', {}, 'Bipe quando o descanso acabar'),
          el('small', {}, 'No iPhone o som não toca com o modo silencioso ligado nem com o app fechado. O tempo continua contando certo mesmo assim.')),
        som)),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Backup'),
      el('p', { className: 'mudo paragrafo' }, `Tudo fica só neste aparelho (${plural(dados.sessoes.length, 'treino', 'treinos')}, ${plural(dados.programas.length, 'ficha', 'fichas')}). Faça um backup de vez em quando: se os dados do Safari forem apagados ou você trocar de celular, é ele que salva o histórico.`),
      el('div', { className: 'ficha-acoes' },
        el('button', { className: 'botao primario pequeno', onclick: exportar }, icone('download', 16), 'Exportar backup'),
        el('button', { className: 'botao secundario pequeno', onclick: () => arquivo.click() }, icone('arquivo', 16), 'Restaurar backup'),
        arquivo)),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Instalar no iPhone'),
      el('ol', { className: 'passos' },
        el('li', {}, 'Abra este endereço no ', el('b', {}, 'Safari'), '.'),
        el('li', {}, 'Toque em ', el('b', {}, 'Compartilhar'), ' (quadrado com a seta para cima).'),
        el('li', {}, 'Escolha ', el('b', {}, 'Adicionar à Tela de Início'), '.'),
        el('li', {}, 'Abra pelo ícone: o app fica em tela cheia e funciona sem internet.'))),
    el('section', { className: 'cartao' },
      el('h2', {}, 'Apagar tudo'),
      el('p', { className: 'mudo paragrafo' }, 'Remove fichas, histórico e ajustes deste aparelho.'),
      el('button', { className: 'botao perigo pequeno', onclick: apagarTudo }, icone('trash', 16), 'Apagar todos os dados')),
  ];
}

async function exportar() {
  const texto = JSON.stringify({ ...dados, exportadoEm: new Date().toISOString() }, null, 2);
  const nome = `treino-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const arquivo = new File([texto], nome, { type: 'application/json' });
  // No iPhone abre a folha de compartilhamento ("Salvar em Arquivos", AirDrop, WhatsApp...)
  if (navigator.canShare?.({ files: [arquivo] })) {
    try { await navigator.share({ files: [arquivo], title: 'Backup do Treino' }); } catch {}
    return;
  }
  const a = el('a', { href: URL.createObjectURL(arquivo), download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
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
