// import { Connection, EntityManager, IDatabaseDriver } from "@mikro-orm/core";
import { Request, Response } from 'express'
import { Redis } from "ioredis";
import { userLoader } from './utils/userLoader';
import { voteStatusLoader } from './utils/voteStatusLoader';

export type Context = {
    // em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>
    req: Request;
    res: Response;
    redis: Redis;
    userLoader: ReturnType<typeof userLoader>
    voteStatusLoader: ReturnType<typeof voteStatusLoader>
} 