// =====================================================================
// Kit de interface compartilhado dos 5 projetos
// Fonte única: _design/ui.js → copiada para public/ de cada projeto.
//
// Uso na página:   <script src="ui.js"></script>   e depois   UI.toast('Salvo!')
// =====================================================================
(function () {
  // -------------------------------------------------------------------
  // Tema claro / escuro (aplicado já no carregamento, antes de desenhar)
  // -------------------------------------------------------------------
  const CHAVE_TEMA = 'tema';
  const TEMAS = ['sistema', 'claro', 'escuro'];

  function lerTema() {
    try { return localStorage.getItem(CHAVE_TEMA) || 'sistema'; } catch { return 'sistema'; }
  }
  function aplicarTema(tema) {
    const raiz = document.documentElement;
    if (tema === 'claro') raiz.dataset.theme = 'light';
    else if (tema === 'escuro') raiz.dataset.theme = 'dark';
    else delete raiz.dataset.theme;
  }
  aplicarTema(lerTema());

  // -------------------------------------------------------------------
  // Ícones (traço de 2px, no estilo "Lucide"). Uso: UI.icone('plus', 18)
  // -------------------------------------------------------------------
  const ICONES = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6"/>',
    pencil: '<path d="M17 3a2.85 2.85 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    map: '<path d="M9 3 3 6v15l6-3 6 3 6-3V3l-6 3-6-3Z"/><path d="M9 3v15M15 6v15"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    externo: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    usuario: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    cadeado: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    email: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    olho: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    olhoFechado: '<path d="M9.9 4.24A9 9 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24M17.94 17.94A10 10 0 0 1 12 20c-6.5 0-10-8-10-8a17.6 17.6 0 0 1 5.06-5.94M2 2l20 20"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>',
    lua: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    grafico: '<path d="M3 3v18h18"/><path d="M7 16v-4M12 16V8M17 16v-7"/>',
    carteira: '<path d="M20 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    alerta: '<circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    caixa: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z"/>',
    escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
    lista: '<path d="M11 6h10M11 12h10M11 18h10"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    chave: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    clique: '<path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1M5.1 8l-2.9-.8M14 4.1 12 6M6 12l-1.9 2"/>',
    seta: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    filtro: '<path d="M22 3H2l8 9.46V19l4 2v-8.54Z"/>',
    tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.71a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42Z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
    predio: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    telefone: '<path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    sobe: '<path d="m18 15-6-6-6 6"/>',
    dado: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 8h.01M16 8h.01M12 12h.01M8 16h.01M16 16h.01"/>',
    trofeu: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    reiniciar: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    qrcode: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/>',
    wifi: '<path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/>',
    texto: '<path d="M4 7V4h16v3M9 20h6M12 4v16"/>',
    alvo: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    imagem: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/>',
    chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
    play: '<path d="m6 3 14 9-14 9Z"/>',
    parar: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    impressora: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/>',
    banco: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14a9 3 0 0 0 18 0V5M3 12a9 3 0 0 0 18 0"/>',
    planilha: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6M8 13h2M8 17h2M14 13h2M14 17h2"/>',
    painel: '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    fone: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
    atividade: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    pausa: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    sino: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    roteador: '<rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6.01 18H6M10.01 18H10M15 10v4M17.84 7.17a4 4 0 0 0-5.66 0M20.66 4.34a8 8 0 0 0-11.31 0"/>',
    globo: '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20M2 12h20"/>',
    chip: '<rect x="5" y="5" width="14" height="14" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3"/>',
    memoria: '<path d="M6 19v-3M10 19v-3M14 19v-3M18 19v-3M8 11V9M16 11V9M12 11V9M2 15h20M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z"/>',
    placa: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 10v4M14 10v4M18 10v4M2 18v2M22 18v2"/>',
    termometro: '<path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>',
    disco: '<path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11ZM6 16h.01M10 16h.01"/>',
    setaBaixo: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    setaCima: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    radar: '<path d="M19.07 4.93A10 10 0 0 0 6.99 3.34M4 6h.01M2.29 9.62a10 10 0 1 0 19.02-1.27M16.24 7.76a6 6 0 1 0-8.01 8.91M12 18h.01M17.99 11.66a6 6 0 0 1-2.22 5.01"/><circle cx="12" cy="12" r="2"/><path d="m13.41 10.59 5.66-5.66"/>',
    celular: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M12 18h.01"/>',
    tv: '<rect x="2" y="7" width="20" height="15" rx="2"/><path d="m17 2-5 5-5-5"/>',
    controle: '<path d="M6 12h4M8 10v4M15 13h.01M18 11h.01"/><rect x="2" y="6" width="20" height="12" rx="6"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3Z"/><circle cx="12" cy="13" r="3"/>',
    casa: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/>',
    servidor: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>',
    duvida: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01"/>',
    vassoura: '<path d="m13 11 9-9M14.6 12.6c.8.8.9 2.1.2 3L10 21l-7-7 5.4-4.8c.9-.7 2.2-.6 3 .2Z"/><path d="m6.8 10.4 6.8 6.8M5 17l1.5 1.5"/>',
    pasta: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    arquivo: '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5Z"/><path d="M14 2v6h6"/>',
    esquerda: '<path d="m15 18-6-6 6-6"/>',
    direita: '<path d="m9 18 6-6-6-6"/>',
    desce: '<path d="m6 9 6 6 6-6"/>',
    engrenagem: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"/><circle cx="12" cy="12" r="3"/>',
    apagar: '<path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Z"/><path d="m18 9-6 6M12 9l6 6"/>',
    compartilhar: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>',
    grade: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    haltere: '<path d="M14.4 14.4 9.6 9.6M18.66 21.49a2 2 0 1 1-2.83-2.83l-1.77 1.77a2 2 0 1 1-2.83-2.83l6.37-6.36a2 2 0 1 1 2.83 2.83l-1.77 1.77a2 2 0 1 1 2.83 2.83ZM21.5 21.5l-1.4-1.4M3.9 3.9 2.5 2.5M6.4 12.77a2 2 0 1 1-2.83-2.83l1.77-1.77a2 2 0 1 1-2.83-2.83l2.83-2.83a2 2 0 1 1 2.83 2.83l1.77-1.77a2 2 0 1 1 2.83 2.83Z"/>',
  };

  function icone(nome, tamanho = 18) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', tamanho);
    svg.setAttribute('height', tamanho);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = ICONES[nome] || ''; // conteúdo fixo deste arquivo, nunca texto do usuário
    return svg;
  }

  // Troca <i data-icone="nome"></i> pelo SVG (para ícones escritos direto no HTML).
  function ativarIcones(raiz = document) {
    raiz.querySelectorAll('i[data-icone]').forEach((i) => {
      i.replaceWith(icone(i.dataset.icone, Number(i.dataset.tamanho) || 18));
    });
  }

  // -------------------------------------------------------------------
  // Criar elementos sem innerHTML (texto do usuário sempre via textContent)
  //   UI.el('button', { className: 'botao', onclick: fn }, 'Salvar')
  // -------------------------------------------------------------------
  function el(tag, props = {}, ...filhos) {
    const e = document.createElement(tag);
    for (const [chave, valor] of Object.entries(props)) {
      if (valor === undefined || valor === null || valor === false) continue;
      if (chave === 'style' && typeof valor === 'object') {
        // Variáveis CSS ("--cor") só funcionam com setProperty; o resto vai direto.
        for (const [prop, v] of Object.entries(valor)) prop.startsWith('--') ? e.style.setProperty(prop, v) : (e.style[prop] = v);
      }
      else if (chave === 'dataset') Object.assign(e.dataset, valor);
      else if (chave.startsWith('on') && typeof valor === 'function') e.addEventListener(chave.slice(2), valor);
      else if (chave.includes('-')) e.setAttribute(chave, valor === true ? '' : valor);
      else e[chave] = valor;
    }
    for (const f of filhos.flat()) {
      if (f === null || f === undefined || f === false) continue;
      e.append(f instanceof Node ? f : String(f));
    }
    return e;
  }

  // -------------------------------------------------------------------
  // Notificações
  // -------------------------------------------------------------------
  let caixaToasts;
  function toast(mensagem, tipo = 'sucesso', duracao = 3200) {
    if (!caixaToasts) {
      caixaToasts = el('div', { className: 'toasts', 'aria-live': 'polite', role: 'status' });
      document.body.append(caixaToasts);
    }
    const nomeIcone = { sucesso: 'check', erro: 'x', info: 'info' }[tipo] || 'info';
    const t = el('div', { className: `toast toast-${tipo}` },
      el('span', { className: 'toast-icone' }, icone(nomeIcone, 14)),
      el('span', {}, mensagem));
    caixaToasts.append(t);
    setTimeout(() => {
      t.classList.add('saindo');
      t.addEventListener('animationend', () => t.remove(), { once: true });
    }, duracao);
  }

  // -------------------------------------------------------------------
  // Diálogos: UI.confirmar({...}) e UI.pedirTexto({...}) devolvem Promises
  // -------------------------------------------------------------------
  function abrirDialogo({ titulo, mensagem, iconeNome = 'info', perigoso = false, textoOk = 'Confirmar', campo }) {
    return new Promise((resolve) => {
      const entrada = campo
        ? el('input', { value: campo.valor ?? '', maxLength: campo.max ?? 500, required: true, 'aria-label': campo.rotulo || titulo })
        : null;

      // Resolve uma única vez, direto no clique/Enter/Esc (sem depender do evento "close",
      // que o navegador dispara de forma assíncrona).
      let terminou = false;
      const terminar = (ok) => {
        if (terminou) return;
        terminou = true;
        resolve(campo ? (ok ? entrada.value : null) : ok);
        dialogo.close();
        dialogo.remove();
      };

      const form = el('form', {
        onsubmit: (e) => { e.preventDefault(); terminar(true); },
      },
        el('div', { className: 'dialogo-topo' },
          el('div', { className: 'dialogo-icone' }, icone(iconeNome, 20)),
          el('div', {}, el('h2', {}, titulo), mensagem ? el('p', {}, mensagem) : null)),
        entrada ? el('div', { className: 'entrada' }, entrada) : null,
        el('div', { className: 'dialogo-botoes' },
          el('button', { type: 'button', className: 'botao secundario', onclick: () => terminar(false) }, 'Cancelar'),
          el('button', { type: 'submit', className: `botao ${perigoso ? 'perigo' : 'primario'}` }, textoOk)));

      const dialogo = el('dialog', { className: `dialogo${perigoso ? ' perigoso' : ''}` }, form);
      dialogo.addEventListener('cancel', (e) => { e.preventDefault(); terminar(false); }); // tecla Esc
      dialogo.addEventListener('click', (e) => { if (e.target === dialogo) terminar(false); }); // clique fora
      document.body.append(dialogo);
      dialogo.showModal();
      if (entrada) { entrada.focus(); entrada.select(); }
    });
  }

  const confirmar = (opcoes) => abrirDialogo({ iconeNome: opcoes.perigoso ? 'trash' : 'info', ...opcoes });
  const pedirTexto = (opcoes) => abrirDialogo({ iconeNome: 'pencil', textoOk: 'Salvar', ...opcoes, campo: { valor: opcoes.valor, max: opcoes.max, rotulo: opcoes.rotulo } });

  // -------------------------------------------------------------------
  // Botão "carregando" (mostra um spinner e bloqueia cliques)
  // -------------------------------------------------------------------
  async function comCarregando(botao, tarefa) {
    botao.setAttribute('aria-busy', 'true');
    botao.disabled = true;
    try { return await tarefa(); }
    finally { botao.removeAttribute('aria-busy'); botao.disabled = false; }
  }

  // -------------------------------------------------------------------
  // Botão de tema (sistema → claro → escuro)
  // -------------------------------------------------------------------
  function botaoTema() {
    const nomes = { sistema: 'Tema do sistema', claro: 'Tema claro', escuro: 'Tema escuro' };
    const icones = { sistema: 'monitor', claro: 'sol', escuro: 'lua' };
    const botao = el('button', { type: 'button', className: 'botao fantasma icone' });
    const desenhar = () => {
      const tema = lerTema();
      botao.replaceChildren(icone(icones[tema]));
      botao.title = `${nomes[tema]} (clique para trocar)`;
      botao.setAttribute('aria-label', botao.title);
    };
    botao.addEventListener('click', () => {
      const proximo = TEMAS[(TEMAS.indexOf(lerTema()) + 1) % TEMAS.length];
      try { localStorage.setItem(CHAVE_TEMA, proximo); } catch {}
      aplicarTema(proximo);
      desenhar();
    });
    desenhar();
    return botao;
  }

  // Copiar para a área de transferência (com plano B para navegadores antigos)
  async function copiar(texto) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = el('textarea', { value: texto, style: { position: 'fixed', opacity: '0' } });
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }
  }

  // Botão que enviou o formulário. ev.submitter vem vazio quando o envio é feito por código
  // (form.requestSubmit()), então caímos no primeiro botão de envio do formulário.
  function botaoDoForm(evento) {
    return evento.submitter || evento.target.querySelector('button:not([type="button"])');
  }

  window.UI = { el, icone, ativarIcones, toast, confirmar, pedirTexto, comCarregando, botaoTema, copiar, botaoDoForm };

  document.addEventListener('DOMContentLoaded', () => {
    ativarIcones();
    document.querySelectorAll('[data-botao-tema]').forEach((lugar) => lugar.replaceWith(botaoTema()));
  });
})();
