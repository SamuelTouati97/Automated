require("dotenv").config();
const { Client, GatewayIntentBits, PermissionsBitField } = require("discord.js");
const axios = require("axios");

const DISCORD_JIR_TOKEN = process.env.DISCORD_JIR_TOKEN;
const JIRA_URL = process.env.JIRA_URL;
const JIRA_USER = process.env.JIRA_USER;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const JQL_QUERY = "project = CONDEV ORDER BY created DESC";

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

let lastCheckedIssue = null;

// get last ticket
async function fetchLatestJiraIssue() {
    try {
        const response = await axios.get(
            `${JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(JQL_QUERY)}&maxResults=1`,
            {
                auth: { username: JIRA_USER, password: JIRA_API_TOKEN },
                headers: { Accept: "application/json" },
            }
        );

        if (response.status === 200 && response.data.issues.length > 0) {
            const latestIssue = response.data.issues[0];
            return {
                key: latestIssue.key,
                summary: latestIssue.fields.summary,
                link: `${JIRA_URL}/browse/${latestIssue.key}`
            };
        }
    } catch (error) {
        console.error("❌ Error while retrieving Jira:", error.message);
    }
    return null;
}

// get last ticket with !jira
async function getLatestJiraIssue() {
    const issue = await fetchLatestJiraIssue();
    return issue 
        ? `🔔 **New Jira Issue**: **${issue.key}** - ${issue.summary}\n🔗 ${issue.link}`
        : "❌ No issues found.";
}

// Vérification périodique des nouveaux tickets
async function checkJira() {
    const issue = await fetchLatestJiraIssue();
    if (issue && issue.key !== lastCheckedIssue) {
        lastCheckedIssue = issue.key;
        const guild = client.guilds.cache.get(GUILD_ID);
        if (!guild) {
            console.error("❌ Can't find server");
            return;
        }
        guild.channels.cache.forEach(async (channel) => {
            if (
                channel.isTextBased() &&
                channel.permissionsFor(client.user).has(PermissionsBitField.Flags.SendMessages)
            ) {
                channel.send(`🔔 **New Jira Issue**: **${issue.key}** - ${issue.summary}\n🔗 ${issue.link}`);
            }
        });
    }
}


client.once("ready", async () => {
    console.log(`✅ Connected as ${client.user.tag}`);
    setInterval(checkJira, 10000); //all 10 sec update
});


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.content.toLowerCase() === "!jira") {
        const jiraUpdate = await getLatestJiraIssue();
        message.channel.send(jiraUpdate);
    }
});

client.login(DISCORD_JIR_TOKEN);