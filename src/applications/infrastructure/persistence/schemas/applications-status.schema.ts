//? Imports de codigo
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({ _id: false, versionKey: false, timestamps: false })
export class ApplicationStatusHistory {
  @Prop({ required: true, type: String, trim: true })
  statusTitle: string;

  @Prop({ required: true, type: String, trim: true })
  statusDate: string;
}

export const ApplicationStatusHistorySchema = SchemaFactory.createForClass(
  ApplicationStatusHistory,
);
