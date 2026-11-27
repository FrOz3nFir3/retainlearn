import { Schema, model } from "mongoose";
import type { InferSchemaType, Types } from "mongoose";
import type { Lean } from "#models/lean.ts";

// One per account (`_id` is the account's _id): settings, the coach, XP and the streak, the campus, the stadium and
// paths. Read on every campus load; written when a class ends, and by settings and the coach. Its only index is _id.
// Days ("2026-11-20") are the player's local day, from `settings.timeZone` (PLAN 14.3b).

// A building on your campus: a subject you study, its place, and your summary of it, refreshed when a class ends.
// Only what your own writes change lives here. What changes without you doesn't: how many player cards are fading changes
// as days pass (today's activity has it, worked out at the day's first load), and how many sets a subject has
// changes when anyone adds one (the public category list has it). Warm, cooling or cold comes from lastAt.
const subjectSchema = new Schema(
  {
    category: { type: String, required: true },
    plot: { type: Number, required: true },
    started: { type: Number, default: 0 }, // sets you've started here
    mastery: { type: Number, default: 0 },
    missed: { type: Number, default: 0 },
    lastAt: { type: Date },
  },
  { _id: false }
);

// One topic's standing in the stadium.
const arenaSchema = new Schema(
  {
    key: { type: String, required: true }, // "programming/javascript"
    trophies: { type: Number, default: 0 },
    botsBeaten: { type: [String], default: [] },
  },
  { _id: false }
);

// What a new player starts with. Also what a missing field reads as: a lean read doesn't fill defaults in, and a field
// added later isn't in older documents (players.model.ts, campusPlayer).
export const SETTINGS_DEFAULTS = { view3d: null, look: "kit", sky: "auto", theme: "system", studyView: "both", extraTime: false, timeZone: "UTC" } as const;

const playerSchema = new Schema(
  {
    _id: { type: Schema.Types.ObjectId, ref: "User" },
    settings: {
      view3d: { type: Boolean, default: SETTINGS_DEFAULTS.view3d }, // null: automatic (2D without WebGL or with reduced motion)
      look: { type: String, enum: ["kit", "classic"], default: SETTINGS_DEFAULTS.look },
      sky: { type: String, enum: ["auto", "morning", "afternoon", "evening", "night"], default: SETTINGS_DEFAULTS.sky },
      theme: { type: String, enum: ["system", "light", "dark"], default: SETTINGS_DEFAULTS.theme },
      studyView: { type: String, enum: ["both", "review", "quiz"], default: SETTINGS_DEFAULTS.studyView },
      extraTime: { type: Boolean, default: SETTINGS_DEFAULTS.extraTime },
      timeZone: { type: String, default: SETTINGS_DEFAULTS.timeZone },
    },
    coach: {
      heard: { type: String, default: null }, // "2026-11-20|fading": the news last told, so it isn't told twice
      quiet: { type: String, default: null }, // a day you said "Later"
      toured: { type: Boolean, default: false },
    },
    xp: { type: Number, default: 0 },
    streak: {
      count: { type: Number, default: 0 },
      lastDay: { type: String, default: null },
      freezes: { type: Number, default: 0 },
    },
    unlocks: { type: [String], default: [] },
    subjects: { type: [subjectSchema], default: [] },
    stadium: {
      last: { type: Schema.Types.Mixed, default: null }, // the last "Questions from" choice: { subject, topic, setId?, pathId? }
      arenas: { type: [arenaSchema], default: [] },
    },
    paths: {
      active: { type: Schema.Types.ObjectId, default: null },
      testedOut: { type: [String], default: [] }, // "pathId.stepId"
      // A path's skill, earned for good, with the path's title as it was (the path can change or go).
      skills: { type: [new Schema({ pathId: Schema.Types.ObjectId, title: String, at: Date }, { _id: false })], default: [] },
    },
    // A class left halfway, for the coach. Its detail is in progress.classInProgress.
    classLeft: { type: new Schema({ setId: Schema.Types.ObjectId, key: String, day: String }, { _id: false }), default: null },
  },
  { timestamps: { createdAt: false, updatedAt: true }, versionKey: false }
);

export type PlayerDoc = Lean<InferSchemaType<typeof playerSchema>> & { _id: Types.ObjectId };

export default model("Player", playerSchema, "players");
