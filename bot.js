require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const token = process.env.DISCORD_TOKEN;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

client.once('ready', () => {
  console.log('Bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; 

  if (message.content === '!github') {
    try {
      const response = await axios.get('https://api.github.com/repos/SamuelTouati97/Automated.git'); 
      message.channel.send(`Repo Name: ${response.data.name}\nStars: ${response.data.stargazers_count}`);
    } catch (error) {
      console.error('GitHub API error:', error);
      message.channel.send('Error fetching GitHub info');
    }
  }
});

client.login(token);
