import DataLoader from "dataloader";
import { User } from "../entities/User";

// passing user ids getting user objects
export const userLoader = () => new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    });
    return userIds.map((userId) => userIdToUser[userId]);
})