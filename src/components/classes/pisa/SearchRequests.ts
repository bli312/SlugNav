import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

export async function GET(url: string): Promise<AxiosResponse> {
  let fetches: number = 0;
  const maxFetches: number = 5;

  while (fetches < maxFetches) {
    try {
      return axios.get(url);
    } catch (e) {
      fetches++;
      console.log(`[GET EXCEPTION] ${e}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * fetches));
  }
  throw new Error(
    `[ERROR] Could not fetch ${url} after ${maxFetches} attempts`,
  );
}

export async function POST(
  url: string,
  data: unknown,
  options?: AxiosRequestConfig,
): Promise<AxiosResponse> {
  let posts = 0;
  const maxPosts = 5;

  while (posts < maxPosts) {
    try {
      return await axios.post(url, data, options);
    } catch (e) {
      posts++;
      console.log(`[POST EXCEPTION] ${e}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * posts));
  }
  throw new Error(`Could not POST URL ${url} after ${maxPosts} attempts`);
}
