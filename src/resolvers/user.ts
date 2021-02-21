import { User } from "../entities/User";
import {
  Field,
  InputType,
  Mutation,
  Resolver,
  Arg,
  Ctx,
  ObjectType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { Context } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";

@InputType()
export class UserInput {
  @Field(() => String)
  username: string;
  @Field(() => String)
  email: string;
  @Field(() => String)
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User,  @Ctx() { req }: Context) {
     //@ts-ignore
    if(req.session.userId === user.id) {
      return user.email;
    }
    return '';
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: Context) {
    //@ts-ignore
    if (!req.session.userId) {
      return null;
    }
    //@ts-ignore
    return User.findOne({where: {id: req.session.userId}})
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UserInput,
    @Ctx() { req }: Context
  ) {
    const invalidResult = validateRegister(options); 

    if(invalidResult) {
      return invalidResult;
    }

    const hashedPassword = await argon2.hash(options.password);
    
    let user;
    try {
      // user = await User.create(options).save();

      const result = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(User)
      .values({
        username: options.username,
        password: hashedPassword,
        email: options.email
      })
      .returning('*')
      .execute();
      user = result.raw[0];
  
      //@ts-ignore
      req.session.userId = user.id;
      return {
        user,
      };
    } catch (e) {
      if (e.detail?.includes("already exists")) {
        return {
          errors: [
            {
              field: "username",
              message: "that username already exists",
            },
          ],
        };
      }
      return {
        errors: [e],
      };
    }
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ) {
    const user = await User.findOne({where: usernameOrEmail.includes('@') ? { email:  usernameOrEmail} : { username:  usernameOrEmail}});
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);

    if (valid) {
      //@ts-ignore
      req.session.userId = user.id;
    }
    
    return valid
      ? {
          user,
        }
      : {
          errors: [
            {
              field: "password",
              message: "password isn't correct",
            },
          ],
        };
  }

  @Mutation(() => Boolean)
  logout(
    @Ctx() {req, res}: Context
  ) {
    return new Promise(result => req.session.destroy(err => {
      if(err) {
        result(false);
        return;
      } 
      res.clearCookie(COOKIE_NAME);
      result(true);
    })) 
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() {redis} : Context
  ) {
    const user = await User.findOne({where: {email}});
    if (!user) {
      return true;
    }

    const token = v4();

    await redis.set(FORGET_PASSWORD_PREFIX + token, user.id, 'ex', 36000 * 24);

    await sendEmail(user.email, 
      `<a href="${process.env.CORS_ORGIN}/change-password/${token}">Reset password</a>`
    );
    
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('password') password: string,
    @Arg('token') token: string,
    @Ctx() {req, redis} : Context
  ): Promise<UserResponse> {
    if (password?.length < 5) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "password is too short",
          },
        ],
      };
    }

    const userId = await redis.get(FORGET_PASSWORD_PREFIX + token);

    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const id  = parseInt(userId);
    const user = await User.findOne({where: {id: parseInt(userId)}});

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user does not exist",
          },
        ],
      };
    }

    user.password = await argon2.hash(password);

    //@ts-ignore
    req.session.userId = id;

    await redis.del(FORGET_PASSWORD_PREFIX + token);

    // await em.persistAndFlush(user);

    await User.update({id}, {password: user.password}) 

    return {
      user
    }
  }
}
