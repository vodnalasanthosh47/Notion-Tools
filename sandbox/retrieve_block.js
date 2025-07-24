require('dotenv').config({path: 'secrets.env'});
const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function retrieveBlock(blockId) {
    const response = await notion.blocks.retrieve({
        block_id: blockId,
    });
    return response;
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

// retrieveBlock(process.env.DATABASE_ID).then(console.log).catch(console.error);
// (async () => {
//     try {
//         const response = await retrieveDatabase(process.env.DATABASE_ID);
//         console.log("Database retrieved successfully:", response);
//     } catch (error) {
//         console.error("Error retrieving database:", error);
//     }
// })();
(async () => {
    try {
        const response = await queryDatabase(process.env.DATABASE_ID);
        console.log("Database queried successfully:");
        response.results.forEach((result) => {
            console.log(result.properties);
        });
    } catch (error) {
        console.error("Error querying database:", error);
    }
})();