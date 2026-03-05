/**
 * One-time script to register /blog slash commands with Discord.
 * Run once: node register-discord-commands.mjs
 *
 * Requires env vars: DISCORD_BOT_TOKEN, DISCORD_APPLICATION_ID
 */

import 'dotenv/config'

const TOKEN = process.env.DISCORD_BOT_TOKEN
const APP_ID = process.env.DISCORD_APPLICATION_ID

if (!TOKEN || !APP_ID) {
  console.error('❌ Set DISCORD_BOT_TOKEN and DISCORD_APPLICATION_ID in .env')
  process.exit(1)
}

const commands = [
  {
    name: 'blog',
    description: '查詢 Ultra Lab 技術部落格',
    options: [
      {
        name: 'latest',
        description: '顯示最新文章',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'count',
            description: '要顯示幾篇（1-10，預設 5）',
            type: 4, // INTEGER
            required: false,
            min_value: 1,
            max_value: 10,
          },
        ],
      },
      {
        name: 'search',
        description: '搜尋部落格文章',
        type: 1, // SUB_COMMAND
        options: [
          {
            name: 'keyword',
            description: '搜尋關鍵字',
            type: 3, // STRING
            required: true,
          },
        ],
      },
    ],
  },
]

const res = await fetch(`https://discord.com/api/v10/applications/${APP_ID}/commands`, {
  method: 'PUT',
  headers: {
    Authorization: `Bot ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(commands),
})

const data = await res.json()

if (res.ok) {
  console.log(`✅ Registered ${data.length} command(s):`)
  data.forEach(cmd => console.log(`  • /${cmd.name}`))
} else {
  console.error('❌ Failed:', data)
}
