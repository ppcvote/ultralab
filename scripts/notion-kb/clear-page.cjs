/**
 * Clear all blocks from Notion parent page
 */

require('dotenv').config()

const NOTION_API_KEY = process.env.NOTION_API_KEY
const PARENT_PAGE_ID = process.env.NOTION_PARENT_PAGE_ID

async function getBlocks() {
  const response = await fetch(`https://api.notion.com/v1/blocks/${PARENT_PAGE_ID}/children`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    }
  })

  const data = await response.json()
  return data.results
}

async function deleteBlock(blockId) {
  const response = await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${NOTION_API_KEY}`,
      'Notion-Version': '2022-06-28',
    }
  })

  if (!response.ok) {
    const data = await response.json()
    throw new Error(`Failed to delete block ${blockId}: ${JSON.stringify(data)}`)
  }

  return true
}

async function clearPage() {
  console.log('🗑️  Clearing all blocks from parent page...\n')

  const blocks = await getBlocks()
  console.log(`Found ${blocks.length} blocks to delete\n`)

  let count = 0
  for (const block of blocks) {
    await deleteBlock(block.id)
    count++
    console.log(`   ✓ Deleted block ${count}/${blocks.length} (${block.type})`)

    // Rate limiting - wait 100ms between deletes
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n✅ Successfully deleted ${count} blocks`)
}

clearPage()
