import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, OneToMany } from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import { User } from "./User";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Post extends BaseEntity {
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
  @Column({type: 'text'})
  title!: string;

  @Field()
  @Column({type: 'text'})
  text!: string;

  @Field()
  @Column({type: 'int', default: 0})
  points!: number;

  @Field()
  @Column()
  creatorId: number;

  @Field()
  @ManyToOne(() => User, user => user.posts)
  creator: User;

  @OneToMany(() => Updoot, (updoot) => updoot.post)
  updoots: Updoot[]

  @Field(() => Int, {nullable: true})
  voteStatus: number | null; // 1 or -1 or null
}