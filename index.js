// Linha 1: carregar variáveis do .env
require("dotenv").config();

const { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits
} = require("discord.js");

const express = require("express");

// Criar cliente Discord
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers] });

// Configurar servidor web Express
const app = express();
app.get("/", (req, res) => res.send("Bot online!"));
app.listen(process.env.PORT || 3000, () => console.log("Servidor web iniciado na porta " + (process.env.PORT || 3000)));

// Registrar comandos slash
const commands = [
  new SlashCommandBuilder()
    .setName("lista")
    .setDescription("Mostra todos os membros do servidor"),

  new SlashCommandBuilder()
    .setName("retirar")
    .setDescription("Remove um membro do servidor")
    .addUserOption(option => 
      option.setName("usuario")
        .setDescription("Escolha o usuário a remover")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("liberar")
    .setDescription("Libera um usuário do serviço")
    .addUserOption(option => 
      option.setName("usuario")
        .setDescription("Escolha o usuário a liberar")
        .setRequired(true)
    )
].map(cmd => cmd.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log("Registrando comandos...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Comandos registrados!");
  } catch (error) {
    console.error(error);
  }
})();

// Lista de usuários em serviço (simples, em memória)
let usuariosEmServico = [];

// Evento do Discord para painel de botões
client.on("messageCreate", async (message) => {
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

// Listener para interações (botões e comandos)
client.on("interactionCreate", async (interaction) => {

  // ✅ Slash command
  if (interaction.isChatInputCommand()) {

    // /lista
    if (interaction.commandName === "lista") {
      const list = usuariosEmServico.length > 0 ? usuariosEmServico.map(u => u.tag).join("\n") : "Nenhum usuário em serviço";
      await interaction.reply({ content: Usuários em serviço:\n${list}, ephemeral: true });
    }

    // /retirar
    if (interaction.commandName === "retirar") {
      const member = interaction.options.getMember("usuario");

      if (!member) return interaction.reply({ content: "Usuário não encontrado!", ephemeral: true });
      if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
        return interaction.reply({ content: "Você não tem permissão para isso!", ephemeral: true });
      }
      if (!member.kickable) {
        return interaction.reply({ content: "Não posso remover este usuário!", ephemeral: true });
      }

      await member.kick("Removido pelo bot");
      await interaction.reply({ content: ${member.user.tag} foi removido do servidor!, ephemeral: true });
      
      // Também remover da lista de serviço, caso esteja
      usuariosEmServico = usuariosEmServico.filter(u => u.id !== member.id);
    }

    // /liberar
    if (interaction.commandName === "liberar") {
      const member = interaction.options.getUser("usuario");
      if (!member) return interaction.reply({ content: "Usuário não encontrado!", ephemeral: true });

      const index = usuariosEmServico.findIndex(u => u.id === member.id);
      if (index !== -1) {
        usuariosEmServico.splice(index, 1);
        await interaction.reply({ content: ${member.tag} foi liberado do serviço!, ephemeral: true });
      } else {
        await interaction.reply({ content: ${member.tag} não está em serviço., ephemeral: true });
      }
    }

  }

  // ✅ Botões do painel
  if (interaction.isButton()) {
    if (interaction.customId === "entrar_servico") {
      if (!usuariosEmServico.find(u => u.id === interaction.user.id)) {
        usuariosEmServico.push(interaction.user);
      }
      await interaction.reply({ content: "🟢 Você entrou em serviço!", ephemeral: true });
    }
    if (interaction.customId === "sair_servico") {
      usuariosEmServico = usuariosEmServico.filter(u => u.id !== interaction.user.id);
      await interaction.reply({ content: "🔴 Você saiu de serviço!", ephemeral: true });
    }
  }
});

// Logar no bot
client.login(process.env.TOKEN);






