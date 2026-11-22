// Checking what a request sends (PLAN 14.15): validate() runs a route's Zod schemas before it, replies 400 with the
// reason when something doesn't fit, and hands the route only the fields its schemas list.
import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response } from "express";
import { ObjectIdHex, z } from "@retainlearn/core";
import { inputOf, validate } from "#middleware/validate.ts";

const id = "6740f1a2b3c4d5e6f7a8b9c0";
const schemas = {
  params: z.object({ id: ObjectIdHex }),
  query: z.object({ page: z.coerce.number().int().min(1).default(1) }),
  body: z.object({ note: z.string().max(10) }),
};

// Runs the check on a made-up request: whether the route would run, the reply sent instead, and the route's input.
function run(req: { params?: unknown; query?: unknown; body?: unknown }) {
  const reply: { status?: number; body?: unknown } = {};
  const res = {
    locals: {} as Record<string, unknown>,
    status(code: number) {
      reply.status = code;
      return this;
    },
    json(body: unknown) {
      reply.body = body;
      return this;
    },
  };
  let passed = false;
  const request = { params: {}, query: {}, body: undefined, ...req } as unknown as Request;
  validate(schemas)(request, res as unknown as Response, () => {
    passed = true;
  });
  return { passed, reply, input: passed ? inputOf<typeof schemas>(res as unknown as Response) : undefined };
}
const errorOf = (reply: { body?: unknown }) => (reply.body as { error: string }).error;

test("what fits goes through, parsed, with only the fields the schemas list", () => {
  const { passed, input } = run({ params: { id }, query: { page: "2" }, body: { note: "hello", role: "admin" } });
  assert.equal(passed, true);
  assert.deepEqual(input, { params: { id }, query: { page: 2 }, body: { note: "hello" } }, "role is dropped, page is a number");
});

test("what doesn't fit gets a 400 with the reason, and the route never runs", () => {
  const tooLong = run({ params: { id }, body: { note: "far too long a note" } });
  assert.equal(tooLong.passed, false);
  assert.equal(tooLong.reply.status, 400);
  assert.match(errorOf(tooLong.reply), /^body\.note: /);

  assert.deepEqual(run({ params: { id: "nope" }, body: { note: "hi" } }).reply, { status: 400, body: { error: "params.id: must be an id" } });
  assert.match(errorOf(run({ params: { id } }).reply), /^body: /, "no body at all");
  assert.match(errorOf(run({ params: { id }, query: { page: "0" }, body: { note: "hi" } }).reply), /^query\.page: /);
});

test("an id sent as a database operator is turned away before any query sees it", () => {
  const sneaky = run({ params: { id: { $ne: null } }, body: { note: "hi" } });
  assert.equal(sneaky.passed, false);
  assert.match(errorOf(sneaky.reply), /^params\.id: /);
});
