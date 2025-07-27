// export { test_console_log };

// function test_console_log() {
//   console.log("This is a test log message.");
// }

import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });

const ACADS_DATABASE_ID = process.env.ACADS_DATABASE_ID;

const notion = new Client({ auth: process.env.NOTION_API_KEY });


// I want to create a new page in the Notion Database using a pre-existiong template
(async () => {
  const response = await notion.pages.create({
    "parent": {
        "type": "database_id",
        "database_id": ACADS_DATABASE_ID
    },
    "properties": {
        "Course Name": {
            "title": [
                {
                    "text": {
                        "content": "trial"
                    }
                }
            ]
        }
    }
});
  console.log(response);
})();