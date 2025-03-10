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

async function getLatestJiraIssue() {
    try {
        const response = await axios.get(
            `${JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(JQL_QUERY)}&maxResults=1`, 
            {
                auth: { username: JIRA_USER, password: JIRA_API_TOKEN },
                headers: { Accept: "application/json" },
            }
        );

        if (response.status === 200) {
            const issues = response.data.issues;
            if (issues.length > 0) {
                const latestIssue = issues[0];
                const issueKey = latestIssue.key;
                const issueSummary = latestIssue.fields.summary;
                const issueLink = `${JIRA_URL}/browse/${issueKey}`;
                
                return `🔔 **New Jira Issue**: **${issueKey}** - ${issueSummary}\n🔗 ${issueLink}`;
            }
        }
    } catch (error) {
        console.error("❌ Error while retrieving Jira:", error.message);
        return "❌ Unable to fetch Jira updates.";
    }
    return "❌ No issues found.";
}

async function checkJira() {
    try {
        const response = await axios.get(
            `${JIRA_URL}/rest/api/2/search?jql=${encodeURIComponent(JQL_QUERY)}&maxResults=1`, 
            {
                auth: { username: JIRA_USER, password: JIRA_API_TOKEN },
                headers: { Accept: "application/json" },
            }
        );

        if (response.status === 200) {
            const issues = response.data.issues;
            if (issues.length > 0) {
                const latestIssue = issues[0];
                const issueKey = latestIssue.key;
                const issueSummary = latestIssue.fields.summary;

                if (issueKey !== lastCheckedIssue) {
                    lastCheckedIssue = issueKey;

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
                            channel.send(
                                `🔔 **New Jira Issue**: **${issueKey}** - ${issueSummary}\n🔗 ${JIRA_URL}/browse/${issueKey}`
                            );
                        }
                    });
                }
            }
        }
    } catch (error) {
        console.error("❌ Error while retrieving Jira:", error.message);
    }
}

client.once("ready", async () => {
    console.log(`✅ Connected as ${client.user.tag}`);
    

    setInterval(checkJira, 1000);  
});

client.on("messageCreate", async (message) => {
 
    if (message.author.bot) return;

 
    if (message.content.toLowerCase() === "!jira") {
        const jiraUpdate = await getLatestJiraIssue();
        message.channel.send(jiraUpdate);
    }
});

client.login(DISCORD_JIR_TOKEN);
