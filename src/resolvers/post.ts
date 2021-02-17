import { Post } from "../entities/Post";
import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Context } from "../types";
import { isAuth } from "../middleware/isAuth";
import { getConnection } from "typeorm";
import { Updoot } from "../entities/Updoot";
import { User } from "../entities/User";

@InputType()
class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[]
  @Field()
  hasMore: boolean
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    return root.text.slice(0, 150) + '...';
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: Context) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, {nullable: true})
  async voteStatus(@Root() post: Post, @Ctx() { voteStatusLoader, req }: Context){
    //@ts-ignore
    const creatorId = req.session.userId;
    if(!creatorId) {
      return null;
    }

   const updoot = await voteStatusLoader.load({postId: post.id, userId: creatorId});
   return updoot ? updoot.value : null;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: Context
  ): Promise<PaginatedPosts> {
    const lim = Math.min(50, limit) + 1;
    //@ts-ignore
    const creatorId = req.session.userId;

    const replacementArray: any = [lim];

    if (cursor) {
      replacementArray.push(new Date(parseInt(cursor)));
    }

    console.log(replacementArray);
    const posts = await getConnection().query(
      `
    select p.*
    from post p
    ${cursor ? `where p."createdAt" < $2` : ''}
    order by p."createdAt" DESC
    limit $1
    `, replacementArray);

    return { posts: posts.slice(0, limit), hasMore: posts.length === lim };
  }

  @Query(() => Post, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("post") post: PostInput,
    @Ctx() { req }: Context
  ): Promise<Post | undefined> {
    //@ts-ignore
    const creatorId = req.session.userId;
    return Post.create({
      ...post,
      creatorId,
    }).save();
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: Context
  ) {
    //@ts-ignore
    const { userId } = req.session;
    const realValue = value !== -1 ? 1 : -1;
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has already voted and change his vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async tm => {
        await tm.query(`
    update updoot
    set value = $1
    where "postId" = $2 and "userId" = $3
        `, [realValue, postId, userId]);

        await tm.query(`
      update post 
      set points = points + $2
      where id = $1;
      `, [postId, 2 * realValue]);
      })
    } else if (!updoot) { // never vote before
      await getConnection().transaction(async tm => {
        await tm.query(`
    insert into updoot("userId", "postId", value)
    values ($1,$2,$3);
        `, [userId, postId, realValue]);

        await tm.query(`
      update post 
      set points = points + $2
      where id = $1;
      `, [postId, realValue]);
      })
    }

    return true;
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id",  () => Int) id: number,
    @Arg("post") post: PostInput,
    @Ctx() { req }: Context
  ): Promise<Post | undefined> {
    //@ts-ignore
    const { userId } = req.session;
    const prevPost = await Post.findOne(id);
    if (!prevPost) {
      return undefined;
    }

    if (prevPost.creatorId !== userId) {
      throw new Error('not authorized')
    }

    if (post) {
      prevPost.title = post.title;
      prevPost.text = post.text;
      await Post.update({ id, creatorId: userId }, { ...prevPost, ...post });
    }
    return prevPost;
  }

  @Mutation(() => Boolean, { nullable: true })
  @UseMiddleware(isAuth)
  async deletePost(@Arg("id", () => Int) id: number, @Ctx() { req }: Context): Promise<boolean> {
    //@ts-ignore
    const { userId } = req.session;

    const post = await Post.findOne(id);
    if (!post) {
      return false;
    }

    if (post.creatorId !== userId) {
      throw new Error('not authorized')
    }

    await Updoot.delete({ postId: id, userId })
    await Post.delete({ id, creatorId: userId });

    return true;
  }
}
