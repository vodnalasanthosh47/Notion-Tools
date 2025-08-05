import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });
import util from 'util';
import {getRandomImage} from './unsplash_api_functions.js';
import { type } from 'os';
import { get } from 'http';


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

        // console.log("\n\n-----\nCreating page with properties:", util.inspect(newPage.properties, { depth: null, colors: true, compact: false }));
        // console.log("Cover Image URL:", coverImageUrl);
        // console.log("Icon Emoji:", iconEmoji);
        // console.log("\n-----\n\n")

        // creating the page
        const response = await notion.pages.create(newPage);
        console.log("Response from Notion API:", util.inspect(response, { depth: null, colors: true, compact: false }));
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

export async function appendBlockChildren(blockId, children) {
    const notion = createNotionClient();
    try {
        const response = await notion.blocks.children.append({
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

        var createPageResponse = await createPage(
            process.env.SEMESTER_VIEW_DATABASE_ID,
            true,
            newSemesterProperties,
            [],
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

async function createResultsDatabase(coursePageId, courseName) {
    const notion = createNotionClient();
    try {
        const resultsEmojis = ["📊", "📈", "📝", "🏅", "🎖️", "🏆", "🧩", "🗂️", "🗃️", "🧭", "*️⃣"];
        var resultsDatabaseProperties = {
            "Exam Name": {
                "title": {},
            },
            "Exam Date": {
                "date": {},
            },
            "Score": {
                "number": {},
            },
            "Total Marks": {
                "number": {},
            },
            "Weightage": {
                "number": {},
            },
            "Effective Score": {
                "formula": {
                    "expression": "prop('Score') / prop('Total Marks') * prop('Weightage')",
                }
            },
            "Class Average": {
                "number": {},
            },
            "Class Effective Score": {
                "formula": {
                    "expression": "prop('Class Average') / prop('Total Marks') * prop('Weightage')"
                }
            }
        };

        const resultsDatabaseResponse = await notion.databases.create({
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
    } catch (error) {
        console.error(`Error creating results database for ${courseName}:`, error);
        throw error;
    }
}

export async function createCoursePage(semester_num, course) {
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
    if (course.code.length ) {
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
        newCourseProperties['Professor'] = {
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
    var newCoursePageId = newCoursePageResponse.id;

    // create a new database of results now
    await createResultsDatabase(newCoursePageId, course.name);
}

// Testing
//
// console.log("Testing createPage function");
// console.log(util.inspect(await createPage(process.env.DATABASE_ID, true, {}, [], "https://images.unsplash.com/photo-1686476846973-337a554eb274?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3ODM5MTR8MHwxfHJhbmRvbXx8fHx8fHx8fDE3NTM2Nzk2MTB8&ixlib=rb-4.1.0&q=80&w=1080", "😶‍🌫️"), { depth: null, colors: true, compact: false }));
// console.log("Testing createSemesterPage function");
// await createSemesterPage(5, [
//     {
//       "emoji": "⬆️",
//       "name": "wjehbj ",
//       "code": "AGD56",
//       "credits": "4",
//       "professor": "Dinesh, Karthik",
//       "bucketing": "Theory, Systems"
//     },
//     {
//       "emoji": "😊",
//       "name": "sr;khg ",
//       "code": "W47H",
//       "credits": "1",
//       "professor": "Harish",
//       "bucketing": "Systems"
//     }
//   ]);

// var courses = [
//     {
//       "emoji": "⬆️",
//       "name": "wjehbj ",
//       "code": "AGD56",
//       "credits": "4",
//       "professor": "Dinesh, Karthik",
//       "bucketing": "Theory, Systems"
//     },
//     {
//       "emoji": "😊",
//       "name": "sr;khg ",
//       "code": "W47H",
//       "credits": "1",
//       "professor": "Harish",
//       "bucketing": "Systems"
//     }
// ];
// courses.forEach(async course => {
//     await createCoursePage(5, course);
// });