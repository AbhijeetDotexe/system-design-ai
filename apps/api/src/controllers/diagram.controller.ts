import { ENV } from "../config/env.js";
import { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";
import { Diagram } from "../models/Diagram.js";
import { DiagramVersion } from "../models/DiagramVersion.js";
import { CreateDiagramSchema, UpdateDiagramSchema } from "@systemcraft/shared";

export class DiagramController {
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const search = req.query.search as string;

      const filter: any = { ownerId: userId };
      if (search) {
        filter.title = { $regex: search, $options: "i" };
      }

      const diagrams = await Diagram.find(filter)
        .sort({ updatedAt: -1 })
        .select("-document.nodes -document.edges");

      res.json({ success: true, data: diagrams });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const diagram = await Diagram.findById(id);

      if (!diagram) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Diagram not found" } });
        return;
      }

      // Check ownership unless public
      if (!diagram.isPublic && (!req.user || diagram.ownerId.toString() !== req.user.id)) {
        res.status(403).json({ success: false, error: { code: "FORBIDDEN", message: "Access denied" } });
        return;
      }

      res.json({ success: true, data: diagram });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateDiagramSchema.parse(req.body);
      const userId = req.user!.id;

      const defaultDocument = validated.document || {
        title: validated.title,
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 }
      };

      const diagram = await Diagram.create({
        ownerId: userId,
        title: validated.title,
        document: defaultDocument,
        thumbnail: validated.thumbnail,
        shareToken: nanoid(12)
      });

      // Create initial version
      await DiagramVersion.create({
        diagramId: diagram._id,
        versionNumber: 1,
        label: "Initial version",
        document: defaultDocument,
        createdBy: userId
      });

      res.status(201).json({ success: true, data: diagram });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const validated = UpdateDiagramSchema.parse(req.body);

      const diagram = await Diagram.findOne({ _id: id, ownerId: userId });
      if (!diagram) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Diagram not found or unauthorized" } });
        return;
      }

      if (validated.title) diagram.title = validated.title;
      if (validated.document) {
        diagram.document = validated.document;
        diagram.version += 1;
      }
      if (validated.thumbnail) diagram.thumbnail = validated.thumbnail;

      await diagram.save();

      res.json({ success: true, data: diagram });
    } catch (error) {
      next(error);
    }
  }

  static async duplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const source = await Diagram.findById(id);
      if (!source) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Diagram not found" } });
        return;
      }

      const clone = await Diagram.create({
        ownerId: userId,
        title: `${source.title} (Copy)`,
        document: source.document,
        thumbnail: source.thumbnail,
        shareToken: nanoid(12),
        version: 1
      });

      res.status(201).json({ success: true, data: clone });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const diagram = await Diagram.findOneAndDelete({ _id: id, ownerId: userId });
      if (!diagram) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Diagram not found" } });
        return;
      }

      await DiagramVersion.deleteMany({ diagramId: id });
      res.json({ success: true, data: { message: "Diagram deleted successfully" } });
    } catch (error) {
      next(error);
    }
  }

  static async share(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { isPublic } = req.body;

      const diagram = await Diagram.findOne({ _id: id, ownerId: userId });
      if (!diagram) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Diagram not found" } });
        return;
      }

      if (!diagram.shareToken) {
        diagram.shareToken = nanoid(12);
      }
      diagram.isPublic = typeof isPublic === "boolean" ? isPublic : true;
      await diagram.save();

      res.json({
        success: true,
        data: {
          shareToken: diagram.shareToken,
          isPublic: diagram.isPublic,
          shareUrl: `${ENV.CLIENT_URL}/share/${diagram.shareToken}`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  static async getByShareToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const diagram = await Diagram.findOne({ shareToken: token }).select("-ownerId");

      if (!diagram) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Shared diagram not found" } });
        return;
      }

      res.json({ success: true, data: diagram });
    } catch (error) {
      next(error);
    }
  }

  static async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const versions = await DiagramVersion.find({ diagramId: id })
        .sort({ versionNumber: -1 })
        .limit(20);
      res.json({ success: true, data: versions });
    } catch (error) {
      next(error);
    }
  }

  static async createVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { label, document } = req.body;

      const count = await DiagramVersion.countDocuments({ diagramId: id });
      const version = await DiagramVersion.create({
        diagramId: id,
        versionNumber: count + 1,
        label: label || `Version ${count + 1}`,
        document,
        createdBy: userId
      });

      res.status(201).json({ success: true, data: version });
    } catch (error) {
      next(error);
    }
  }
}
