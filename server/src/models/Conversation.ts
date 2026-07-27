import { Schema, model, Document, Types } from "mongoose";
import { ConversationStatus } from "../types/index";

export interface IConversation extends Document {
  _id: Types.ObjectId;
  user: Types.ObjectId;
  subject: string;
  status: ConversationStatus;
  lastMessageAt: Date;
  unreadCountUser: number;
  unreadCountAdmin: number;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, default: "Support request" },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCountUser: { type: Number, default: 0 },
    unreadCountAdmin: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<IConversation>("Conversation", conversationSchema);