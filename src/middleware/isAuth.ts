import { Context } from "../types";
import { MiddlewareFn } from "type-graphql";

export const isAuth: MiddlewareFn<Context> = ({context}, next) => {
    //@ts-ignore
    if(!context.req.session.userId) {
        throw new Error('Not authenticated user!')
    }

    return next();
}