// =====================================================================
// Guia dos exercícios: músculos, passo a passo e dicas (texto próprio).
// As fotos vêm do free-exercise-db (domínio público, licença Unlicense):
//   https://github.com/yuhonas/free-exercise-db
// ficam em exercicios/<img>/0.jpg (início) e 1.jpg (fim do movimento).
// =====================================================================

const GUIA = {};
const GRUPOS = [];

// grupo, nome, pasta da imagem, músculos principais, secundários, passos, dicas
function x(grupo, nome, img, principais, secundarios, passos, dicas) {
  if (!GRUPOS.includes(grupo)) GRUPOS.push(grupo);
  GUIA[nome] = { grupo, nome, img, principais, secundarios, passos, dicas };
}

// ------------------------------------------------------------------ Peito
x('Peito', 'Supino reto com barra', 'Barbell_Bench_Press_-_Medium_Grip', 'Peitoral', 'Tríceps e ombro (frente)', [
  'Deite no banco com os olhos embaixo da barra e os pés firmes no chão.',
  'Segure a barra um pouco mais aberto que a largura dos ombros.',
  'Junte as escápulas (ombros para trás e para baixo) e tire a barra do suporte.',
  'Desça controlando até encostar de leve no meio do peito.',
  'Empurre a barra de volta para cima, sem travar os cotovelos com força.',
], [
  'Cotovelos a uns 45° do corpo, não abertos em "T": poupa o ombro.',
  'O quadril fica encostado no banco o tempo todo.',
  'Com carga alta, peça ajuda a alguém para tirar e guardar a barra.',
]);
x('Peito', 'Supino reto com halteres', 'Dumbbell_Bench_Press', 'Peitoral', 'Tríceps e ombro (frente)', [
  'Sente na ponta do banco com os halteres apoiados nas coxas.',
  'Deite levando os halteres junto ao peito e estenda os braços acima do peito.',
  'Desça abrindo os cotovelos até os halteres ficarem na altura do peito.',
  'Empurre para cima aproximando os halteres no final, sem bater um no outro.',
], [
  'Desce mais que a barra: aproveite a amplitude, mas sem dor no ombro.',
  'Para terminar, traga os halteres de volta às coxas antes de sentar.',
]);
x('Peito', 'Supino inclinado com barra', 'Barbell_Incline_Bench_Press_-_Medium_Grip', 'Peitoral (parte de cima)', 'Ombro (frente) e tríceps', [
  'Ajuste o banco entre 30° e 45° e deite com os pés firmes no chão.',
  'Segure a barra um pouco mais aberto que os ombros e junte as escápulas.',
  'Desça a barra até a parte de cima do peito, perto da clavícula.',
  'Empurre para cima e um pouco para trás, acompanhando a linha dos ombros.',
], [
  'Banco muito inclinado vira exercício de ombro: 30° a 45° é o ideal.',
  'Não deixe a lombar sair do banco para "ajudar".',
]);
x('Peito', 'Supino inclinado com halteres', 'Incline_Dumbbell_Press', 'Peitoral (parte de cima)', 'Ombro (frente) e tríceps', [
  'Banco entre 30° e 45°. Leve os halteres até a altura do peito.',
  'Empurre para cima até quase estender os braços.',
  'Desça devagar até sentir o alongamento no peito.',
], [
  'Os halteres descem ao lado do peito, não na direção do rosto.',
  'Mantenha os punhos retos, alinhados com os antebraços.',
]);
x('Peito', 'Supino declinado', 'Decline_Barbell_Bench_Press', 'Peitoral (parte de baixo)', 'Tríceps e ombro (frente)', [
  'Prenda as pernas no apoio do banco declinado e deite.',
  'Segure a barra na largura do supino reto e tire do suporte.',
  'Desça até a parte de baixo do peito.',
  'Empurre de volta para cima.',
], [
  'Use alguém para ajudar a tirar a barra: a posição é desconfortável para isso.',
  'Movimento curto e controlado; não quique a barra no peito.',
]);
x('Peito', 'Crucifixo com halteres', 'Dumbbell_Flyes', 'Peitoral', 'Ombro (frente)', [
  'Deite no banco com os halteres acima do peito, palmas viradas uma para a outra.',
  'Com os cotovelos levemente dobrados, abra os braços em arco.',
  'Desça até sentir o peito alongar, com os halteres na altura do peito.',
  'Volte pelo mesmo arco, como se fosse abraçar uma árvore.',
], [
  'O cotovelo fica no mesmo ângulo do começo ao fim: não vire supino.',
  'Use carga menor que no supino. O exercício é de alongamento, não de força.',
]);
x('Peito', 'Crucifixo na máquina (peck deck)', 'Butterfly', 'Peitoral', 'Ombro (frente)', [
  'Ajuste o banco para as pegadas ficarem na altura do peito.',
  'Sente com as costas apoiadas e segure as pegadas com os braços abertos.',
  'Feche os braços na frente do corpo, apertando o peito no final.',
  'Volte devagar até sentir o alongamento.',
], [
  'Ombros longe das orelhas e costas sempre no encosto.',
  'Segure um segundo com os braços fechados.',
]);
x('Peito', 'Crossover', 'Cable_Crossover', 'Peitoral', 'Ombro (frente)', [
  'Com as polias no alto, segure uma pegada em cada mão e dê um passo à frente.',
  'Incline o tronco um pouco à frente, cotovelos levemente dobrados.',
  'Traga as mãos para baixo e para a frente até se encontrarem na frente do quadril.',
  'Volte devagar abrindo os braços.',
], [
  'Um pé à frente do outro dá mais equilíbrio.',
  'Polia alta trabalha mais a parte de baixo do peito; polia baixa, a de cima.',
]);
x('Peito', 'Flexão de braço', 'Pushups', 'Peitoral', 'Tríceps, ombro (frente) e abdômen', [
  'Mãos no chão um pouco mais abertas que os ombros, corpo em linha reta.',
  'Desça dobrando os cotovelos até o peito quase encostar no chão.',
  'Empurre o chão e volte à posição inicial.',
], [
  'Contraia o abdômen e os glúteos para o quadril não cair.',
  'Se estiver pesado, apoie os joelhos ou as mãos num banco.',
]);

// ------------------------------------------------------------------ Costas
x('Costas', 'Puxada frontal', 'Wide-Grip_Lat_Pulldown', 'Dorsal (latíssimo)', 'Bíceps e meio das costas', [
  'Ajuste o apoio das coxas e segure a barra bem aberta, palmas para a frente.',
  'Sente com o peito estufado e o tronco levemente inclinado para trás.',
  'Puxe a barra até a parte de cima do peito, levando os cotovelos para baixo.',
  'Volte devagar até os braços quase estenderem.',
], [
  'Pense em puxar com os cotovelos, não com as mãos.',
  'Não balance o tronco para trás para fazer a barra descer.',
  'Nunca puxe a barra atrás da nuca.',
]);
x('Costas', 'Puxada com pegada fechada', 'Close-Grip_Front_Lat_Pulldown', 'Dorsal (latíssimo)', 'Bíceps e meio das costas', [
  'Use o triângulo ou uma pegada fechada e sente com as coxas presas.',
  'Puxe até a parte de cima do peito, mantendo os cotovelos perto do corpo.',
  'Aperte as costas no final e volte devagar.',
], [
  'Peito para cima, como se fosse encostar a barra nele.',
  'Deixe os ombros subirem no final da volta para alongar bem as costas.',
]);
x('Costas', 'Barra fixa', 'Pullups', 'Dorsal (latíssimo)', 'Bíceps e meio das costas', [
  'Segure a barra com as palmas para a frente, um pouco mais aberto que os ombros.',
  'Pendure com os braços estendidos.',
  'Puxe o corpo até o queixo passar da barra.',
  'Desça controlando até estender os braços.',
], [
  'Sem balanço: o movimento sai das costas.',
  'Se ainda não consegue, use a máquina graviton ou um elástico de ajuda.',
]);
x('Costas', 'Remada curvada', 'Bent_Over_Barbell_Row', 'Meio das costas e dorsal', 'Bíceps, ombro (trás) e lombar', [
  'Em pé, segure a barra com as mãos na largura dos ombros.',
  'Dobre um pouco os joelhos e incline o tronco à frente, coluna reta.',
  'Puxe a barra até a altura do umbigo, juntando as escápulas.',
  'Desça devagar até estender os braços.',
], [
  'A coluna fica neutra o tempo todo: nada de costas arredondadas.',
  'O tronco não sobe a cada repetição. Se precisar disso, a carga está alta.',
]);
x('Costas', 'Remada baixa', 'Seated_Cable_Rows', 'Meio das costas e dorsal', 'Bíceps e ombro (trás)', [
  'Sente com os pés no apoio e os joelhos levemente dobrados.',
  'Segure o triângulo com os braços estendidos e o tronco reto.',
  'Puxe até a pegada encostar na barriga, levando os cotovelos para trás.',
  'Volte devagar, deixando as costas alongarem sem curvar a coluna.',
], [
  'Peito para cima e ombros para trás no fim da puxada.',
  'O tronco não balança para a frente e para trás.',
]);
x('Costas', 'Remada unilateral com halter', 'One-Arm_Dumbbell_Row', 'Dorsal', 'Meio das costas, bíceps e ombro (trás)', [
  'Apoie um joelho e a mão do mesmo lado no banco, tronco paralelo ao chão.',
  'Com a outra mão, segure o halter com o braço estendido.',
  'Puxe o halter até a lateral do quadril, levando o cotovelo para trás.',
  'Desça devagar e repita. Depois troque de lado.',
], [
  'Puxe na direção do quadril, não do ombro.',
  'Não gire o tronco para levantar o halter.',
]);
x('Costas', 'Remada cavalinho', 'T-Bar_Row_with_Handle', 'Meio das costas e dorsal', 'Bíceps, ombro (trás) e lombar', [
  'Fique sobre a barra com os pés na largura dos ombros e segure a pegada.',
  'Joelhos levemente dobrados, tronco inclinado e coluna reta.',
  'Puxe a carga até perto do peito, apertando as escápulas.',
  'Desça controlando até estender os braços.',
], [
  'Se houver a máquina com apoio para o peito, ela poupa a lombar.',
  'Não arredonde as costas para pegar mais carga.',
]);
x('Costas', 'Pulldown com corda', 'Rope_Straight-Arm_Pulldown', 'Dorsal (latíssimo)', 'Tríceps (cabeça longa) e abdômen', [
  'Com a polia no alto, segure a corda e dê um passo para trás.',
  'Incline um pouco o tronco, braços quase retos à frente.',
  'Leve a corda para baixo em arco até perto das coxas.',
  'Volte devagar até os braços ficarem na altura dos olhos.',
], [
  'Os cotovelos quase não dobram: o movimento é do ombro.',
  'Ótimo para "sentir" as costas antes da puxada.',
]);
x('Costas', 'Levantamento terra', 'Barbell_Deadlift', 'Glúteos, posterior de coxa e lombar', 'Costas inteiras, quadríceps e antebraço', [
  'Pés na largura do quadril, com a barra sobre o meio dos pés.',
  'Dobre quadril e joelhos e segure a barra por fora das pernas.',
  'Peito para cima, coluna reta, ombros um pouco à frente da barra.',
  'Suba empurrando o chão com os pés, a barra raspando nas pernas.',
  'No alto, fique ereto sem jogar o corpo para trás. Desça pelo mesmo caminho.',
], [
  'A coluna nunca arredonda. É o erro mais perigoso deste exercício.',
  'Comece leve e aprenda a técnica antes de pôr carga.',
]);

// ------------------------------------------------------------------ Ombros
x('Ombros', 'Desenvolvimento com halteres', 'Dumbbell_Shoulder_Press', 'Ombro (frente e lateral)', 'Tríceps e trapézio', [
  'Sente num banco com encosto vertical e leve os halteres à altura dos ombros.',
  'Palmas para a frente e cotovelos um pouco à frente do corpo.',
  'Empurre os halteres para cima até quase estender os braços.',
  'Desça devagar até a altura das orelhas.',
], [
  'Não arqueie a lombar: as costas ficam no encosto.',
  'Não precisa bater os halteres lá em cima.',
]);
x('Ombros', 'Desenvolvimento militar', 'Standing_Military_Press', 'Ombro (frente e lateral)', 'Tríceps, trapézio e abdômen', [
  'Em pé, segure a barra na frente dos ombros, mãos na largura dos ombros.',
  'Contraia abdômen e glúteos para travar o tronco.',
  'Empurre a barra para cima, tirando a cabeça do caminho.',
  'No alto, passe a cabeça para baixo da barra. Desça até os ombros.',
], [
  'Sem impulso das pernas, senão vira outro exercício.',
  'Se a lombar arquear muito, reduza a carga.',
]);
x('Ombros', 'Desenvolvimento na máquina', 'Machine_Shoulder_Military_Press', 'Ombro (frente e lateral)', 'Tríceps', [
  'Ajuste o banco para as pegadas ficarem na altura dos ombros.',
  'Costas no encosto, segure as pegadas.',
  'Empurre para cima até quase estender os braços e desça devagar.',
], [
  'Boa opção para treinar pesado com segurança, sem precisar de ajuda.',
]);
x('Ombros', 'Elevação lateral', 'Side_Lateral_Raise', 'Ombro (lateral)', 'Trapézio', [
  'Em pé, um halter em cada mão ao lado do corpo, cotovelos levemente dobrados.',
  'Levante os braços para os lados até a altura dos ombros.',
  'Desça devagar, sem deixar os halteres baterem nas pernas.',
], [
  'Conduza o movimento com os cotovelos, não com as mãos.',
  'Carga leve e sem balanço: aqui a técnica vale mais que o peso.',
  'Pare na altura dos ombros. Acima disso, o trapézio assume.',
]);
x('Ombros', 'Elevação lateral no cabo', 'Cable_Seated_Lateral_Raise', 'Ombro (lateral)', 'Trapézio', [
  'Fique de lado para a polia baixa e segure a pegada com a mão de fora.',
  'Levante o braço para o lado até a altura do ombro.',
  'Desça devagar e repita. Depois troque de lado.',
], [
  'O cabo mantém a tensão no começo do movimento, onde o halter alivia.',
]);
x('Ombros', 'Elevação frontal', 'Front_Dumbbell_Raise', 'Ombro (frente)', 'Peitoral (parte de cima)', [
  'Em pé, halteres na frente das coxas, palmas para trás.',
  'Levante um braço (ou os dois) à frente até a altura dos ombros.',
  'Desça devagar e repita.',
], [
  'Sem balançar o tronco para ganhar impulso.',
  'Se você já faz muito supino, este ombro já trabalha bastante: use pouco volume.',
]);
x('Ombros', 'Crucifixo inverso', 'Reverse_Machine_Flyes', 'Ombro (trás)', 'Meio das costas e trapézio', [
  'No peck deck, sente virado para o encosto, com o peito apoiado.',
  'Segure as pegadas na altura dos ombros, braços à frente.',
  'Abra os braços para trás em arco até ficarem alinhados com o corpo.',
  'Volte devagar.',
], [
  'Também dá para fazer com halteres, com o tronco inclinado à frente.',
  'Carga leve: o músculo é pequeno.',
]);
x('Ombros', 'Face pull', 'Face_Pull', 'Ombro (trás)', 'Meio das costas e manguito rotador', [
  'Com a polia na altura do rosto, segure a corda com as palmas para baixo.',
  'Dê um passo para trás com os braços estendidos.',
  'Puxe a corda em direção ao rosto, abrindo as mãos e os cotovelos para fora.',
  'Segure um segundo e volte devagar.',
], [
  'Ótimo para a saúde do ombro de quem faz muito supino.',
  'No final, as mãos ficam ao lado das orelhas.',
]);
x('Ombros', 'Encolhimento', 'Dumbbell_Shrug', 'Trapézio', 'Antebraço', [
  'Em pé, um halter em cada mão ao lado do corpo.',
  'Suba os ombros em direção às orelhas, o mais alto que der.',
  'Segure um segundo e desça devagar.',
], [
  'Movimento só para cima e para baixo: não gire os ombros.',
  'Braços retos: não dobre os cotovelos.',
]);

// ------------------------------------------------------------------ Bíceps
x('Bíceps', 'Rosca direta', 'Barbell_Curl', 'Bíceps', 'Antebraço', [
  'Em pé, segure a barra com as palmas para a frente, na largura dos ombros.',
  'Cotovelos colados ao corpo.',
  'Dobre os cotovelos e suba a barra até a altura dos ombros.',
  'Desça devagar até estender os braços.',
], [
  'Os cotovelos não vão para a frente nem para trás.',
  'Nada de jogar o tronco para trás para subir a barra.',
]);
x('Bíceps', 'Rosca alternada', 'Dumbbell_Alternate_Bicep_Curl', 'Bíceps', 'Antebraço', [
  'Em pé ou sentado, um halter em cada mão, palmas viradas para o corpo.',
  'Suba um halter girando a palma para cima durante a subida.',
  'Desça devagar e repita com o outro braço.',
], [
  'Girar a palma (supinar) ativa mais o bíceps.',
  'Sentado fica mais difícil roubar no movimento.',
]);
x('Bíceps', 'Rosca martelo', 'Hammer_Curls', 'Braquial e antebraço', 'Bíceps', [
  'Em pé, halteres ao lado do corpo, palmas viradas uma para a outra.',
  'Suba os halteres sem girar os punhos, como quem segura um martelo.',
  'Desça devagar.',
], [
  'Ajuda a engrossar o braço e fortalece a pegada.',
]);
x('Bíceps', 'Rosca Scott', 'Preacher_Curl', 'Bíceps', 'Braquial', [
  'Sente no banco Scott com a parte de trás dos braços no apoio.',
  'Segure a barra com as palmas para cima.',
  'Suba a barra até perto dos ombros.',
  'Desça devagar até os braços quase estenderem.',
], [
  'Não estenda o braço totalmente com carga alta: é onde o cotovelo sofre.',
  'O apoio impede o roubo: use menos carga que na rosca direta.',
]);
x('Bíceps', 'Rosca no cabo', 'Standing_Biceps_Cable_Curl', 'Bíceps', 'Antebraço', [
  'De frente para a polia baixa, segure a barra com as palmas para cima.',
  'Cotovelos colados ao corpo, suba até a altura dos ombros.',
  'Desça devagar.',
], [
  'O cabo mantém a tensão o tempo todo, inclusive embaixo.',
]);
x('Bíceps', 'Rosca concentrada', 'Concentration_Curls', 'Bíceps', 'Braquial', [
  'Sente no banco com as pernas afastadas e o tronco inclinado à frente.',
  'Apoie o cotovelo na parte de dentro da coxa, halter na mão.',
  'Suba o halter até perto do ombro, apertando o bíceps.',
  'Desça devagar. Depois troque de braço.',
], [
  'O braço não sai da coxa: só o antebraço se move.',
]);

// ------------------------------------------------------------------ Tríceps
x('Tríceps', 'Tríceps na polia', 'Triceps_Pushdown', 'Tríceps', '', [
  'De frente para a polia alta, segure a barra com as palmas para baixo.',
  'Cotovelos colados ao corpo, antebraços paralelos ao chão.',
  'Empurre a barra para baixo até estender os braços.',
  'Volte devagar até a altura do peito.',
], [
  'Só o antebraço se move: os cotovelos ficam parados.',
  'Tronco levemente inclinado à frente, sem se jogar sobre a barra.',
]);
x('Tríceps', 'Tríceps corda', 'Triceps_Pushdown_-_Rope_Attachment', 'Tríceps', '', [
  'Polia alta com a corda, palmas viradas uma para a outra.',
  'Cotovelos colados ao corpo.',
  'Empurre para baixo e, no final, abra as pontas da corda para os lados.',
  'Volte devagar.',
], [
  'Abrir a corda no final aumenta a contração.',
]);
x('Tríceps', 'Tríceps testa', 'EZ-Bar_Skullcrusher', 'Tríceps', '', [
  'Deite no banco com a barra W acima do peito, braços estendidos.',
  'Dobrando só os cotovelos, desça a barra em direção à testa.',
  'Pare um pouco antes da testa e estenda os braços de volta.',
], [
  'Os cotovelos apontam para o teto: não deixe abrirem para os lados.',
  'Comece leve. O nome "quebra-crânio" não é à toa.',
]);
x('Tríceps', 'Tríceps francês', 'Standing_Dumbbell_Triceps_Extension', 'Tríceps (cabeça longa)', '', [
  'Sentado ou em pé, segure um halter com as duas mãos acima da cabeça.',
  'Desça o halter atrás da cabeça dobrando os cotovelos.',
  'Estenda os braços de volta para cima.',
], [
  'Cotovelos apontando para a frente e perto da cabeça.',
  'Sentado num banco com encosto, a lombar fica protegida.',
]);
x('Tríceps', 'Mergulho nas paralelas', 'Dips_-_Triceps_Version', 'Tríceps', 'Peitoral e ombro (frente)', [
  'Segure as barras paralelas e suba com os braços estendidos.',
  'Tronco reto, desça dobrando os cotovelos até uns 90°.',
  'Empurre de volta até estender os braços.',
], [
  'Tronco reto foca no tríceps; inclinado à frente, no peito.',
  'Se sentir dor no ombro, não desça tanto.',
]);
x('Tríceps', 'Supino fechado', 'Close-Grip_Barbell_Bench_Press', 'Tríceps', 'Peitoral e ombro (frente)', [
  'Deite no banco e segure a barra com as mãos na largura dos ombros.',
  'Desça a barra até a parte de baixo do peito, cotovelos perto do corpo.',
  'Empurre de volta para cima.',
], [
  'Mãos coladas uma na outra forçam o punho: largura dos ombros basta.',
]);

// ------------------------------------------------------------------ Pernas
x('Pernas', 'Agachamento livre', 'Barbell_Squat', 'Quadríceps e glúteos', 'Posterior de coxa, lombar e abdômen', [
  'Apoie a barra no trapézio (não no pescoço) e tire do suporte.',
  'Pés um pouco mais abertos que o quadril, pontas levemente para fora.',
  'Desça levando o quadril para trás e para baixo, como quem senta.',
  'Desça até as coxas ficarem pelo menos paralelas ao chão.',
  'Suba empurrando o chão com o pé inteiro.',
], [
  'Os joelhos seguem a direção das pontas dos pés: não deixe entrarem.',
  'Calcanhares no chão e peito para cima o tempo todo.',
  'Agache dentro do rack com as travas de segurança na altura certa.',
]);
x('Pernas', 'Agachamento no Smith', 'Smith_Machine_Squat', 'Quadríceps e glúteos', 'Posterior de coxa', [
  'Apoie a barra do Smith no trapézio, com os pés um pouco à frente do corpo.',
  'Destrave a barra girando os punhos.',
  'Desça até as coxas ficarem paralelas ao chão e suba.',
], [
  'Pés mais à frente trabalham mais glúteo; embaixo da barra, mais quadríceps.',
  'Sempre trave a barra nos ganchos ao terminar.',
]);
x('Pernas', 'Hack', 'Hack_Squat', 'Quadríceps', 'Glúteos', [
  'Encoste as costas na máquina com os ombros sob as almofadas.',
  'Pés na plataforma na largura do quadril.',
  'Destrave e desça até os joelhos ficarem em 90° ou um pouco mais.',
  'Suba empurrando a plataforma, sem travar os joelhos.',
], [
  'As costas não saem do encosto.',
  'Pés mais baixos na plataforma focam mais no quadríceps.',
]);
x('Pernas', 'Leg press 45°', 'Leg_Press', 'Quadríceps e glúteos', 'Posterior de coxa', [
  'Sente com as costas e o quadril bem encostados.',
  'Pés no meio da plataforma, na largura dos ombros.',
  'Destrave e desça até os joelhos chegarem perto do peito.',
  'Empurre de volta sem travar totalmente os joelhos.',
], [
  'Se o quadril sair do banco no fim da descida, desça menos.',
  'Pés mais altos: mais glúteo e posterior. Mais baixos: mais quadríceps.',
]);
x('Pernas', 'Cadeira extensora', 'Leg_Extensions', 'Quadríceps', '', [
  'Ajuste o encosto para o joelho ficar alinhado com o eixo da máquina.',
  'O rolo fica na frente do tornozelo.',
  'Estenda as pernas até ficarem retas e segure um segundo.',
  'Desça devagar.',
], [
  'Segure nas alças para o quadril não levantar do banco.',
  'Bom para aquecer os joelhos antes do agachamento.',
]);
x('Pernas', 'Mesa flexora', 'Lying_Leg_Curls', 'Posterior de coxa', 'Panturrilha', [
  'Deite de bruços com os joelhos logo depois da borda do banco.',
  'O rolo fica atrás dos tornozelos.',
  'Dobre os joelhos trazendo os calcanhares em direção ao glúteo.',
  'Desça devagar.',
], [
  'O quadril fica colado no banco: se levantar, a carga está alta.',
]);
x('Pernas', 'Cadeira flexora', 'Seated_Leg_Curl', 'Posterior de coxa', 'Panturrilha', [
  'Sente com o joelho alinhado ao eixo da máquina e trave as coxas com o apoio.',
  'O rolo fica atrás dos tornozelos.',
  'Dobre os joelhos levando os pés para baixo e para trás.',
  'Volte devagar.',
], [
  'Sentado, o posterior trabalha mais alongado que na mesa flexora.',
]);
x('Pernas', 'Stiff', 'Stiff-Legged_Barbell_Deadlift', 'Posterior de coxa e glúteos', 'Lombar', [
  'Em pé, segure a barra na frente das coxas, joelhos levemente dobrados.',
  'Leve o quadril para trás e desça a barra raspando nas pernas.',
  'Desça até sentir o posterior de coxa alongar, com a coluna reta.',
  'Suba empurrando o quadril para a frente.',
], [
  'O movimento é do quadril, não da coluna: costas sempre retas.',
  'Não precisa encostar a barra no chão. Pare onde a coluna começar a curvar.',
]);
x('Pernas', 'Afundo', 'Dumbbell_Lunges', 'Quadríceps e glúteos', 'Posterior de coxa', [
  'Em pé, um halter em cada mão.',
  'Dê um passo largo à frente.',
  'Desça até o joelho de trás quase encostar no chão.',
  'Empurre com a perna da frente para voltar. Alterne as pernas.',
], [
  'O tronco fica ereto e o joelho da frente não passa muito dos dedos.',
  'Passo mais longo trabalha mais glúteo.',
]);
x('Pernas', 'Agachamento búlgaro', 'Split_Squat_with_Dumbbells', 'Quadríceps e glúteos', 'Posterior de coxa', [
  'De costas para um banco, apoie o peito do pé de trás nele.',
  'Halteres nas mãos, pé da frente uns 60 a 90 cm à frente do banco.',
  'Desça até a coxa da frente ficar paralela ao chão.',
  'Suba empurrando com a perna da frente. Depois troque de perna.',
], [
  'Ache a distância certa sem peso antes de pegar os halteres.',
  'Tronco inclinado um pouco à frente foca mais no glúteo.',
]);
x('Pernas', 'Elevação pélvica', 'Barbell_Hip_Thrust', 'Glúteos', 'Posterior de coxa', [
  'Sente no chão com as costas na borda de um banco e a barra sobre o quadril.',
  'Pés no chão na largura do quadril, joelhos dobrados.',
  'Suba o quadril até o tronco ficar alinhado com as coxas.',
  'Aperte os glúteos no alto e desça devagar.',
], [
  'Use uma almofada na barra para não machucar o quadril.',
  'No alto, o queixo vai em direção ao peito: evita arquear a lombar.',
]);
x('Pernas', 'Cadeira abdutora', 'Thigh_Abductor', 'Glúteo médio', 'Glúteo máximo', [
  'Sente na máquina com as pernas fechadas e as almofadas por fora dos joelhos.',
  'Abra as pernas o máximo que conseguir.',
  'Volte devagar sem deixar as placas baterem.',
], [
  'Inclinar o tronco à frente aumenta o trabalho do glúteo.',
]);
x('Pernas', 'Cadeira adutora', 'Thigh_Adductor', 'Adutores (parte de dentro da coxa)', '', [
  'Sente com as pernas abertas e as almofadas por dentro dos joelhos.',
  'Feche as pernas até as almofadas se encontrarem.',
  'Abra devagar.',
], [
  'Comece com pouca abertura e aumente aos poucos.',
]);

// ------------------------------------------------------------------ Panturrilha
x('Panturrilha', 'Panturrilha em pé', 'Standing_Calf_Raises', 'Panturrilha (gastrocnêmio)', '', [
  'Ombros sob as almofadas e pontas dos pés na borda da plataforma.',
  'Deixe os calcanhares descerem até alongar bem.',
  'Suba na ponta dos pés o mais alto possível.',
  'Segure um segundo e desça devagar.',
], [
  'Amplitude completa: alongue embaixo e segure em cima.',
  'Joelhos retos (sem travar) trabalham a parte de cima da panturrilha.',
]);
x('Panturrilha', 'Panturrilha sentado', 'Seated_Calf_Raise', 'Panturrilha (sóleo)', '', [
  'Sente com as pontas dos pés na plataforma e o apoio sobre os joelhos.',
  'Desça os calcanhares até alongar.',
  'Suba na ponta dos pés e segure um segundo.',
], [
  'Com o joelho dobrado, trabalha mais o sóleo, a parte de baixo da panturrilha.',
]);
x('Panturrilha', 'Panturrilha no leg press', 'Calf_Press_On_The_Leg_Press_Machine', 'Panturrilha', '', [
  'No leg press, apoie só as pontas dos pés na parte de baixo da plataforma.',
  'Com as pernas estendidas, empurre a plataforma com as pontas dos pés.',
  'Volte devagar, deixando os calcanhares alongarem.',
], [
  'Não destrave a plataforma: as travas devem continuar ao alcance.',
]);

// ------------------------------------------------------------------ Abdômen
x('Abdômen', 'Abdominal supra', 'Crunches', 'Abdômen (reto abdominal)', '', [
  'Deite de costas com os joelhos dobrados e os pés no chão.',
  'Mãos ao lado da cabeça ou cruzadas no peito.',
  'Suba os ombros do chão contraindo o abdômen.',
  'Desça devagar.',
], [
  'Não puxe a cabeça com as mãos.',
  'É um movimento curto: a lombar fica no chão.',
]);
x('Abdômen', 'Abdominal na polia', 'Cable_Crunch', 'Abdômen (reto abdominal)', 'Oblíquos', [
  'Ajoelhe de frente para a polia alta e segure a corda ao lado da cabeça.',
  'Com o quadril parado, enrole o tronco levando os cotovelos aos joelhos.',
  'Volte devagar.',
], [
  'O quadril não vai para trás: quem trabalha é o abdômen.',
  'Dá para usar carga e progredir como em outros exercícios.',
]);
x('Abdômen', 'Elevação de pernas', 'Flat_Bench_Lying_Leg_Raise', 'Abdômen (parte de baixo)', 'Flexores do quadril', [
  'Deite num banco e segure as bordas atrás da cabeça.',
  'Com as pernas quase retas, levante-as até ficarem na vertical.',
  'Desça devagar sem encostar os pés no chão.',
], [
  'A lombar fica colada no banco.',
  'Ficou fácil? Faça pendurado na barra.',
]);
x('Abdômen', 'Prancha', 'Plank', 'Abdômen (transverso)', 'Ombros e glúteos', [
  'Apoie os antebraços e as pontas dos pés no chão.',
  'Corpo em linha reta da cabeça aos calcanhares.',
  'Segure a posição pelo tempo da série.',
], [
  'Contraia abdômen e glúteos: o quadril não sobe nem cai.',
  'Respire normalmente, sem prender o ar.',
]);
x('Abdômen', 'Abdominal infra', 'Reverse_Crunch', 'Abdômen (parte de baixo)', 'Oblíquos', [
  'Deite de costas com os joelhos dobrados e as coxas na vertical.',
  'Enrole o quadril tirando-o do chão, levando os joelhos ao peito.',
  'Desça devagar.',
], [
  'Sem embalo: o quadril sobe pela força do abdômen.',
]);

// Lista por grupo (sugestões ao digitar o nome do exercício)
const EXERCICIOS = Object.fromEntries(GRUPOS.map((g) => [g, Object.values(GUIA).filter((e) => e.grupo === g).map((e) => e.nome)]));

// Acha o guia pelo nome sem diferenciar maiúsculas e acentos ("supino reto com barra" também vale)
const semAcento = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const GUIA_POR_CHAVE = new Map(Object.values(GUIA).map((e) => [semAcento(e.nome), e]));
const guiaDe = (nome) => GUIA_POR_CHAVE.get(semAcento(nome)) || null;
