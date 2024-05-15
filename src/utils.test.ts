import { isZodIntersection, isZodObject, isZodUnion, isZodArray, isZodNullable, isZodOptional, isZodPrimitives, isZodDefault, isZodPromise, isZodReadonly } from ".";

import { z } from "zod";

import assert from "assert";

describe("Testing Zod Schema Detector", () => {
    const zodObject = z.object({});
    const zodIntersection = z.intersection(zodObject, zodObject);
    const zodUnion = z.union([zodObject, zodObject]);
    const zodArray = z.array(zodObject);
    const zodOptional = zodObject.optional();
    const zodNullable = zodObject.nullable();
    const zodPrimitives = z.string();
    const zodDefault = zodObject.default({});
    const zodPromise = z.promise(zodObject);
    const zodReadonly = zodObject.readonly();

    const testObjects = [zodObject, zodIntersection, zodUnion, zodArray, zodOptional, zodNullable, zodPrimitives, zodDefault, zodPromise, zodReadonly];

    it("ZodObject", () => {
        testObjects.forEach((object) => {
            if (object !== zodObject) {
                assert.strictEqual(isZodObject(object), false);
            } else {
                assert.strictEqual(isZodObject(object), true);
            }
        });
    });

    it("ZodIntersection", () => {
        testObjects.forEach((object) => {
            if (object !== zodIntersection) {
                assert.strictEqual(isZodIntersection(object), false);
            } else {
                assert.strictEqual(isZodIntersection(object), true);
            }
        });
    });

    it("ZodUnion", () => {
        testObjects.forEach((object) => {
            if (object !== zodUnion) {
                assert.strictEqual(isZodUnion(object), false);
            } else {
                assert.strictEqual(isZodUnion(object), true);
            }
        });
    });

    it("ZodArray", () => {
        testObjects.forEach((object) => {
            if (object !== zodArray) {
                assert.strictEqual(isZodArray(object), false);
            } else {
                assert.strictEqual(isZodArray(object), true);
            }
        });
    });

    it("ZodOptional", () => {
        testObjects.forEach((object) => {
            if (object !== zodOptional) {
                assert.strictEqual(isZodOptional(object), false);
            } else {
                assert.strictEqual(isZodOptional(object), true);
            }
        });
    });

    it("ZodNullable", () => {
        testObjects.forEach((object) => {
            if (object !== zodNullable) {
                assert.strictEqual(isZodNullable(object), false);
            } else {
                assert.strictEqual(isZodNullable(object), true);
            }
        });
    });

    it("ZodPrimitives", () => {
        testObjects.forEach((object) => {
            if (object !== zodPrimitives) {
                assert.strictEqual(isZodPrimitives(object), false);
            } else {
                assert.strictEqual(isZodPrimitives(object), true);
            }
        });
    });

    it("ZodDefault", () => {
        testObjects.forEach((object) => {
            if (object !== zodDefault) {
                assert.strictEqual(isZodDefault(object), false);
            } else {
                assert.strictEqual(isZodDefault(object), true);
            }
        });
    });

    it("ZodPromise", () => {
        testObjects.forEach((object) => {
            if (object !== zodPromise) {
                assert.strictEqual(isZodPromise(object), false);
            } else {
                assert.strictEqual(isZodPromise(object), true);
            }
        });
    });

    it("ZodReadonly", () => {
        testObjects.forEach((object) => {
            if (object !== zodReadonly) {
                assert.strictEqual(isZodReadonly(object), false);
            } else {
                assert.strictEqual(isZodReadonly(object), true);
            }
        });
    });
});
