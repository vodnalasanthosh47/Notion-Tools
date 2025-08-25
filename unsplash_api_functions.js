import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });

const error_Image_URL = 'https://images.unsplash.com/photo-1753262081045-ff9b365ef62a?q=80&w=680&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

function createUnsplashClient() {
  return createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
    fetch: nodeFetch,
  });
}

export async function getRandomImage(query = 'college study') {
    const unsplash = createUnsplashClient();
    try {
        const result = await unsplash.photos.getRandom({ query });
        return result.response.urls.regular;
    } catch (error) {
        console.error('Error fetching random image:', error);
        // return placeholder image
        console.log("\n-------------------\nReturning placeholder image due to error.");
        return error_Image_URL;
    }
}

// console.log("Testing: " + await getRandomImage());

