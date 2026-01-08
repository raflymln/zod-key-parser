import { parseZodSchema } from ".";

import { z } from "zod";

import assert from "assert";

describe("Zod Object Parser", () => {
    const schema = z.object({
        key1: z.boolean(),
        key2: z.string().nullable(),
        key3: z.enum(["a", "b", "c"]),
        union: z.union([z.string(), z.number()]),
        strArray: z.array(z.string()),

        array: z.array(
            z.object({
                key1: z.number(),
                key2: z.string(),
                key3: z.boolean(),
                key4: z.string(),
            })
        ),

        object: z
            .object({
                ia: z.number(),
            })
            .optional(),

        unionObject: z.union([
            z.object({
                a: z.string(),
            }),
            z.object({
                b: z.number(),
            }),
        ]),

        intersection: z.intersection(
            z.object({
                a: z.string(),
            }),
            z.object({
                b: z.number(),
            })
        ),

        default: z.object({
            key1: z.number().default(1),
            key2: z.string().array().default([]),
        }),

        promise: z.object({
            key1: z.promise(z.number()),
            key2: z.promise(z.string().array()),
        }),

        readonly: z.object({
            key1: z.number().readonly(),
            key2: z.string().array().readonly(),
        }),

        effects: z.object({
            key1: z.number().transform((val) => val * 2),
            key2: z.string().refine((val) => val.length > 5),
        }),
    });

    const parsed = parseZodSchema(schema);

    describe("`model` Test", () => {
        it("The return model should be the same as the input", () => {
            assert.deepStrictEqual(parsed.model, schema);
            assert.strictEqual(parsed.model.def.type, schema.def.type);
        });
    });

    describe("`keys` Test", () => {
        it("Primitives should always return the key name", () => {
            assert.strictEqual(parsed.keys.key1, "key1");
            assert.strictEqual(parsed.keys.key2, "key2");
            assert.strictEqual(parsed.keys.key3, "key3");
            assert.strictEqual(parsed.keys.union, "union");
            assert.strictEqual(parsed.keys.strArray, "strArray");
        });

        it("Array of object should return a function that returns the object key name, the function also had `key` variable to point out the parent key", () => {
            assert.strictEqual(typeof parsed.keys.array, "function");
            assert.strictEqual(parsed.keys.array.key, "array");
            assert.strictEqual(typeof parsed.keys.array(0), "object");
            assert.strictEqual(parsed.keys.array(0).key1, "array.0.key1");
        });

        it("Object should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.object, "object");
            assert.strictEqual(parsed.keys.object.ia, "object.ia");
        });

        it("Union should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.unionObject, "object");
            assert.strictEqual(parsed.keys.unionObject.a, "unionObject.a");
            assert.strictEqual(parsed.keys.unionObject.b, "unionObject.b");
        });

        it("Intersection should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.intersection, "object");
            assert.strictEqual(parsed.keys.intersection.a, "intersection.a");
            assert.strictEqual(parsed.keys.intersection.b, "intersection.b");
        });

        it("Default should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.default, "object");
            assert.strictEqual(parsed.keys.default.key1, "default.key1");
            assert.strictEqual(parsed.keys.default.key2, "default.key2");
        });

        it("Promise should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.promise, "object");
            assert.strictEqual(parsed.keys.promise.key1, "promise.key1");
            assert.strictEqual(parsed.keys.promise.key2, "promise.key2");
        });

        it("Readonly should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.readonly, "object");
            assert.strictEqual(parsed.keys.readonly.key1, "readonly.key1");
            assert.strictEqual(parsed.keys.readonly.key2, "readonly.key2");
        });

        it("Effects should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys.effects, "object");
            assert.strictEqual(parsed.keys.effects.key1, "effects.key1");
            assert.strictEqual(parsed.keys.effects.key2, "effects.key2");
        });
    });

    describe("`selectKeys` Test", () => {
        it("Primitives should always return always return true", () => {
            assert.strictEqual(parsed.selectKeys.key1, true);
            assert.strictEqual(parsed.selectKeys.key2, true);
            assert.strictEqual(parsed.selectKeys.key3, true);
            assert.strictEqual(parsed.selectKeys.union, true);
            assert.strictEqual(parsed.selectKeys.strArray, true);
        });

        it("Any other should return an object inside the `select` with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.selectKeys.array, "object");
            assert.strictEqual(typeof parsed.selectKeys.array.select, "object");
            assert.strictEqual(parsed.selectKeys.array.select.key1, true);
            assert.strictEqual(parsed.selectKeys.array.select.key2, true);
            assert.strictEqual(parsed.selectKeys.array.select.key3, true);
            assert.strictEqual(parsed.selectKeys.array.select.key4, true);

            assert.strictEqual(typeof parsed.selectKeys.object, "object");
            assert.strictEqual(typeof parsed.selectKeys.object.select, "object");
            assert.strictEqual(parsed.selectKeys.object.select.ia, true);

            assert.strictEqual(typeof parsed.selectKeys.unionObject, "object");
            assert.strictEqual(typeof parsed.selectKeys.unionObject.select, "object");
            assert.strictEqual(parsed.selectKeys.unionObject.select.a, true);
            assert.strictEqual(parsed.selectKeys.unionObject.select.b, true);

            assert.strictEqual(typeof parsed.selectKeys.intersection, "object");
            assert.strictEqual(typeof parsed.selectKeys.intersection.select, "object");
            assert.strictEqual(parsed.selectKeys.intersection.select.a, true);
            assert.strictEqual(parsed.selectKeys.intersection.select.b, true);

            assert.strictEqual(typeof parsed.selectKeys.default, "object");
            assert.strictEqual(typeof parsed.selectKeys.default.select, "object");
            assert.strictEqual(parsed.selectKeys.default.select.key1, true);
            assert.strictEqual(parsed.selectKeys.default.select.key2, true);

            assert.strictEqual(typeof parsed.selectKeys.promise, "object");
            assert.strictEqual(typeof parsed.selectKeys.promise.select, "object");
            assert.strictEqual(parsed.selectKeys.promise.select.key1, true);
            assert.strictEqual(parsed.selectKeys.promise.select.key2, true);

            assert.strictEqual(typeof parsed.selectKeys.readonly, "object");
            assert.strictEqual(typeof parsed.selectKeys.readonly.select, "object");
            assert.strictEqual(parsed.selectKeys.readonly.select.key1, true);
            assert.strictEqual(parsed.selectKeys.readonly.select.key2, true);

            assert.strictEqual(typeof parsed.selectKeys.effects, "object");
            assert.strictEqual(typeof parsed.selectKeys.effects.select, "object");
            assert.strictEqual(parsed.selectKeys.effects.select.key1, true);
            assert.strictEqual(parsed.selectKeys.effects.select.key2, true);
        });
    });
});

describe("Zod Intersection Parser", () => {
    const schema = z.intersection(
        z.object({
            a: z.string(),
        }),
        z.object({
            b: z.number(),
        })
    );

    const parsed = parseZodSchema(schema);

    describe("`model` Test", () => {
        it("The return model should be the same as the input", () => {
            assert.deepStrictEqual(parsed.model, schema);
            assert.strictEqual(parsed.model.def.type, schema.def.type);
        });
    });

    describe("`keys` Test", () => {
        it("Should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys, "object");
            assert.strictEqual(parsed.keys.a, "a");
            assert.strictEqual(parsed.keys.b, "b");
        });
    });

    describe("`selectKeys` Test", () => {
        it("Should return an object with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.selectKeys, "object");
            assert.strictEqual(typeof parsed.selectKeys, "object");
            assert.strictEqual(parsed.selectKeys.a, true);
            assert.strictEqual(parsed.selectKeys.b, true);
        });
    });
});

describe("Zod Union Parser", () => {
    const schema = z.union([
        z.object({
            a: z.string(),
        }),
        z.object({
            b: z.number(),
        }),
    ]);

    const parsed = parseZodSchema(schema);

    describe("`model` Test", () => {
        it("The return model should be the same as the input", () => {
            assert.deepStrictEqual(parsed.model, schema);
            assert.strictEqual(parsed.model.def.type, schema.def.type);
        });
    });

    describe("`keys` Test", () => {
        it("Should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys, "object");
            assert.strictEqual(parsed.keys.a, "a");
            assert.strictEqual(parsed.keys.b, "b");
        });
    });

    describe("`selectKeys` Test", () => {
        it("Should return an object with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.selectKeys, "object");
            assert.strictEqual(typeof parsed.selectKeys, "object");
            assert.strictEqual(parsed.selectKeys.a, true);
            assert.strictEqual(parsed.selectKeys.b, true);
        });
    });
});
