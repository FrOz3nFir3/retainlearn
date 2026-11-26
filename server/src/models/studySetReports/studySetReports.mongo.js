import { Schema, model } from "mongoose";
import { REPORT_REASONS } from "@retainlearn/core";

// "Report this set" (P0-14): one report per person per set. Enough reports from different people unlist the set until
// it's checked (config/trust.config.js). The admin reads them with `npm run reports`. Named like every collection
// about study sets (`study_sets`, `study_set_history`, ...), with `setId` for the set and `by` / `at` for who reported
// it and when (migrations/0002-study-set-names.js renamed them from `card_reports`, `card`, `reporter`, `createdAt`).
// The reasons are core's (REPORT_REASONS), the same list the report form offers.
export { REPORT_REASONS };

const studySetReportSchema = new Schema(
  {
    setId: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    by: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, enum: REPORT_REASONS, required: true },
    note: { type: String, maxlength: 500, default: "" },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

studySetReportSchema.index({ setId: 1, by: 1 }, { unique: true });

export default model("StudySetReport", studySetReportSchema, "study_set_reports");
