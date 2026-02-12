const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ⚠️ COLOQUE SEU TOKEN AQUI
const TOKEN = process.env.TOKEN;

// ⚠️ COLOQUE O ID DO CANAL DE LOG AQUI
const LOG_CHANNEL_ID = "1471349597707436073";

let pontos = new Map();

client.once("ready", () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isButton()) return;

  const user = interaction.user;
  const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);

  if (interaction.customId === "entrar_servico") {
    const horario = new Date().toLocaleString("pt-BR");
    pontos.set(user.id, horario);

    await interaction.reply({
      content: `🟢 ${user} entrou em serviço às **${horario}**`,
      ephemeral: true
    });

    if (logChannel) {
      logChannel.send(`🟢 **ENTRADA**\n👤 ${user.tag}\n⏰ ${horario}`);
    }
  }

  if (interaction.customId === "sair_servico") {
    const horarioSaida = new Date().toLocaleString("pt-BR");
    const horarioEntrada = pontos.get(user.id);

    if (!horarioEntrada) {
      return interaction.reply({
        content: "❌ Você não registrou entrada!",
        ephemeral: true
      });
    }

    pontos.delete(user.id);

    await interaction.reply({
      content: `🔴 ${user} saiu de serviço às **${horarioSaida}**`,
      ephemeral: true
    });

    if (logChannel) {
      logChannel.send(
        `🔴 **SAÍDA**\n👤 ${user.tag}\n⏰ Entrada: ${horarioEntrada}\n⏰ Saída: ${horarioSaida}`
      );
    }
  }
});

client.on("messageCreate", async message => {
  if (message.content === "!painel") {

    const embed = new EmbedBuilder()
      .setTitle("🛡️ BATE PONTO - BOPE")
      .setDescription("Clique no botão abaixo para registrar seu serviço.")
      .setColor("Red");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("entrar_servico")
        .setLabel("🟢 Entrar em Serviço")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("sair_servico")
        .setLabel("🔴 Sair de Serviço")
        .setStyle(ButtonStyle.Danger)
    );

    message.channel.send({ embeds: [embed], components: [row] });
  }
});

client.login(TOKEN);

