// Checks what a request sends against Zod schemas before its route runs, and replies 400 with the reason when it
// doesn't fit (PLAN 14.15). What passes is put in res.locals.input, parsed: a Zod object keeps only the fields it
// lists, so a stray field (`role: "admin"`) never reaches the route. So routes read their input from there, never
// from req.body, req.params or req.query.
//
//   const schemas = { params: z.object({ id: ObjectIdHex }), body: SaveAnswers };
//   router.post("/:id/answers", validate(schemas), (req, res) => {
//     const { params, body } = inputOf<typeof schemas>(res);
//   });
import type { NextFunction, Request, Response } from "express";
import type { z } from "@retainlearn/core";

type Schemas = { params?: z.ZodType; query?: z.ZodType; body?: z.ZodType };

// A route's parsed input, typed from its schemas.
export type Input<S extends Schemas> = { [K in keyof S]: S[K] extends z.ZodType ? z.infer<S[K]> : never };

export function validate<S extends Schemas>(schemas: S) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const input: Record<string, unknown> = {};
    for (const part of ["params", "query", "body"] as const) {
      const schema = schemas[part];
      if (!schema) continue;
      const result = schema.safeParse(req[part]);
      if (!result.success) {
        res.status(400).json({ error: reasonFor(part, result.error) });
        return;
      }
      input[part] = result.data;
    }
    res.locals.input = input;
    next();
  };
}

export const inputOf = <S extends Schemas>(res: Response): Input<S> => res.locals.input as Input<S>;

// The first problem, said plainly: "body.answers.0.correct: Invalid input: expected boolean, received string".
function reasonFor(part: string, error: z.ZodError): string {
  const issue = error.issues[0];
  return `${[part, ...(issue?.path ?? []).map(String)].join(".")}: ${issue?.message ?? "not valid"}`;
}
