import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { Post } from "./Post";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => Int)
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @CreateDateColumn()
  updatedAt: Date;

  @Field()
  @Column({unique: true})
  username!: string;

  @Field()
  @Column({unique: true})
  email!: string;

  @Column({type: 'text'})
  password!: string;

  @OneToMany(() => Post, post => post.creator)
  posts: Post[]

  @OneToMany(() => Updoot, (updoot) => updoot.user)
  updoots: Updoot[]
}