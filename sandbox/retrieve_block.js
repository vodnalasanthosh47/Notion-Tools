import { Client } from "@notionhq/client";
import dotenv from 'dotenv';
dotenv.config({ path: './../secrets.env' });
import util from 'util'; 

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function retrieveBlock(blockId) {
    const response = await notion.blocks.retrieve({
        block_id: blockId,
    });
    return response;
}

async function retriveBlockChildren(blockId) {
    const response = await notion.blocks.children.list({
        block_id: blockId
    });
    console.log("Retrieved block children:");
    console.log(util.inspect(response.results, { depth: null, colors: true, compact: false }));

    // response.results.forEach((block) => {
    //     console.log(block.has_children ? "Block with children" : "Block without children");
    //     console.log(block.type);
    //     console.log("\n-----------------------------\n");
    // });
}

async function retrieveDatabase(databaseId) {
    const response = await notion.databases.retrieve({
        database_id: databaseId,
    });
    return response;
}

async function queryDatabase(databaseId) {
    const response = await notion.databases.query({
        database_id: databaseId,
    });
    return response;
}

