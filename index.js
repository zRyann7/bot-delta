require('dotenv').config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require('discord.js');

const db = require('./database');
const { exportarRelatorio } = require('./excel');
const { sincronizarSheets } = require('./sheets');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

const isStaff = (member) => {
  if (!member) return false;

  const ownerIds = (process.env.OWNER_ID || '')
    .split(',')
    .map(id => id.trim())
    .filter(Boolean);

  if (ownerIds.includes(member.id || member.user?.id)) {
    return true;
  }

  const staffIds = process.env.IDS_CARGO_STAFF?.split(',') || [];
  return staffIds.some(id => member.roles?.cache?.has(id.trim()));
};

const fecharTodosPontos = async (guild = null, executorId = null) => {
  const membros = await db.getPontosAbertos();

  if (!membros.length) {
    return { total: 0, fechados: [], erros: [] };
  }

  const fim = new Date();
  const fechados = [];
  const erros = [];

  for (const m of membros) {
    try {
      const dados = await db.getMembro(m.id);

      if (!dados.inicio_plantao) continue;

      const inicio = new Date(
        dados.inicio_plantao instanceof Date
          ? dados.inicio_plantao
          : String(dados.inicio_plantao).replace(' ', 'T')
      );

      const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
      const novasHoras = dados.horas + horasTrabalhadas;

      await db.salvarMembro(m.id, dados.username, novasHoras, dados.acoes, null);
      await db.registrarHistorico(m.id, dados.username, dados.inicio_plantao, fim.toISOString(), horasTrabalhadas);

      fechados.push({
        id: m.id,
        username: dados.username,
        inicio,
        fim,
        horasTrabalhadas,
        novasHoras,
      });
    } catch (err) {
      console.error(`Erro ao fechar ponto de ${m.id}:`, err);
      erros.push({ id: m.id, erro: err });
    }
  }

  if (guild) {
    const canalLogs = guild.channels.cache.get(process.env.ID_CANAL_LOGS);
    if (canalLogs && fechados.length) {
      const linhas = fechados
        .map((f) => `👤 <@${f.id}> — \`${formatarHoras(f.horasTrabalhadas)}\` neste plantão`)
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle(`🔒 Fechamento em Massa de Pontos (${fechados.length})`)
        .setDescription(
          (executorId ? `Executado por <@${executorId}>.\n\n` : '') + linhas
        )
        .setTimestamp();

      await canalLogs.send({ embeds: [embed] });
    }
  }

  return { total: membros.length, fechados, erros };
};

client.once('ready', () => {
  console.log(`Bot Unidade Delta online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user) && !message.mentions.everyone) {
    const embed = new EmbedBuilder()
      .setTitle('🚔  Unidade Delta — Central de Comandos')
      .setColor('#5865F2')
      .setDescription(
        '> Bem-vindo ao sistema de ponto da **Unidade Delta**.\n' +
        '> Abaixo estao todos os comandos e funcionalidades disponiveis.'
      )
      .addFields(
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '** **',
        },
        {
          name: '🟦  Painel Principal',
          value: '`!painel` — Abre o painel interativo com botoes de operacao',
          inline: false,
        },
        {
          name: '📋  Pontos Registrados',
          value: '`!pontosRegistrados` — Exibe o total de horas de todos os membros registrados',
          inline: false,
        },
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '** **',
        },
        {
          name: '🎮  Botoes do Painel',
          value:
            '🟢 **Iniciar Ponto** — Registra sua entrada no expediente\n' +
            '🔴 **Finalizar Ponto** — Encerra o expediente e salva as horas\n' +
            '📊 **Meu Perfil** — Exibe suas horas, apreensoes e status',
          inline: false,
        },
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '** **',
        },
        {
          name: '🔒  Comandos da Liderança',
          value:
            '`!ajustarHoras @usuario <valor>` — Adiciona ou remove horas de um piloto\n' +
            '`!fecharP @usuario` ou `!fecharP <ID do Discord>` — Encerra o ponto aberto de um piloto\n' +
            '`!fecharTodosPontos` — Encerra todos os pontos ativos de uma vez\n' +
            '`!pontos` — Lista todos os pilotos com ponto ativo\n' +
            '`!ultimosP @usuario` — Exibe os ultimos 5 plantoes do piloto\n' +
            '`!zerarDados @usuario` ou `!zerarDados <ID>` — Zera horas e apreensões de um membro (mantém o registro)\n' +
            '`!zerarDados CONFIRMAR` — Zera horas e apreensões de **todos** os membros\n' +
            '`!removerMembro @usuario` ou `!removerMembro <ID>` — Apaga definitivamente o registro de um membro\n' +
            '`!exportarDelta` — Gera relatorio completo em `.xlsx`\n' +
            '`!sincronizarSheets` — Sincroniza dados com o Google Sheets\n' +
            '`!excluirM 1-100` — Apaga as ultimas N mensagens do canal (max. 100)',
          inline: false,
        },
        {
          name: '━━━━━━━━━━━━━━━━━━━━━━━━',
          value: '** **',
        },
      )
      .setFooter({ text: 'Unidade Delta · Sistema de Ponto  |  Mencione o bot para ver esta mensagem' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  if (message.content === '!painel') {
    const embed = new EmbedBuilder()
      .setTitle('🚔 Unidade Delta - Central de Operações 🚔')
      .setDescription('Selecione uma das opcoes abaixo para gerenciar seu expediente .')
      .setColor('#5865F2')
      .setFooter({ text: 'Unidade Delta - Sistema de Ponto' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_entrar').setLabel('Iniciar Ponto').setEmoji('🟢').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('btn_sair').setLabel('Finalizar Ponto').setEmoji('🔴').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('btn_perfil').setLabel('Meu Perfil').setEmoji('📊').setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    return;
  }

  if (message.content === '!pontosRegistrados') {
    try {
      const membros = await db.getTodosMembros();

      if (!membros.length) {
        return message.reply('Nenhum membro registrado ainda.');
      }

      const linhas = membros.map((m) => `👤 <@${m.id}> — \`${formatarHoras(m.horas || 0)}\``);

      // Discord limita cada campo de embed a 1024 caracteres, entao dividimos em blocos
      const campos = [];
      let bloco = '';
      for (const linha of linhas) {
        const candidato = bloco ? `${bloco}\n${linha}` : linha;
        if (candidato.length > 1000) {
          if (bloco) campos.push(bloco);
          bloco = linha;
        } else {
          bloco = candidato;
        }
      }
      if (bloco) campos.push(bloco);

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`📋 Pontos Registrados (${membros.length})`)
        .setFooter({ text: 'Unidade Delta · Total de horas por membro' })
        .setTimestamp();

      campos.slice(0, 25).forEach((valor, i) => {
        embed.addFields({
          name: campos.length > 1 ? `Membros (${i + 1}/${campos.length})` : 'Membros',
          value: valor,
        });
      });

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao buscar pontos registrados:', err);
      return message.reply('❌ Erro ao buscar os pontos registrados. Verifique os logs.');
    }
  }

  if (message.content === '!exportarDelta') {
    if (!isStaff(message.member)) {
      return message.reply('Apenas a liderança Delta pode exportar o relatorio.');
    }

    const aviso = await message.reply('Gerando relatorio Excel, aguarde...');
    try {
      const filePath   = await exportarRelatorio();
      const attachment = new AttachmentBuilder(filePath, { name: 'relatorio_delta.xlsx' });
      await message.channel.send({ content: 'Relatorio gerado com sucesso!', files: [attachment] });
      await aviso.delete().catch(() => {});
    } catch (err) {
      console.error('Erro ao exportar Excel:', err);
      await aviso.edit('Erro ao gerar o relatorio. Verifique os logs.');
    }
    return;
  }

  if (message.content === '!pontos') {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança pode usar este comando.');
    }

    try {
      const membros = await db.getPontosAbertos();

      if (!membros.length) {
        return message.reply('✅ Ninguém está com ponto aberto.');
      }

      const agora = new Date();
      const linhas = membros.map((m) => {
        const inicio = new Date(
          m.inicio_plantao instanceof Date
            ? m.inicio_plantao
            : String(m.inicio_plantao).replace(' ', 'T')
        );
        const horasAtivo = Math.max(0, (agora - inicio) / (1000 * 60 * 60));
        return (
          `👤 <@${m.id}>\n` +
          `🕒 Aberto em: \`${inicio.toLocaleString('pt-BR')}\`\n` +
          `⏱️ Tempo ativo: \`${formatarHoras(horasAtivo)}\``
        );
      }).join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#FEE75C')
        .setTitle(`📋 Pontos Abertos (${membros.length})`)
        .setDescription(linhas)
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (err) {
      console.error('Erro ao buscar pontos abertos:', err);
      return message.reply('❌ Erro ao buscar pontos abertos. Verifique os logs.');
    }
  }

  if (message.content.startsWith('!fecharP')) {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode fechar pontos.');
    }

    const args = message.content.split(' ').slice(1);

    if (!args.length) {
      return message.reply('❌ Uso correto: `!fecharP @usuario` ou `!fecharP <ID do Discord>`');
    }

    // Tenta pelo mention primeiro, depois pelo ID do Discord (apenas dígitos)   let alvoMembro = message.mentions.members.first();
    if (!alvoMembro) {
      const idArg = args[0].replace(/\D/g, ''); // remove qualquer caractere não numérico
      if (!idArg) {
        return message.reply('❌ Informe uma marcação válida (`@usuario`) ou um ID do Discord (apenas números).');
      }
      try {
        alvoMembro = await message.guild.members.fetch(idArg);
      } catch {
        alvoMembro = null;
      }
    }

    if (!alvoMembro) {
      return message.reply('❌ Usuario nao encontrado. Mencione o membro (`@usuario`) ou informe o ID do Discord correto.');
    }

    try {
      const alvoUser = alvoMembro.user;
      const dados = await db.getMembro(alvoMembro.id);

      if (!dados.inicio_plantao) {
        return message.reply(`❌ <@${alvoMembro.id}> nao possui nenhum ponto aberto.`);
      }

      const inicio = new Date(
        dados.inicio_plantao instanceof Date
          ? dados.inicio_plantao
          : String(dados.inicio_plantao).replace(' ', 'T')
      );
      const fim = new Date();
      const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
      const novasHoras = dados.horas + horasTrabalhadas;

      await db.salvarMembro(alvoMembro.id, alvoUser.username, novasHoras, dados.acoes, null);
      await db.registrarHistorico(alvoMembro.id, alvoUser.username, dados.inicio_plantao, fim.toISOString(), horasTrabalhadas);

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('Ponto Fechado pela Liderança')
            .setDescription(`O ponto de <@${alvoMembro.id}> foi encerrado manualmente por <@${message.author.id}>.`)
            .addFields(
              { name: 'Abertura',            value: `\`${inicio.toLocaleString('pt-BR')}\``,    inline: true  },
              { name: 'Fechamento',          value: `\`${fim.toLocaleString('pt-BR')}\``,        inline: true  },
              { name: 'Duracao do plantao',  value: `\`${formatarHoras(horasTrabalhadas)}\``,    inline: false },
              { name: 'Saldo total de horas', value: `\`${formatarHoras(novasHoras)}\``,         inline: true  }
            )
            .setTimestamp(),
        ],
      });

      const OWNER_IDS = (process.env.OWNER_IDS || process.env.OWNER_ID || '')
          .split(',')
          .map((id) => id.trim())
          .filter(Boolean);

        function isOwner(userId) {
          return OWNER_IDS.includes(String(userId));
        }

        function temPermissao(interaction, cargosPermitidos = []) {
          // 1. Bypass imediato pelo seu ID do Discord (independe de cargo ou servidor)
          if (isOwner(interaction.user.id)) {
            return true;
          }

          // 2. Se não for você e não houver lista de cargos exigida, bloqueia por padrão
          if (!cargosPermitidos.length || !interaction.member) {
            return false;
          }

          // 3. Verifica se o membro possui algum dos cargos autorizados (por ID ou nome)
          return interaction.member.roles.cache.some(
            (role) => cargosPermitidos.includes(role.id) || cargosPermitidos.includes(role.name)
          );
        }
      
      const canalLogs = message.guild.channels.cache.get(process.env.ID_CANAL_LOGS);
      if (canalLogs) {
        await canalLogs.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#FEE75C')
              .setTitle('Ponto Encerrado Manualmente')
              .setDescription(
                `O ponto de <@${alvoMembro.id}> foi fechado pela liderança (<@${message.author.id}>).\n` +
                `Duracao registrada: \`${formatarHoras(horasTrabalhadas)}\``
              )
              .setTimestamp(),
          ],
        });
      }
    } catch (err) {
      console.error('Erro ao fechar ponto:', err);
      return message.reply('❌ Erro ao fechar o ponto. Verifique os logs.');
    }
    return;
  }

  if (message.content === '!fecharTodosPontos') {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode fechar todos os pontos.');
    }

    const aviso = await message.reply('Fechando todos os pontos ativos, aguarde...');

    try {
      const resultado = await fecharTodosPontos(message.guild, message.author.id);

      if (resultado.total === 0) {
        return aviso.edit('✅ Ninguém está com ponto aberto.');
      }

      await aviso.edit(
        `✅ ${resultado.fechados.length} de ${resultado.total} ponto(s) fechado(s) com sucesso.` +
        (resultado.erros.length ? `\n⚠️ ${resultado.erros.length} erro(s) — verifique os logs.` : '')
      );
    } catch (err) {
      console.error('Erro ao fechar todos os pontos:', err);
      await aviso.edit('❌ Erro ao fechar os pontos. Verifique os logs.');
    }
    return;
  }

  if (message.content.startsWith('!ajustarHoras')) {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode ajustar horas.');
    }

    const args = message.content.split(' ').slice(1);

    if (!args.length) {
      return message.reply(
        'Use: `!ajustarHoras @usuario <valor>`\n' +
        'Exemplos:\n' +
        '  `!ajustarHoras @piloto 2` — adiciona 2 horas\n' +
        '  `!ajustarHoras @piloto -1.5` — remove 1h30\n' +
        '  `!ajustarHoras @piloto 0.5` — adiciona 30 minutos'
      );
    }

    let alvoMembro = message.mentions.members.first();

    let horasArg;
    if (alvoMembro) {
      horasArg = args[1];
    } else {
      try {
        alvoMembro = await message.guild.members.fetch(args[0]);
      } catch {
        alvoMembro = null;
      }
      horasArg = args[1];
    }

    if (!alvoMembro) {
      return message.reply('❌ Usuario nao encontrado. Mencione o membro ou informe o ID correto.');
    }

    if (horasArg === undefined) {
      return message.reply('❌ Informe o valor de horas. Ex: `!ajustarHoras @piloto 2` ou `!ajustarHoras @piloto -1.5`');
    }

    const ajusteHoras = parseFloat(horasArg);
    if (isNaN(ajusteHoras) || ajusteHoras === 0) {
      return message.reply('❌ Valor invalido. Informe um numero diferente de zero, ex: `2`, `-1.5`, `0.5`.');
    }

    try {
      const alvoUser = alvoMembro.user;
      const dados = await db.getMembro(alvoMembro.id);

      const novasHoras = Math.max(0, (dados.horas || 0) + ajusteHoras);
      await db.salvarMembro(alvoMembro.id, alvoUser.username, novasHoras, dados.acoes, dados.inicio_plantao);

      const sinal = ajusteHoras > 0 ? '+' : '';
      const cor = ajusteHoras > 0 ? '#57F287' : '#ED4245';
      const acao = ajusteHoras > 0 ? 'Horas Adicionadas' : 'Horas Removidas';

      await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(cor)
            .setTitle(acao)
            .setDescription(
              `<@${alvoMembro.id}>\n` +
              `Ajuste: **${sinal}${formatarHoras(Math.abs(ajusteHoras))}**\n` +
              `Saldo total: **${formatarHoras(novasHoras)}**`
            ),
        ],
      });

      const canalLogs = message.guild.channels.cache.get(process.env.ID_CANAL_LOGS);
      if (canalLogs) {
        await canalLogs.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#5865F2')
              .setTitle('Horas Ajustadas Manualmente')
              .setDescription(
                `Piloto: <@${alvoMembro.id}>\n` +
                `Ajuste: **${sinal}${formatarHoras(Math.abs(ajusteHoras))}**\n` +
                `Saldo total: **${formatarHoras(novasHoras)}**\n` +
                `Registrado por <@${message.author.id}>.`
              )
              .setTimestamp(),
          ],
        });
      }
    } catch (err) {
      console.error('Erro ao ajustar horas:', err);
      return message.reply('❌ Erro ao ajustar as horas. Verifique se o usuario e valido.');
    }
    return;
  }

  if (message.content === '!sincronizarSheets') {
    if (!isStaff(message.member)) {
      return message.reply('Apenas a liderança Delta pode sincronizar o Google Sheets.');
    }

    const aviso = await message.reply('Sincronizando dados com o Google Sheets, aguarde...');
    try {
      const total = await sincronizarSheets();
      await aviso.edit(`Google Sheets atualizado! ${total} piloto(s) sincronizados com sucesso.`);
    } catch (err) {
      console.error('Erro ao sincronizar Sheets:', err);
      await aviso.edit(`Erro ao sincronizar: ${err.message}`);
    }
    return;
  }

  if (message.content.startsWith('!ultimosP')) {
    if (!isStaff(message.member)) {
      return message.reply('Apenas a liderança Delta pode consultar pontos.');
    }

    const args = message.content.split(' ').slice(1);

    if (!args.length) {
      return message.reply('Use: `!ultimosP @usuario` ou `!ultimosP <ID>`');
    }

    let membro = message.mentions.members.first();
    if (!membro) {
      try {
        membro = await message.guild.members.fetch(args[0]);
      } catch {
        membro = null;
      }
    }

    if (!membro) {
      return message.reply('Usuario nao encontrado. Mencione o membro ou informe o ID correto.');
    }

    try {
      const historico = await db.getUltimosPontos(membro.id, 5);

      if (!historico.length) {
        return message.reply(`Nenhum historico encontrado para **${membro.user.username}**.`);
      }

      const descricao = historico
        .map((registro, index) => {
          const entrada = new Date(registro.inicio).toLocaleString('pt-BR');
          const saida   = new Date(registro.fim).toLocaleString('pt-BR');
          return (
            `**Plantao ${index + 1}**\n` +
            `Entrada: \`${entrada}\`\n` +
            `Saida: \`${saida}\`\n` +
            `Duracao: \`${formatarHoras(registro.duracao_horas)}\``
          );
        })
        .join('\n\n');

      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`Ultimos Pontos - ${membro.user.username}`)
        .setDescription(descricao)
        .setFooter({ text: `ID: ${membro.id}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao consultar historico:', error);
      return message.reply('Erro ao consultar os ultimos pontos.');
    }
  }

  if (message.content.startsWith('!zerarDados')) {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode zerar dados.');
    }

    const args = message.content.split(' ').slice(1);

    // ── Zerar TODOS ───────────────────────────────────────────────────
    if (!args.length) {
      // Confirmação obrigatória: !zerarDados CONFIRMAR
      return message.reply(
        '⚠️ Isso vai zerar horas e apreensões de **todos** os membros.\n' +
        'Para confirmar, envie: `!zerarDados CONFIRMAR`'
      );
    }

    if (args[0] === 'CONFIRMAR') {
      try {
        const total = await db.zerarTodos();

        const embed = new EmbedBuilder()
          .setColor('#ED4245')
          .setTitle('🗑️ Reset Geral Executado')
          .setDescription(
            `Horas e apreensões de **${total} membro(s)** foram zeradas.\n` +
            `Todos os pontos abertos também foram encerrados.`
          )
          .addFields({ name: 'Executado por', value: `<@${message.author.id}>`, inline: true })
          .setTimestamp();

        await message.reply({ embeds: [embed] });

        const canalLogs = message.guild.channels.cache.get(process.env.ID_CANAL_LOGS);
        if (canalLogs) {
          await canalLogs.send({ embeds: [embed] });
        }
      } catch (err) {
        console.error('Erro ao zerar todos:', err);
        return message.reply('❌ Erro ao zerar os dados. Verifique os logs.');
      }
      return;
    }

    // ── Zerar INDIVIDUAL ─────────────────────────────────────────────
    let alvoMembro = message.mentions.members.first();

    if (!alvoMembro) {
      const idArg = args[0].replace(/\D/g, '');
      if (!idArg) {
        return message.reply('❌ Informe uma marcação (`@usuario`) ou o ID do Discord.');
      }
      try {
        alvoMembro = await message.guild.members.fetch(idArg);
      } catch {
        alvoMembro = null;
      }
    }

    if (!alvoMembro) {
      return message.reply('❌ Membro não encontrado. Mencione o usuário ou informe o ID correto.');
    }

    try {
      // Verifica se o membro existe no banco antes de zerar
      const dados = await db.getMembro(alvoMembro.id);
      if (!dados.username) {
        // Membro sem registro no banco (objeto padrão retornado)
        return message.reply(`❌ <@${alvoMembro.id}> não possui registros no banco de dados.`);
      }

      await db.zerarMembro(alvoMembro.id);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Dados Zerados')
        .setDescription(`Horas e apreensões de <@${alvoMembro.id}> foram zeradas.`)
        .addFields(
          { name: 'Membro',        value: `<@${alvoMembro.id}>`,       inline: true },
          { name: 'Executado por', value: `<@${message.author.id}>`,   inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      const canalLogs = message.guild.channels.cache.get(process.env.ID_CANAL_LOGS);
      if (canalLogs) {
        await canalLogs.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Erro ao zerar membro:', err);
      return message.reply('❌ Erro ao zerar os dados. Verifique os logs.');
    }
    return;
  }

  if (message.content.startsWith('!removerMembro')) {
    if (!isStaff(message.member)) {
      return message.reply('❌ Apenas a liderança Delta pode remover membros.');
    }

    const args = message.content.split(' ').slice(1);

    if (!args.length) {
      return message.reply('❌ Uso correto: `!removerMembro @usuario` ou `!removerMembro <ID do Discord>`');
    }

    let alvoMembro = message.mentions.members.first();
    let alvoId = alvoMembro?.id;

    if (!alvoId) {
      alvoId = args[0].replace(/\D/g, '');
      if (!alvoId) {
        return message.reply('❌ Informe uma marcação válida (`@usuario`) ou um ID do Discord (apenas números).');
      }
    }

    try {
      const dados = await db.getMembro(alvoId);
      if (!dados.username) {
        return message.reply(`❌ <@${alvoId}> não possui registro no banco de dados.`);
      }

      await db.removerMembro(alvoId);

      const embed = new EmbedBuilder()
        .setColor('#ED4245')
        .setTitle('🗑️ Membro Removido do Banco')
        .setDescription(`O registro de <@${alvoId}> (\`${dados.username}\`) foi apagado permanentemente.`)
        .addFields(
          { name: 'Horas que possuía', value: `\`${formatarHoras(dados.horas || 0)}\``, inline: true },
          { name: 'Executado por',     value: `<@${message.author.id}>`,                inline: true }
        )
        .setFooter({ text: 'O histórico de plantões e apreensões foi mantido para consulta.' })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

      const canalLogs = message.guild.channels.cache.get(process.env.ID_CANAL_LOGS);
      if (canalLogs) {
        await canalLogs.send({ embeds: [embed] });
      }
    } catch (err) {
      console.error('Erro ao remover membro:', err);
      return message.reply('❌ Erro ao remover o membro. Verifique os logs.');
    }
    return;
  }

  if (message.content.startsWith('!excluirM')) {
    if (!isStaff(message.member)) {
      return message.reply('Apenas a liderança Delta pode usar este comando.');
    }

    const args = message.content.split(' ').slice(1);
    const num = args.length ? Number(args[0]) : NaN;

    if (!args.length || !args[0] || !Number.isInteger(num) || num < 1 || num > 100) {
      return message.reply(
        'Uso incorreto. Exemplo:\n' +
        '`!excluirM 10` - apaga as ultimas 10 mensagens do canal (max. 100)'
      );
    }

    try {
      const fetched = await message.channel.messages.fetch({ limit: Math.min(num + 1, 100) });
      const limite14dias = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const recentes = [...fetched.values()].filter((m) => m.createdTimestamp > limite14dias);

      if (recentes.length === 0) {
        return message.reply('Nenhuma mensagem recente encontrada (o Discord so permite apagar mensagens com menos de 14 dias).');
      }

      const deletadas = await message.channel.bulkDelete(recentes, true);

      const aviso = await message.channel.send(
        `${deletadas.size - 1} mensagem(ns) excluida(s) por <@${message.author.id}>.`
      );
      setTimeout(() => aviso.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error('Erro ao apagar mensagens em massa:', err);
      message.reply('Nao foi possivel excluir. O bot precisa da permissao Gerenciar Mensagens no canal.').catch(() => {});
    }
    return;
  }
});

client.on('interactionCreate', async (interaction) => {
  if (interaction.isButton()) {
    await interaction.deferReply({ ephemeral: true });

    const userId   = interaction.user.id;
    const username = interaction.user.username;

    try {
      if (interaction.customId === 'btn_entrar') {
        const dados = await db.getMembro(userId);

        if (dados.inicio_plantao) {
          const iniciou = new Date(dados.inicio_plantao).toLocaleString('pt-BR');
          return interaction.editReply(`Voce ja possui um expediente ativo desde \`${iniciou}\`.`);
        }

        const agora = new Date().toISOString();
        await db.salvarMembro(userId, username, dados.horas, dados.acoes, agora);

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#57F287')
              .setTitle('Expediente Iniciado')
              .setDescription(`Bom trabalho, <@${userId}>! Seu ponto foi registrado.`)
              .addFields({ name: 'Horas acumuladas', value: `\`${formatarHoras(dados.horas)}\`` })
              .setTimestamp(),
          ],
        });
      }

      if (interaction.customId === 'btn_sair') {
        const dados = await db.getMembro(userId);

        if (!dados.inicio_plantao) {
          return interaction.editReply('Voce nao possui um ponto ativo para finalizar.');
        }

        const inicio = new Date(dados.inicio_plantao);
        const fim    = new Date();
        const horasTrabalhadas = Math.max(0, (fim - inicio) / (1000 * 60 * 60));
        const novasHoras       = dados.horas + horasTrabalhadas;

        await db.salvarMembro(userId, username, novasHoras, dados.acoes, null);
        await db.registrarHistorico(userId, username, dados.inicio_plantao, fim.toISOString(), horasTrabalhadas);

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#ED4245')
              .setTitle('Expediente Finalizado')
              .setDescription(`Descanse bem, <@${userId}>!`)
              .addFields(
                { name: 'Duracao deste plantao', value: `\`${formatarHoras(horasTrabalhadas)}\``, inline: true },
                { name: 'Saldo total de horas',  value: `\`${formatarHoras(novasHoras)}\``,       inline: true }
              )
              .setTimestamp(),
          ],
        });
      }

      if (interaction.customId === 'btn_perfil') {
        const [dados, ultimaDuracao] = await Promise.all([
          db.getMembro(userId),
          db.getUltimoPlantao(userId),
        ]);

        const status = dados.inicio_plantao ? 'Em Ponto' : 'Fora de Servico';

        let tempoAtual = 'Nenhum expediente ativo';
        if (dados.inicio_plantao) {
          const hAtual = Math.max(0, (new Date() - new Date(dados.inicio_plantao)) / (1000 * 60 * 60));
          tempoAtual = `\`${formatarHoras(hAtual)}\``;
        }

        return interaction.editReply({
          embeds: [
            new EmbedBuilder()
              .setColor('#3498DB')
              .setTitle(`Perfil de Piloto - ${username}`)
              .addFields(
                { name: 'Status',          value: status,                                    inline: true  },
                { name: 'Apreensoes',      value: `\`${dados.acoes || 0}\``,                 inline: true  },
                { name: 'Horas Totais',    value: `\`${formatarHoras(dados.horas || 0)}\``,  inline: false },
                { name: 'Ultimo Plantao',  value: `\`${formatarHoras(ultimaDuracao || 0)}\``, inline: true },
                { name: 'Plantao Atual',   value: tempoAtual,                                inline: true  }
              )
              .setTimestamp(),
          ],
        });
      }

    } catch (error) {
      console.error('Erro no botao:', error);
      await interaction.editReply('Erro ao processar a requisicao. Tente novamente.');
    }
  }

});

client.login(process.env.TOKEN);
