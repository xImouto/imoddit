import { Visibility } from "@prisma/client";
import { Resolver, Query, Ctx, Arg, Mutation, InputType, Field } from "type-graphql";
import { authenticate, authenticateWithPost, notAuthenticatedErr, notAuthorizedErr } from "../utils";

import { Post, PostResponse } from "../entities";
import { Context } from "../types";

@InputType()
class CreatePostInput {
  @Field()
  title!: string;

  @Field()
  content!: string;

  @Field({ nullable: true })
  visibility?: Visibility;
}

@InputType()
class UpdatePostInput {
  @Field({ nullable: true })
  title!: string;

  @Field({ nullable: true })
  content!: string;

  @Field({ nullable: true })
  visibility!: Visibility;
}

@Resolver()
export class PostResolver {
  @Query(() => [Post])
  findAllPosts(@Ctx() { prisma }: Context) {
    return prisma.post.findMany({
      where: { visibility: "public" },
    });
  }

  @Query(() => Post)
  findOnePost(@Ctx() { prisma }: Context, @Arg("id") id: string) {
    return prisma.post.findFirst({ where: { id, visibility: "public" } });
  }

  @Mutation(() => PostResponse)
  async updatePost(@Ctx() context: Context, @Arg("UpdatePostInput") input: UpdatePostInput, @Arg("postId") id: string) {
    try {
      const postToUpdate = await authenticateWithPost(context, id);
      const post = await context.prisma.post.update({
        data: {
          ...input,
        },
        where: { id: postToUpdate.id },
        include: { comments: true },
      });
      return { post };
    } catch (err) {
      return notAuthorizedErr();
    }
  }

  @Mutation(() => PostResponse)
  async deletePost(@Ctx() context: Context, @Arg("postId") id: string) {
    try {
      const postToUpdate = await authenticateWithPost(context, id);
      const post = await context.prisma.post.delete({
        where: { id: postToUpdate.id },
        include: { comments: true },
      });
      return { post };
    } catch (err) {
      return notAuthorizedErr();
    }
  }

  @Mutation(() => PostResponse)
  async createPost(@Ctx() context: Context, @Arg("CreatePostInput") input: CreatePostInput) {
    try {
      const user = await authenticate(context);
      const post = await context.prisma.post.create({
        data: {
          ...input,
          authorId: user.id,
        },
        include: { comments: true },
      });
      return { post };
    } catch (err) {
      return notAuthenticatedErr();
    }
  }
}
