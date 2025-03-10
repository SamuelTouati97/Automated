require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const JENKINS_URL = process.env.JENKINS_URL;
const JENKINS_USER = process.env.JENKINS_USER;
const JENKINS_API_TOKEN = process.env.JENKINS_API_TOKEN;
const DISCORD_JENK_TOKEN = process.env.DISCORD_JENK_TOKEN;


async function triggerJenkinsBuild(jobName) {
    const url = `${JENKINS_URL}/job/${jobName}/build`;
    try {
        const response = await axios.post(url, {}, {
            auth: {
                username: JENKINS_USER,
                password: JENKINS_API_TOKEN
            }
        });
        return response.status === 201;
    } catch (error) {
        console.error("Erreur Jenkins:", error.response ? error.response.data : error.message);
        return false;
    }
}


client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.startsWith('!build ')) {
        const jobName = message.content.split(' ')[1];
        if (!jobName) {
            return message.reply('❌ Have to specify jenkins jobname');
        }

        const success = await triggerJenkinsBuild(jobName);
        if (success) {
            message.reply(`🚀 Build lauch for **${jobName}** !`);
        } else {
            message.reply(`❌ Error runing the builds **${jobName}**.`);
        }
    }
});

client.once('ready', () => {
    console.log(`✅ Bot connected as ${client.user.tag}`);
});

client.login(DISCORD_JENK_TOKEN);
