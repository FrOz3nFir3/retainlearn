import { Schema, model } from "mongoose";

// "Report this set" (P0-14): one report per person per set. Study sets are `cards` in the database, so these are
// `card_reports`, like the planned `card_logs`. Enough reports from different people unlist the set until it's
// checked (config/trust.config.js). The admin reads them with `npm run reports`.
export const REPORT_REASONS = ["spam", "offensive", "wrong", "other"];

const cardReportSchema = new Schema({
  card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String, enum: REPORT_REASONS, required: true },
  note: { type: String, maxlength: 500, default: "" },
  createdAt: { type: Date, default: Date.now },
});

cardReportSchema.index({ card: 1, reporter: 1 }, { unique: true });

export default model("CardReport", cardReportSchema, "card_reports");
