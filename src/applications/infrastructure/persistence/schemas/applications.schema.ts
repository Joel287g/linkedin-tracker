//? Imports de codigo
import { Document } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

//? Imports de usuario
import {
  ApplicationStatusHistory,
  ApplicationStatusHistorySchema,
} from "./applications-status.schema";
import { Recruiter, RecruiterSchema } from "./applications-recruiter.schema";
import { urlLinkedInValidator } from "./validators/common.validator";

@Schema({
  _id: true,
  versionKey: false,
  timestamps: true,
  collection: "applications",
  toJSON: {
    virtuals: true,
    versionKey: false,
  },
})
export class Application extends Document {
  @Prop({ required: true, type: String, unique: true, index: true })
  jobId: string;

  @Prop({ required: true, type: String, trim: true })
  title: string;

  @Prop({ required: true, type: String, trim: true, index: true })
  company: string;

  @Prop({ required: true, type: String, trim: true })
  location: string;

  @Prop({
    required: true,
    type: String,
    trim: true,
    unique: true,
    validate: urlLinkedInValidator,
  })
  link: string;

  @Prop({
    required: true,
    type: String,
    trim: true,
    maxlength: 15000,
  })
  description: string;

  @Prop({ required: true, type: [String], default: [] })
  requirements: string[];

  @Prop({
    required: true,
    type: [ApplicationStatusHistorySchema],
    default: [],
  })
  applicationStatusHistory: ApplicationStatusHistory[];

  @Prop({ required: true, type: RecruiterSchema, default: {} })
  recruiter: Recruiter;

  @Prop({
    required: true,
    type: String,
    index: true,
  })
  status: string;

  @Prop({ required: true, type: Date, default: Date.now })
  scrapedAt: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ required: true, type: Date, default: Date.now })
  updatedAt: Date;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
