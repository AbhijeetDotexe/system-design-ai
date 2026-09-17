import mongoose, { Schema, Document } from "mongoose";

export interface IDiagram extends Document {
  ownerId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  document: Record<string, unknown>;
  thumbnail?: string;
  shareToken?: string;
  isPublic: boolean;
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DiagramSchema = new Schema<IDiagram>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, default: "Untitled Architecture" },
    description: { type: String, trim: true },
    document: { type: Schema.Types.Mixed, required: true },
    thumbnail: { type: String },
    shareToken: { type: String, unique: true, sparse: true, index: true },
    isPublic: { type: Boolean, default: false },
    version: { type: Number, default: 1 },
    tags: [{ type: String }]
  },
  {
    timestamps: true
  }
);

DiagramSchema.index({ ownerId: 1, updatedAt: -1 });
DiagramSchema.index({ title: "text", description: "text" });

export const Diagram = mongoose.model<IDiagram>("Diagram", DiagramSchema);
