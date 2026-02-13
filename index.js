const OWNER_ID = "998373201199501472";
const { 
  Client, 
  GatewayIntentBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const licenses = JSON.parse(fs.readFileSync('./licenses.json'));

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
  if (!interaction.guild) return;

if (!licenses.servers.includes(interaction.guild.id)) {
    return interaction.reply({
        content: "❌ Este servidor não possui licença ativa.",
        ephemeral: true
    });
}

  if (!interaction.isButton()) return;
  
  // PAINEL ADMIN
if (interaction.user.id === OWNER_ID) {

    if (interaction.commandName === "liberar") {
        const serverId = interaction.options.getString("id");

        if (!licenses.servers.includes(serverId)) {
            licenses.servers.push(serverId);
            fs.writeFileSync('./licenses.json', JSON.stringify(licenses, null, 2));
        }

        return interaction.reply(`✅ Servidor ${serverId} liberado.`);
    }

    if (interaction.commandName === "remover") {
        const serverId = interaction.options.getString("id");

        licenses.servers = licenses.servers.filter(id => id !== serverId);
        fs.writeFileSync('./licenses.json', JSON.stringify(licenses, null, 2));

        return interaction.reply(`❌ Servidor ${serverId} removido.`);
    }

    if (interaction.commandName === "listar") {
        return interaction.reply(`📋 Servidores liberados:\n${licenses.servers.join("\n")}`);
    }

}


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



