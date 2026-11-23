// A document as `.lean()` reads it, from its schema's inferred type (InferSchemaType). Mongoose types a list of
// subdocuments as a DocumentArray and a map as a Map, even where a lean read gives a plain array or object, so the
// new models export `Lean<InferSchemaType<typeof schema>>` and read with `.lean<ThatType>()`. The type the code reads
// then always comes from the schema, and changing one changes the other (PLAN 14.15).
import type { Types } from "mongoose";

export type Lean<T> = T extends Types.ObjectId | Date
  ? T
  : T extends Types.DocumentArray<infer Item>
    ? Lean<Item>[]
    : T extends Map<string, infer Value>
      ? Record<string, Lean<Value>>
      : T extends readonly (infer Item)[]
        ? Lean<Item>[]
        : T extends object
          ? { [K in keyof T]: Lean<T[K]> }
          : T;
