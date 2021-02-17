import { Query, Resolver } from "type-graphql";

@Resolver()
export class InitialResolver {
    @Query(() => String)
    init() {
        return "init resolver";   
    }
}