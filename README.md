# Notion-Tools v2
Notion-Tools is a web application designed to optimize your academic workflow in Notion by leveraging the Notion API. It provides a streamlined setup process, automation for semester and course management, and automatic cgpa calculator. Many features are currently being developed, like results tracking and calendar management. 

## Table of Contents
- [💡 The Idea](#-the-idea)
- [⚙️ Installation & Usage](#-installation--usage)
- [🚀 Features](#-features)
- [⚙️ Setup Process](#-setup-process)
- [📁 File Structure](#-file-structure)
- [🔒 Environment Variables](#-environment-variables)


## 💡 The Idea
For a person new to Notion, setting up an academic database from scratch is tedious and time-consuming. With Notion-Tools, the goal is to simplify this process by giving a Notion Template which they can duplicate and access a easy to use web app. Once the setup is complete, the user can use the tools in the app to easily manage the Notion workspace without having to manually create pages & databases, edit information and setup.

## ⚙️ Installation & Usage
1. Clone the repository:
   ```
   git clone https://github.com/vodnalasanthosh47/Notion-Tools.git
   ```
2. Navigate to the project directory:
   ```
   cd Notion-Tools
   ```
3. Install dependencies:
    ```
    npm install
    ```

Usage:

4. Start the server:
   ```
   node server.js
   ```
5. Visit `http://localhost:3000` in your browser.

## 🚀 Features

- **Automatic CGPA Calculator (new v2 feature)**

  - Calculates overall CGPA and semester-wise GPA for all semesters in the Notion database.
  - Displays the calculated CGPA and GPA on a dedicated page.
  - Updates the data into the Notion database.

- **Automated Semester & Course Management**

  - Add new semesters and courses directly from the web interface.
  - Automatically creates pages in your Notion workspace.

- **Setup Wizard**

  - Step-by-step instructions for duplicating templates, creating integrations, and configuring environment variables.
  - Form validation and feedback for successful/failed setup.

- **Unsplash Integration (Optional)**

  - Fetch random images for courses to personalize your Notion pages.

## ⚙️ Setup Process

This information is presented to you once youu visit the app for the first time or if the setup is incomplete. Follow these steps to get started:

1. **Duplicate Academic Database Template**

   - Duplicate the [Academic Database Template](https://vodnalasanthosh47.notion.site/Academic-Database-Template-259a748860ab8052835df736bb06e4d6) into your Notion workspace.
   - Follow the link, log in, and click the duplicate icon.

2. **Create a Notion Integration**

   - Go to [Notion Integrations](https://www.notion.so/my-integrations).
   - Click "New Integration", name it, select your workspace, and set type to "Internal".
   - Save and copy the "Internal Integration Secret".
   - Edit access to allow the integration to access your Academic Database.

3. **Set Up Environment Variables**
   - Enter your Notion Integration Token and Database Link in the setup form.
   - Optionally, add Unsplash API keys for image customization (Notion page covers).
   - The app will validate and save your keys in `secrets.env`.

## 📁 File Structure

```
Notion-Tools/
├── notion_api_functions.js         # Notion API integration and utility functions
├── unsplash_api_functions.js       # Unsplash API integration functions
├── server.js                       # Express server and route handlers
├── package.json                    # Project dependencies and scripts
├── secrets.env                     # Environment variables (API keys, database links)
├── README.md                       # Project documentation
├── public/
│   ├── add_semester.html           # Add semester page
│   ├── home.html                   # Home page
│   ├── css/
│   │   └── styles.css              # Main stylesheet
│   ├── images/                     # Setup and feature images
│   └── js/
│       ├── add_semester_script.js  # JS for add semester page
│       └── welcome_script.js       # JS for home/setup page
├── views/
│   ├── added_semester.ejs          # Confirmation page after adding semester
│   └── setup.ejs                   # Setup instructions and form
│   └── calculate_cgpa.ejs          # CGPA calculation page
└── .gitignore                      # Files to ignore in git
```


## 🔒 Environment Variables

All API keys and database links are stored in `secrets.env`. Never share this file publicly.
```sh
NOTION_API_KEY= "Notion-Integration-Key"
NOTION_PARENT_LINK= "Notion-Acadamic-Database-URL"
ACADS_DATABASE_ID= "Notion-Courses-Database-ID"
SEMESTER_VIEW_DATABASE_ID= "Notion-Semesters-Database-ID"
CGPA_QUOTE_PAGE_ID= "Notion-Block-ID-for-CGPA-Quote"
UNSPLASH_ACCESS_KEY= "Unsplash-API-Access-Key"    # optional
UNSPLASH_SECRET_KEY= "Unsplash-API-Secret-Key"    # optional
```

## 💡 Contributing

Feel free to fork and contribute! Suggestions and improvements are welcome.

