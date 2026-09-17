import mongoose, { Schema, Document } from "mongoose";

export interface IDiagramVersion extends Document {
  diagramId: mongoose.Types.ObjectId;
  versionNumber: number;
  label?: string;
  document: Record<string, unknown>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const DiagramVersionSchema = new Schema<IDiagramVersion>(
  {
    diagramId: { type: Schema.Types.ObjectId, ref: "Diagram", required: true, index: true },
    versionNumber: { type: Number, required: true },
    label: { type: String, default: "Manual Save" },
    document: { type: Schema.Types.Mixed, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

DiagramVersionSchema.index({ diagramId: 1, versionNumber: -1 });

export const DiagramVersion = mongoose.model<IDiagramVersion>("DiagramVersion", DiagramVersionSchema);
