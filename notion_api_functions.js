import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });
import util from 'util';
import {getRandomImage} from './unsplash_api_functions.js';
import { type } from 'os';
import { get } from 'http';
import moment from 'moment';
import { promises as fs } from 'fs';

const mainPageImage_URL = "https://images.unsplash.com/photo-1504805572947-34fad45aed93?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

export function checkIfENVIsSetup() {
    const requiredEnvVars = [
        "NOTION_API_KEY",
        "ACADS_DATABASE_ID",
        "SEMESTER_VIEW_DATABASE_ID"
    ];

    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            console.error(`Missing environment variable: ${envVar}`);
            return false;
        }
    }
    return true;
}

export function createNotionClient() {
    if (process.env.NOTION_API_KEY) {
        return new Client({ auth: process.env.NOTION_API_KEY });
    }
    else {
        throw new Error("Cannot create Notion client, environment variables not set up properly.");
    } 
}

export async function checkIfSemesterExists(semesterNumber, notionClient = null) {
    try {
        if (!notionClient) {
            notionClient = createNotionClient();
        }

        const response = await notionClient.databases.query({
            database_id: process.env.SEMESTER_VIEW_DATABASE_ID,
            filter: {
                property: 'Semester',
                title: {
                    equals: `Semester ${semesterNumber}`,
                },
            },
        });
        // console.log("Response from Notion API for checking semester existence:", util.inspect(response, { depth: null, colors: true, compact: false }));
        return response.results.length > 0;
    }
    catch (error) {
        console.error('Error checking if semester exists:', error);
        throw error;
    }
}

export async function createPage(parentId, isParentADatabase, properties, children, coverImageUrl = null, iconEmoji = null, notionClient = null) {
    try {
        if (!notionClient) {
            notionClient = createNotionClient();
        }
        
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

        // console.log("\n\n-----\nCreating page with properties:", util.inspect(newPage.properties, { depth: null, colors: true, compact: false }));
        // console.log("Cover Image URL:", coverImageUrl);
        // console.log("Icon Emoji:", iconEmoji);
        // console.log("\n-----\n\n")

        // creating the page
        const response = await notionClient.pages.create(newPage);
        // console.log("Response from Notion API:", util.inspect(response, { depth: null, colors: true, compact: false }));
        // Need to check if response is 200
        // if (!response || !response.id) {
        //     throw new Error("Failed to create page, response did not contain an ID.");
        // }
        return response;
    } catch (error) {
        console.error('Error creating page:', error);
        throw error;
    }
}

export async function getBlockChildren(parentId, notionClient = null) {
    try {
        if (!notionClient) notionClient = createNotionClient();

        const response = await notionClient.blocks.children.list({
            block_id: parentId,
        });
        return response.results;
    } catch (error) {
        console.error('Error fetching block children:', error);
        throw error;
    }
}

export async function appendBlockChildren(blockId, children, notionClient = null) {
    try {
        if (!notionClient) notionClient = createNotionClient();

        const response = await notionClient.blocks.children.append({
            block_id: blockId,
            children: children,
        });
        return response;
    } catch (error) {
        console.error('Error appending block children:', error);
        throw error;
    }
}

export async function createSemesterPage(semesterNumber, courses) {
    try {
        const numberEmojis = ["0️⃣", "1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"];
        console.log(numberEmojis[semesterNumber] + "\n\n-----------\n");
        var newSemesterProperties = {
            'Semester': {
                "title": [
                    {
                        "text": {
                            "content": `Semester ${semesterNumber}`,
                        },
                    },
                ],
            },
            'Number of Courses': {
                "number": courses.length,
            },
            'Credits': {
                "number": courses.reduce((total, course) => total + (Number(course.credits) || 0), 0),
            }
        };

        const callout_information_text = "This is your Semester " + semesterNumber + " page. You can add more details about this semester here, such as your goals, important dates, or any other information you'd like to keep track of.";
        const callout_setup_db_text = "Notion API restricts us from creating a linked database of Course Database. \
Please add the linked database manually by following these steps:\n\
1. Type into a black space “/data”. Select “Inline Database” option in the dropdown.\n \
2. In the prompt, select “Link to existing database”\n \
3. Search for and select your 'Course Database' database. Then select 'New Table view'\n \
4. In the filtering options, select “Semester” and then select the 'Semester" + semesterNumber + "' option.";
        var semesterPageChildren = [
            {
                "type": "breadcrumb",
                "breadcrumb": {}
            },
            {
                "type": "callout",
                "callout": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": callout_information_text
                            }
                        }
                    ]
                }
            },
            {
                "type": "callout",
                "callout": {
                    "rich_text": [
                        {
                            "type": "text",
                            "text": {
                                "content": callout_setup_db_text
                            }
                        }
                    ],
                    "color": "green_background",
                    "icon": {
                        "type": "emoji",
                        "emoji": "⚠️"
                    }
                },
            }
        ]

        var createPageResponse = await createPage(
            process.env.SEMESTER_VIEW_DATABASE_ID,
            true,
            newSemesterProperties,
            semesterPageChildren,
            await getRandomImage(),
            numberEmojis[semesterNumber]
        );
        
        if (!createPageResponse || !createPageResponse.id) {
            throw new Error("Failed to create semester page, response did not contain an ID.");
        }

        var semesterPageId = createPageResponse.id;
        return semesterPageId;
    } catch (error) {
        console.error('Error creating semester page:', error);
        throw error;
    }
}

async function addPropertiesToDatabase(databaseId, properties, notionClient) {
    try {
        if (!notionClient) notionClient = createNotionClient();

        const response = await notionClient.databases.update({
            database_id: databaseId,
            properties: properties,
        });
    }
    catch (error) {
        console.log('Error adding properties to database:', properties);
        console.error(error);
        throw error;
    }
}  

async function createResultsDatabase(coursePageId, courseName, notionClient = null) {
    const resultsEmojis = ["📊", "📈", "📝", "🏅", "🎖️", "🏆", "🧩", "🗂️", "🗃️", "🧭", "*️⃣"];
    var resultsDatabaseProperties = {
        "Exam Name": {
            "title": {},
        }
    };
    try {
        if (!notionClient) notionClient = createNotionClient();

        const resultsDatabaseResponse = await notionClient.databases.create({
            "parent": {
                "type": "page_id",
                "page_id": coursePageId,
            },
            "icon": {
                "type": "emoji",
                "emoji": resultsEmojis[Math.floor(Math.random() * resultsEmojis.length)],
            },
            "title": [
                {
                    type: "text",
                    text: {
                        content: `Results for ${courseName}`,
                        link: null,
                    },
                }
            ],
            "properties": resultsDatabaseProperties,
            "is_inline": true,
        });


        if (!resultsDatabaseResponse) {
            throw new Error("Failed to create results database.");
        }

        await addPropertiesToDatabase(resultsDatabaseResponse.id, {
            "Exam Date": {
                "date": {},
            }
        }, notionClient);

        await addPropertiesToDatabase(resultsDatabaseResponse.id, {
            "Score": {
                "number": {},
            },
            "Total Marks": {
                "number": {},
            }
        }, notionClient);
        
        await addPropertiesToDatabase(resultsDatabaseResponse.id, {
            "Weightage": {
                "number": {},
            }
        }, notionClient);
        
        await addPropertiesToDatabase(resultsDatabaseResponse.id, {
            "Weighted Score": {
                "formula": {
                    "expression": "prop('Score') / prop('Total Marks') * prop('Weightage')",
                }
            }
        }, notionClient);
        // await addPropertiesToDatabase(resultsDatabaseResponse.id, {
        //     "Class Average": {
        //         "number": {},
        //     },
        //     "Class Effective Score": {
        //         "formula": {
        //             "expression": "prop('Class Average') / prop('Total Marks') * prop('Weightage')"
        //         }
        //     }
        // }, notionClient);
        
    } catch (error) {
        console.error(`Error creating results database for ${courseName}:`, error);
        throw error;
    }
}

export async function createCoursePage(semester_num, course) {
    // returns true if page is created, else false
    var professorNames = course.professor.split(',').map(name => name.trim());
    var bucketingTags = course.bucketing.split(',').map(tag => tag.trim());
    
    var newCourseProperties = {
        'Course Name': {
            "title": [
                {
                    "text": {
                        "content": course.name,
                    },
                },
            ],
        },
        '# of Credits': {
            "number": Number(course.credits),
        },
        'Semester': {
            "select": {
                "name": `Semester ${semester_num}`,
            }
        }
    };
    if (course.code.length > 0) {
        newCourseProperties['Course Code'] = {
            "rich_text": [
                {
                    "text": {
                        "content": course.code,
                    },
                },
            ],
        };
    }
    if (professorNames[0] != "") {
        newCourseProperties['Instructor Name'] = {
            "multi_select": professorNames.map(name => ({ "name": name })),
        };
    }
    if (bucketingTags[0] != "") {
        newCourseProperties['Bucketing'] = {
            "multi_select": bucketingTags.map(tag => ({ "name": tag })),
        };
    }
    
    var newCourseChildren = [
        {
            "type": "breadcrumb",
            "breadcrumb": {}
        },
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": []
            }
        },
        {
            "type": "toggle",
            "toggle": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": "TAs & Office Hours"
                        }
                    }
                ],
                children: [
                    {
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {
                                        "content": "<Add TAs and Office Hours details here>"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": []
            }
        },
        {
            "type": "toggle",
            "toggle": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": "Grading Scheme"
                        }
                    }
                ],
                "children": [
                    {
                        "type": "table",
                        "table": {
                            "table_width": 2,
                            "has_column_header": true,
                            "has_row_header": false,
                            "children": [
                                {
                                    "type": "table_row",
                                    "table_row": {
                                        "cells": [
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": "Component"
                                                    }
                                                }
                                            ],
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": "Weightage"
                                                    }
                                                }
                                            ]
                                        ]
                                    }
                                },
                                {
                                    "type": "table_row",
                                    "table_row": {
                                        "cells": [
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ],
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ]
                                        ]
                                    }
                                },
                                {
                                    "type": "table_row",
                                    "table_row": {
                                        "cells": [
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ],
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ]
                                        ]
                                    }
                                },
                                {
                                    "type": "table_row",
                                    "table_row": {
                                        "cells": [
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ],
                                            [
                                                {
                                                    "type": "text",
                                                    "text": {
                                                        "content": ""
                                                    }
                                                }
                                            ]
                                        ]
                                    }
                                },
                            ]
                        }
                    }
                ]
            }
        },
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": []
            }
        },
        {
            "type": "toggle",
            "toggle": {
                "rich_text": [
                    {
                        "type": "text",
                        "text": {
                            "content": "Grading"
                        }
                    }
                ],
                children: [
                    {
                        "type": "paragraph",
                        "paragraph": {
                            "rich_text": [
                                {
                                    "type": "text",
                                    "text": {
                                        "content": "<Add Grading details here>"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }
        },
        {
            "type": "paragraph",
            "paragraph": {
                "rich_text": []
            }
        },
    ]

    var newCoursePageResponse = await createPage(process.env.ACADS_DATABASE_ID, true, newCourseProperties, newCourseChildren, await getRandomImage(course.name), course.emoji);
    if (!newCoursePageResponse || !newCoursePageResponse.id) {
        return false;
    }
    var newCoursePageId = newCoursePageResponse.id;

    // create a new database of results now
    await createResultsDatabase(newCoursePageId, course.name);
    return true;
}

export async function extractAcads_and_Semester_PageIDs(notion_page_link, notionClient = null) {
    var link_split = notion_page_link.split('/');
    var link_split_end = link_split[link_split.length - 1].split('-');
    var parentPageID = link_split_end[link_split_end.length - 1];

    try {
        if (!notionClient) notionClient = createNotionClient();

        const response = await notionClient.blocks.children.list({ block_id: parentPageID });
        var pageIDs = [];
        response.results.forEach( (object) => {
            if (object.type === 'child_database') {
                pageIDs.push(object.id);
            }
        });

        // pageIDs length must be 2
        if (pageIDs.length !== 2) {
            throw new Error("Expected 2 child database IDs");
        }
        return pageIDs;
    } catch (error) {
        console.error("Error fetching child blocks:", error);
        throw new Error("Failed to get database IDs. It might occur if you have provided an invalid Notion page link or you have not given the proper Notion Integration key with proper access.");
    }
}

async function getSemesterWiseGPAContribution(notionClient = null) {
    // returns an object mapping semester numbers to their total GPA contributions
    // {"Semester 1": {"gpa constribution": 66.6, "credits": 18, "# courses": 6 }, ...}
    var semesterWiseGPAData = {};
    try {
        if (!notionClient) notionClient = createNotionClient();

        const courses = await notionClient.databases.query({
            database_id: process.env.ACADS_DATABASE_ID,
            page_size: 100,
        });
        courses.results.forEach( (course) => {
            var semester = course.properties['Semester'].select.name;
            var gpaContribution = course.properties['GPA Contribution'].formula.number || 0;
            var credits = course.properties['# of Credits'].number || 0;

            if (!semesterWiseGPAData[semester]) {
                // if semester not already present, initialize it
                semesterWiseGPAData[semester] = {
                    "gpa contribution": 0,
                    "credits": 0,
                    "# courses": 0
                };
            }
            semesterWiseGPAData[semester]["gpa contribution"] += gpaContribution;
            semesterWiseGPAData[semester]["credits"] += credits;
            semesterWiseGPAData[semester]["# courses"] += 1;
        });
    } catch (error) {
        console.error("Error fetching semester-wise GPA contribution:", error);
    }
    return semesterWiseGPAData;
}

async function updateCGPAQuote(cgpa, notionClient = null) {
    try {
        if (!notionClient) notionClient = createNotionClient();

        if (!process.env.CGPA_QUOTE_PAGE_ID) {
            var link_split = process.env.NOTION_PARENT_LINK.split('/');
            var link_split_end = link_split[link_split.length - 1].split('-');
            var parentPageID = link_split_end[link_split_end.length - 1];
            const response = await notionClient.blocks.children.list({ block_id: parentPageID });
            let quote_page_id;
            for (var object of response.results) {
                if (object.type === 'quote') {
                    quote_page_id = object.id;
                    break;
                }
            }

            if (!quote_page_id) {
                throw new Error("No quote block found in the main page to update CGPA.");
            }

            process.env.CGPA_QUOTE_PAGE_ID = quote_page_id;
            fs.appendFile('secrets.env', `\nCGPA_QUOTE_PAGE_ID="${quote_page_id}"`, 'utf8');
        }

        // updating the quote block now
        const response = await notionClient.blocks.update({
            block_id: process.env.CGPA_QUOTE_PAGE_ID,
            quote: {
                rich_text: [
                    {
                        type: "text",
                        text: {
                            content: `Overall CGPA: ${cgpa}/4.00\n~Up to date as of: ${moment().format("MMMM Do YYYY, h:m A")}`
                        }
                    }
                ]
            }
        });
    } catch (error) {
        console.error("Error updating CGPA quote:", error);
    }
}

async function getSemesterPageIds(notionClient = null) {
    var semesterPageIds = {};
    try {
        if (!notionClient) notionClient = createNotionClient();

        const semester_pages_response = await notionClient.databases.query({
            database_id: process.env.SEMESTER_VIEW_DATABASE_ID,
            page_size: 100,
        });
        console.log(util.inspect(semester_pages_response.results[0], { depth: null, colors: true, compact: false }));
        semester_pages_response.results.forEach( (semester_page) => {
            semesterPageIds[semester_page.properties['Semester'].title[0].plain_text] = semester_page.id;
        })
    }
    catch (error) {
        console.error("Error fetching semester page IDs:", error);
    }
    return semesterPageIds;
}

async function updateSemesterPageProperties(semesterWiseData, semesterPageIds, notionClient = null) {
    try {
        if (!notionClient) notionClient = createNotionClient();
    }
    catch (error) {
        console.error("Unable to create notion Client for updating Semester Page Properties", error);
        return;
    }

    for (var semester in semesterPageIds) {
        console.log(semester);
        if (!semesterWiseData[semester]) {
            console.log("In here")
            semesterWiseData[semester] = {
                "gpa contribution": 0,
                "credits": 0,
                "# courses": 0
            };
        }

        try {
            await notionClient.pages.update({
                page_id: semesterPageIds[semester],
                properties: {
                    'Credits': {
                        "number": semesterWiseData[semester]["credits"],
                    },
                    'Number of Courses': {
                        "number": semesterWiseData[semester]["# courses"],
                    },
                    'GPA Contribution': {
                        "number": Number(semesterWiseData[semester]["gpa contribution"].toFixed(2)),
                    }
                }
            });
        }
        catch (error) {
            console.error(`Error updating properties for ${semester}:`, error);
        }
    }
}


export async function updateCGPA(notionClient = null) {
    let numberOfSemesters = 0;
    let aggregateSGPA = 0;
    let cgpa = 0.00;
    try {
        if (!notionClient) notionClient = createNotionClient();

        let semesterWiseData = await getSemesterWiseGPAContribution(notionClient);
        let semesterPageIds = await getSemesterPageIds(notionClient);
        console.log("Retrieved semester-wise GPA contribution data successfully");
        
        for (var semester in semesterWiseData) {
            let sgpa = 0;
            if (semesterWiseData[semester]["credits"] > 0) {
                sgpa = semesterWiseData[semester]["gpa contribution"] / semesterWiseData[semester]["credits"];
                sgpa = Math.floor(sgpa * 100) / 100; // rounding to 2 decimal places
                semesterWiseData[semester]["sgpa"] = sgpa;
                aggregateSGPA += sgpa;
                if (sgpa > 0) numberOfSemesters += 1;    // assuming semesters with 0 SGPA are not counted
            }
            else {
                semesterWiseData[semester]["sgpa"] = 0;
            }
        }

        if (numberOfSemesters > 0) {
            cgpa = (aggregateSGPA / numberOfSemesters);
            cgpa = Math.floor(cgpa * 100) / 100; // rounding to 2 decimal places
        }
        await updateCGPAQuote(cgpa, notionClient);
        console.log(`Updated CGPA Quote Successfully.`);

        // update the semester view database's properties too
        updateSemesterPageProperties(semesterWiseData, semesterPageIds, notionClient);
        return {overallCGPA: Number(cgpa), semesterWideData: semesterWiseData};
    } catch (error) {
        console.error("Error updating CGPA:", error);
    }
}

// Testing
// const notionClient = createNotionClient();
// // I want a list of all pages in the Acads database
// const results = await notionClient.databases.query({database_id: process.env.ACADS_DATABASE_ID, page_size: 100});
// var course = results.results[0];
// // console.log(util.inspect(results.results[0], { depth: null, colors: true, compact: false }));

// console.log("Credits: " + course.properties['# of Credits'].number);
// console.log("\nSemester: " + course.properties['Semester'].select.name);
// console.log("\nGPA Contribution: " + course.properties['GPA Contribution'].formula.number);

// var data = getSemesterWiseGPAContribution();
// console.log(util.inspect(await data, { depth: null, colors: true, compact: false }));

