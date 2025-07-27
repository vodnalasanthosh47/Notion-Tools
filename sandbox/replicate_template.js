import { Client } from "@notionhq/client";
import dotenv from 'dotenv';
dotenv.config({ path: './../secrets.env' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const DATABASE_ID = process.env.DATABASE_ID;
const TEMPLATE_PAGE_ID = process.env.TRIAL_RETRIEVAL_BLOCK_ID; // From Step 1

async function createPageFromTemplate() {
  try {
    // 1. Fetch the blocks from the template page
    const { results: templateBlocks } = await notion.blocks.children.list({
      block_id: TEMPLATE_PAGE_ID,
    });

    // 2. Clean the blocks for the new page
    // This is crucial! You must remove read-only properties.
    console.log("Template blocks fetched:", templateBlocks);

    const cleanedBlocks = templateBlocks.map((block) => {
      // Create a copy to avoid modifying the original object
      const newBlock = { ...block };
      
      // Remove read-only keys that are not allowed in the create API
      delete newBlock.id;
      delete newBlock.created_time;
      delete newBlock.last_edited_time;
      delete newBlock.created_by;
      delete newBlock.last_edited_by;
      delete newBlock.parent;
      delete newBlock.archived;
      delete newBlock.has_children; // This can sometimes cause issues

      return newBlock;
    });

    console.log("Cleaned blocks ready for new page:", cleanedBlocks);

    // 3. Create the new page with properties and the template's content
    const response = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      // Set the properties for your new page here
      properties: {
        
      },
      // Pass the cleaned blocks as the page content
      children: cleanedBlocks,
    });

    console.log("Success! Page created from template.");
    console.log(`View here: ${response.url}`);

  } catch (error) {
    console.error("Error creating page from template:", error.body || error);
  }
}

createPageFromTemplate();