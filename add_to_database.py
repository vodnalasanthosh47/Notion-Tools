import os
from dotenv import load_dotenv
import requests
import json

dotenv_path = 'secrets.env'
load_dotenv(dotenv_path=dotenv_path)
NOTION_API_KEY = os.environ["NOTION_API_KEY"]
DATABASE_ID = os.environ["DATABASE_ID"]

def add_to_notion_database(page_data):
    url = "https://api.notion.com/v1/pages"
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }
    response = requests.post(url, headers=headers, json=page_data)
    return response.json()

new_page_data = {
    # "parent": {"database_id": DATABASE_ID},
    "properties": {
        "Imp Name": {
            "title": [
                {
                    "text": {
                        "content": "Trial 3"
                    }
                }
            ]
        },
        "Crazy Number": {
            "number": 67865
        },
        "Options": {
            "select": {
                "name": "Option 87"
            }
        }
    },
    "children": [
        {
            "object": "block",
            "child_database": {
                "title": "My database"
            }
        }
    ]
}

response = add_to_notion_database(new_page_data)
if response.get("object") != "error":
    print("Page added successfully: ", response.get("id"))
else:
    print("Failed to add page:")
    print(json.dumps(response, indent=2))
