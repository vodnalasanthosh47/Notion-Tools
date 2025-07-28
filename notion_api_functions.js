import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });
import util from 'util';

function createNotionClient() {
    return new Client({ auth: process.env.NOTION_API_KEY });
}

export async function createPage(parentId, isParentADatabase, properties, children, coverImageUrl = null, iconEmoji = null) {
    const notion = createNotionClient();
    try {
        var newPage = {};
        // adding cover and icon only if they are provided
        if (coverImageUrl) {
            newPage.cover = {
                type: 'external',
                external: {
                    url: coverImageUrl,
                },
            };
        }
        if (iconEmoji) {
            newPage.icon = {
                type: 'emoji',
                emoji: iconEmoji
            };
        }

        // adding parent
        if (isParentADatabase) {
            newPage.parent = {
                database_id: parentId,
            };
        } else {
            newPage.parent = {
                page_id: parentId,
            };
        }

        // adding properties
        newPage.properties = properties;
        // adding children
        if (children && children.length > 0) {
            newPage.children = children;
        }

        // creating the page
        const response = await notion.pages.create(newPage);
        return response;
    } catch (error) {
        console.error('Error creating page:', error);
        throw error;
    }
}

// Testing
// console.log("Testing createPage function");
// console.log(util.inspect(await createPage(process.env.DATABASE_ID, true, {}, [], "https://images.unsplash.com/photo-1686476846973-337a554eb274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODM5MTR8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NTM2Nzk2MTB8&ixlib=rb-4.1.0&q=80&w=1080", "😶‍🌫️"), { depth: null, colors: true, compact: false }));
