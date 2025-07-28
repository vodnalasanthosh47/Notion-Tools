import { Client } from '@notionhq/client';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });
import util from 'util';
import {getRandomImage} from './unsplash_api_functions.js';


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
    var semesterPageId = createPageResponse.id;
    return semesterPageId;
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
        'Course Code': {
            "rich_text": [
                {
                    "text": {
                        "content": course.code,
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
        },
        'Instructor Name': {
            "multi_select": professorNames.map(name => ({ "name": name })),
        },
        'Bucketing': {
            "multi_select": bucketingTags.map(tag => ({ "name": tag })),
        },
    };

    await createPage(process.env.ACADS_DATABASE_ID, true, newCourseProperties, [], await getRandomImage(course.name), course.emoji);
}

// Testing
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

var courses = [
    {
      "emoji": "⬆️",
      "name": "wjehbj ",
      "code": "AGD56",
      "credits": "4",
      "professor": "Dinesh, Karthik",
      "bucketing": "Theory, Systems"
    },
    {
      "emoji": "😊",
      "name": "sr;khg ",
      "code": "W47H",
      "credits": "1",
      "professor": "Harish",
      "bucketing": "Systems"
    }
];
courses.forEach(async course => {
    await createCoursePage(5, course);
});