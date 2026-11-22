const {
  ModalBuilder,
  LabelBuilder,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

// Formulário de ajuste de horas (o envio é tratado em interactions/modals/modal_ajuste_horas.js)
const criarModalAjuste = () =>
  new ModalBuilder()
    .setCustomId('modal_ajuste_horas')
    .setTitle('Ajustar horas')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Piloto')
        .setUserSelectMenuComponent(
          new UserSelectMenuBuilder()
            .setCustomId('piloto')
            .setPlaceholder('Procure pelo nome')
            .setMinValues(1)
            .setMaxValues(1)
            .setRequired(true)
        ),
      new LabelBuilder()
        .setLabel('Ação')
        .setStringSelectMenuComponent(
          new StringSelectMenuBuilder()
            .setCustomId('acao')
            .setPlaceholder('Adicionar ou remover')
            .setRequired(true)
            .addOptions(
              { label: 'Adicionar horas', value: 'add' },
              { label: 'Remover horas', value: 'rem' }
            )
        ),
      new LabelBuilder()
        .setLabel('Tempo')
        .setDescription('Sem sinal. Ex: 1h30, 45m, 1:15 ou 2 (horas)')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('tempo')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1h30')
            .setMaxLength(20)
            .setRequired(true)
        )
    );

module.exports = { criarModalAjuste };
