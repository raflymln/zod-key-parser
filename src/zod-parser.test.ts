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
            key1: z.number().promise(),
            key2: z.string().array().promise(),
        }),

        readonly: z.object({
            key1: z.number().readonly(),
            key2: z.string().array().readonly(),
        }),
    });

    const parsed = parseZodSchema(schema);

    describe("`model` Test", () => {
        it("The return model should be the same as the input", () => {
            assert.deepStrictEqual(parsed.model, schema);
            assert.strictEqual(parsed.model._def.typeName, schema._def.typeName);
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
    });

    describe("`prismaKeys` Test", () => {
        it("Primitives should always return always return true", () => {
            assert.strictEqual(parsed.prismaKeys.key1, true);
            assert.strictEqual(parsed.prismaKeys.key2, true);
            assert.strictEqual(parsed.prismaKeys.key3, true);
            assert.strictEqual(parsed.prismaKeys.union, true);
            assert.strictEqual(parsed.prismaKeys.strArray, true);
        });

        it("Any other should return an object inside the `select` with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.prismaKeys.array, "object");
            assert.strictEqual(typeof parsed.prismaKeys.array.select, "object");
            assert.strictEqual(parsed.prismaKeys.array.select.key1, true);
            assert.strictEqual(parsed.prismaKeys.array.select.key2, true);
            assert.strictEqual(parsed.prismaKeys.array.select.key3, true);
            assert.strictEqual(parsed.prismaKeys.array.select.key4, true);

            assert.strictEqual(typeof parsed.prismaKeys.object, "object");
            assert.strictEqual(typeof parsed.prismaKeys.object.select, "object");
            assert.strictEqual(parsed.prismaKeys.object.select.ia, true);

            assert.strictEqual(typeof parsed.prismaKeys.unionObject, "object");
            assert.strictEqual(typeof parsed.prismaKeys.unionObject.select, "object");
            assert.strictEqual(parsed.prismaKeys.unionObject.select.a, true);
            assert.strictEqual(parsed.prismaKeys.unionObject.select.b, true);

            assert.strictEqual(typeof parsed.prismaKeys.intersection, "object");
            assert.strictEqual(typeof parsed.prismaKeys.intersection.select, "object");
            assert.strictEqual(parsed.prismaKeys.intersection.select.a, true);
            assert.strictEqual(parsed.prismaKeys.intersection.select.b, true);

            assert.strictEqual(typeof parsed.prismaKeys.default, "object");
            assert.strictEqual(typeof parsed.prismaKeys.default.select, "object");
            assert.strictEqual(parsed.prismaKeys.default.select.key1, true);
            assert.strictEqual(parsed.prismaKeys.default.select.key2, true);

            assert.strictEqual(typeof parsed.prismaKeys.promise, "object");
            assert.strictEqual(typeof parsed.prismaKeys.promise.select, "object");
            assert.strictEqual(parsed.prismaKeys.promise.select.key1, true);
            assert.strictEqual(parsed.prismaKeys.promise.select.key2, true);

            assert.strictEqual(typeof parsed.prismaKeys.readonly, "object");
            assert.strictEqual(typeof parsed.prismaKeys.readonly.select, "object");
            assert.strictEqual(parsed.prismaKeys.readonly.select.key1, true);
            assert.strictEqual(parsed.prismaKeys.readonly.select.key2, true);
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
            assert.strictEqual(parsed.model._def.typeName, schema._def.typeName);
        });
    });

    describe("`keys` Test", () => {
        it("Should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys, "object");
            assert.strictEqual(parsed.keys.a, "a");
            assert.strictEqual(parsed.keys.b, "b");
        });
    });

    describe("`prismaKeys` Test", () => {
        it("Should return an object with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.prismaKeys, "object");
            assert.strictEqual(typeof parsed.prismaKeys, "object");
            assert.strictEqual(parsed.prismaKeys.a, true);
            assert.strictEqual(parsed.prismaKeys.b, true);
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
            assert.strictEqual(parsed.model._def.typeName, schema._def.typeName);
        });
    });

    describe("`keys` Test", () => {
        it("Should return an object with concatenated key name", () => {
            assert.strictEqual(typeof parsed.keys, "object");
            assert.strictEqual(parsed.keys.a, "a");
            assert.strictEqual(parsed.keys.b, "b");
        });
    });

    describe("`prismaKeys` Test", () => {
        it("Should return an object with the key name and `true` value", () => {
            assert.strictEqual(typeof parsed.prismaKeys, "object");
            assert.strictEqual(typeof parsed.prismaKeys, "object");
            assert.strictEqual(parsed.prismaKeys.a, true);
            assert.strictEqual(parsed.prismaKeys.b, true);
        });
    });
});
