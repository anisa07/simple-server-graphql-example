import DataLoader from "dataloader";
import { Updoot } from "../entities/Updoot";

// passing user ids getting user objects
export const voteStatusLoader = () => new DataLoader<{postId: number, userId: number}, Updoot | null>(
    async (keys) => {
    const updoots = await Updoot.findByIds(keys as any[]);
   // return updoots
   console.log('updoots', updoots);
   const testMap: Record<string, Updoot> = {};
   updoots.forEach(u => {
     testMap[`${u.userId} ${u.postId}`] = u;
   });
    console.log('updoots.map', keys.map((key) => testMap[`${key.userId} ${key.postId}`]))
    return keys.map((key) => testMap[`${key.userId} ${key.postId}`]);
})