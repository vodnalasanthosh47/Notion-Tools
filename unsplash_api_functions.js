import { createApi } from 'unsplash-js';
import nodeFetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config({ path: './secrets.env' });

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY,
  fetch: nodeFetch,
});

unsplash.photos.getRandom({query: 'college study',}).then(result => {
  console.log(result);
}).catch(error => {
  console.error(error);
});