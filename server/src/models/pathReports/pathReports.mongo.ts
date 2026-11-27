import { Schema, model } from "mongoose";
import { REPORT_REASONS } from "@retainlearn/core";

// "Report this path" (P2-07, decision 13), as a study set's report (studySetReports.mongo.js): one per person per path,
// and enough of them from different people unlist the path until it's checked (config/trust.config.js). Its index is
// made by migration 0006.
const pathReportSchema = new Schema(
  {
    pathId: { type: Schema.Types.ObjectId, ref: "Path", required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, maxlength: 500, default: "" },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

pathReportSchema.index({ pathId: 1, by: 1 }, { unique: true });

export default model("PathReport", pathReportSchema, "path_reports");
