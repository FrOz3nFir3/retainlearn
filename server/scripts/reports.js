// Lists the study sets people have reported ("Report this set", P0-14), most reported first. Read-only.
//
//   npm run reports
//
// It reads the database in MONGO_URI: .env.local locally, or production's when run in Dokploy or over NetBird.
// A set reported by enough people is already unlisted (config/trust.config.js). After checking one, in mongosh:
// - to list it again and clear its reports:
//     db.study_sets.updateOne({ _id: ObjectId("<id>") }, { $set: { listed: true }, $unset: { listAt: 1 } })
//     db.study_set_reports.deleteMany({ setId: ObjectId("<id>") })
// - to keep it unlisted: leave it as it is.
import { initMongoDB, mongoDisconnect } from "../src/services/mongo.js";
import StudySetReport from "../src/models/studySetReports/studySetReports.mongo.js";
import Card from "../src/models/cards/cards.mongo.js";
import Users from "../src/models/users/users.mongo.js";

await initMongoDB();
try {
  const reported = await StudySetReport.aggregate([
    {
      $group: {
        _id: "$setId",
        reports: { $sum: 1 },
        reasons: { $push: "$reason" },
        notes: { $push: "$note" },
        reporters: { $push: "$by" },
        last: { $max: "$at" },
      },
    },
    { $sort: { reports: -1, last: -1 } },
  ]);

  if (reported.length === 0) console.log("No reported sets.");
  for (const entry of reported) {
    const card = await Card.findById(entry._id, { "main-topic": 1, "sub-topic": 1, category: 1, listed: 1, listAt: 1 }).lean();
    const reporters = await Users.find({ _id: { $in: entry.reporters } }, { _id: 0, username: 1 }).lean();
    const title = card ? `${card.category} / ${card["main-topic"]} / ${card["sub-topic"]}` : "(set deleted)";
    const listed = !card ? "" : card.listed === false ? (card.listAt ? `unlisted until ${card.listAt.toISOString().slice(0, 10)}` : "unlisted") : "listed";
    console.log(`\n${entry._id}  ${title}  [${listed}]`);
    console.log(`  ${entry.reports} report(s), last ${entry.last.toISOString().slice(0, 16).replace("T", " ")}: ${entry.reasons.join(", ")}`);
    console.log(`  by ${reporters.map((user) => user.username).join(", ")}`);
    for (const note of entry.notes.filter(Boolean)) console.log(`  - "${note}"`);
  }
} finally {
  await mongoDisconnect();
}
