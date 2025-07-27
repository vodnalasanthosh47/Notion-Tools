import { Client } from "@notionhq/client";
import dotenv from 'dotenv';
dotenv.config({ path: './../secrets.env' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

(async () => {
  const response = await notion.pages.create({
    "parent": {
        "type": "database_id",
        "database_id": process.env.DATABASE_ID
    },
});
  console.log(response);
})();