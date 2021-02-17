import "reflect-metadata";
import { COOKIE_NAME, __prod__ } from "./constants";
import { Post } from './entities/Post';
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { InitialResolver } from "./resolvers/initial";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "./types";
import cors from 'cors';
import { User } from "./entities/User";
// import { sendEmail } from "./utils/sendEmail";
import {createConnection} from 'typeorm';
import path from "path";
import { Updoot } from "./entities/Updoot";
import { userLoader } from "./utils/userLoader";
import { voteStatusLoader } from "./utils/voteStatusLoader";

const main = async () => {
  // sendEmail('test-redis-app@mailinator.com', 'Tesy Send Email');
  // const orm = await MikroORM.init(config);
  const connectTypeorm = await createConnection({
    type: 'postgres',
    database: 'fakereddit2',
    username: 'postgres',
    password: 'postgres',
    logging: true,
    synchronize: true,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, './migrations/*')]
  });

 await connectTypeorm.runMigrations()

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis();

  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    })
  )

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis as any,
        disableTouch: true,
        disableTTL: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 5, // years,
        httpOnly: true,
        sameSite: 'lax',
        // secure: __prod__,
      },
      saveUninitialized: false,
      secret: "random_string",
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [InitialResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({req, res}): Context => ({
      req,
      res,
      redis,
      userLoader: userLoader(),
      voteStatusLoader: voteStatusLoader(),
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false});

  app.listen(4000, () => {
    console.log("server started on port 4000");
  });

  // const post = orm.em.create(Post, {title: "Test post title"});
  // await orm.em.persistAndFlush(post);
  // const posts = await orm.em.find(Post, {});
  // console.log(posts)
};

main().catch((e) => {
  console.log(e);
});
