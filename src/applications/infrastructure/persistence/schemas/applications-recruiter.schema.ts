//? Imports de codigo
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

//? Imports de usuario
import { urlLinkedInValidator } from "./validators/common.validator";

@Schema({ _id: false, versionKey: false, timestamps: false })
export class Recruiter {
  @Prop({ required: false, type: String, trim: true })
  name: string;

  @Prop({
    required: false,
    type: String,
    trim: true,
    validate: urlLinkedInValidator,
  })
  profileLink: string;

  @Prop({ required: false, type: String, trim: true })
  headline: string;
}

export const RecruiterSchema = SchemaFactory.createForClass(Recruiter);
