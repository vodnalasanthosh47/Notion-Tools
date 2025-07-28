import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });

function createUnsplashClient() {
  return createApi({
    accessKey: process.env.UNSPLASH_ACCESS_KEY,
    fetch: nodeFetch,
  });
}

export async function getRandomImage(query = 'college study') {
    // const unsplash = createUnsplashClient();
    try {
        const result = await unsplash.photos.getRandom({ query });
        return result.response.urls.regular;
    } catch (error) {
        console.error('Error fetching random image:', error);
        // return placeholder image
        console.log("\n-------------------\nReturning placeholder image due to error.");
        return 'https://unsplash.com/photos/blurred-image-of-trees-with-orange-foliage-eJ2MY7Zp3i0';
    }
}

// console.log("Testing: " + await getRandomImage());

