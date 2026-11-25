import { test } from "node:test";
import assert from "node:assert/strict";
import { Email, NewPassword, NewStudySet, ObjectIdHex, SaveAnswers, SignUpBody, SubjectName, TimeZone, Username, subjectName, z } from "@retainlearn/core";

test("an id is 24 hexadecimal digits, as MongoDB's ids travel in URLs and JSON", () => {
  assert.equal(ObjectIdHex.safeParse("6740f1a2b3c4d5e6f7a8b9c0").success, true);
  assert.equal(ObjectIdHex.safeParse("6740F1A2B3C4D5E6F7A8B9C0").success, true);
  for (const bad of ["", "6740f1a2b3c4d5e6f7a8b9c", "6740f1a2b3c4d5e6f7a8b9c0a", "zzzzzzzzzzzzzzzzzzzzzzzz", { $ne: null }, 42]) {
    assert.equal(ObjectIdHex.safeParse(bad).success, false, JSON.stringify(bad));
  }
  assert.equal(ObjectIdHex.safeParse("nope").error?.issues[0]?.message, "must be an id");
});

test("a time zone must be one this machine knows", () => {
  assert.equal(TimeZone.safeParse("Asia/Kolkata").success, true);
  assert.equal(TimeZone.safeParse("Mars/Olympus_Mons").success, false);
  assert.equal(TimeZone.safeParse("Mars/Olympus_Mons").error?.issues[0]?.message, "must be a time zone");
});

test("an object schema keeps only the fields it lists, so a stray field never gets through", () => {
  const Note = z.object({ note: z.string() });
  assert.deepEqual(Note.parse({ note: "hi", role: "admin" }), { note: "hi" });
});

test("saving answers: what a batch must hold, with defaults filled in", () => {
  const id = "6740f1a2b3c4d5e6f7a8b9c0";
  const batch = { timeZone: "Asia/Kolkata", classKey: "quiz:round-1", mode: "quiz", seq: 1, answers: [{ kind: "question", itemId: id, correct: true, ms: 4200 }] };
  const parsed = SaveAnswers.parse({ ...batch, answers: [...batch.answers, { kind: "flashcard", itemId: id, knew: true, ms: 9000 }] });
  assert.equal(parsed.finished, false);
  assert.deepEqual(parsed.answers[1], { kind: "flashcard", itemId: id, knew: true, points: [], ms: 9000 });

  const bad = {
    "an unknown kind of class": { ...batch, mode: "battle" },
    "no answers": { ...batch, answers: [] },
    "more than 25 answers": { ...batch, answers: Array(26).fill(batch.answers[0]) },
    "a flashcard marked like a question": { ...batch, answers: [{ kind: "flashcard", itemId: id, correct: true, ms: 1 }] },
    "a negative time": { ...batch, answers: [{ ...batch.answers[0], ms: -1 }] },
    "an item that isn't an id": { ...batch, answers: [{ ...batch.answers[0], itemId: "q1" }] },
    "an unknown time zone": { ...batch, timeZone: "Mars/Olympus_Mons" },
    "a batch number of 0": { ...batch, seq: 0 },
    "more than 30 recall points": { ...batch, answers: [{ kind: "flashcard", itemId: id, knew: true, ms: 1, points: Array.from({ length: 31 }, (_, i) => ({ key: `p${i}`, knew: true })) }] },
    "a recall point's key over 160 characters": { ...batch, answers: [{ kind: "flashcard", itemId: id, knew: true, ms: 1, points: [{ key: "x".repeat(161), knew: true }] }] },
  };
  for (const [what, body] of Object.entries(bad)) assert.equal(SaveAnswers.safeParse(body).success, false, what);
});

test("a subject's name is kept tidied and capitalised, up to 40 characters, without what breaks its link", () => {
  assert.equal(subjectName("  web   DEVELOPMENT "), "Web Development");
  assert.equal(SubjectName.parse(" c++  basics"), "C++ Basics");
  for (const bad of ["", "   ", "Maths/Physics", "C#", "100%", "What?", "a\\b", "x".repeat(41)]) {
    assert.equal(SubjectName.safeParse(bad).success, false, JSON.stringify(bad));
  }
  assert.equal(SubjectName.safeParse("C#").error?.issues[0]?.message, "Leave out / ? # % and \\ (they break the subject's link).");
});

test("a new study set needs a topic and a subtopic that fit, in a subject that can be one", () => {
  assert.equal(NewStudySet.safeParse({ mainTopic: "Verbs", subTopic: "Present tense", category: "spanish" }).data?.category, "Spanish");
  assert.equal(NewStudySet.safeParse({ mainTopic: " ", subTopic: "Present tense", category: "Spanish" }).error?.issues[0]?.message, "Give the set a topic.");
  assert.equal(NewStudySet.safeParse({ mainTopic: "Verbs", subTopic: "x".repeat(121), category: "Spanish" }).success, false);
});

test("signing up: a username of 3 to 30 letters, numbers and underscores, and a password the server will take", () => {
  assert.equal(Username.safeParse("lee_learner").success, true);
  for (const bad of ["ab", "x".repeat(31), "has space", "dots.not.ok"]) assert.equal(Username.safeParse(bad).success, false, bad);
  assert.equal(NewPassword.safeParse("Strong-pass1!").success, true);
  assert.equal(NewPassword.safeParse("short1!A").error?.issues[0]?.message, "Use at least 10 characters.");
  assert.equal(NewPassword.safeParse("nouppercase1!").error?.issues[0]?.message, "Add an uppercase letter.");
  assert.equal(NewPassword.safeParse("NoSpecial123").error?.issues[0]?.message, "Add one of ! @ # $ % ^ & *.");
  const body = { name: "Sam", username: "sam_1", email: "sam@example.com", password: "Strong-pass1!" };
  assert.equal(SignUpBody.safeParse({ ...body, confirmPassword: "Strong-pass1!" }).success, true);
  assert.equal(SignUpBody.safeParse({ ...body, confirmPassword: "different" }).error?.issues[0]?.message, "The two passwords don't match.");
  assert.equal(Email.safeParse("not-an-email").success, false);
});
