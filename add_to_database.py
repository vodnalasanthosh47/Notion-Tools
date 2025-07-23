import os
from dotenv import load_dotenv
import requests

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
    "parent": {"database_id": DATABASE_ID},
    "properties": {
        "Imp Name": {
            "title": [
                {
                    "text": {
                        "content": "Trial 1"
                    }
                }
            ]
        },
        "Crazy Number": {
            "number": 1234
        },
        "Options": {
            "select": {
                "name": "Option 1"
            }
        }
    }
}

print(add_to_notion_database(new_page_data))
