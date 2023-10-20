import { isZodIntersection, isZodObject, isZodUnion, isZodArray, isZodNullable, isZodOptional, isZodPrimitives } from ".";

import { z } from "zod";

import assert from "assert";

describe("Testing Zod Schema Detector", () => {
    const zodObject = z.object({});
    const zodIntersection = z.intersection(zodObject, zodObject);
    const ZodUnion = z.union([zodObject, zodObject]);
    const zodArray = z.array(zodObject);
    const zodOptional = zodObject.optional();
    const zodNullable = zodObject.nullable();
    const zodPrimitives = z.string();

    it("ZodObject", () => {
        assert.strictEqual(isZodObject(zodObject), true);
        assert.strictEqual(isZodObject(zodIntersection), false);
        assert.strictEqual(isZodObject(ZodUnion), false);
        assert.strictEqual(isZodObject(zodArray), false);
        assert.strictEqual(isZodObject(zodOptional), false);
        assert.strictEqual(isZodObject(zodNullable), false);
        assert.strictEqual(isZodObject(zodPrimitives), false);
    });

    it("ZodIntersection", () => {
        assert.strictEqual(isZodIntersection(zodObject), false);
        assert.strictEqual(isZodIntersection(zodIntersection), true);
        assert.strictEqual(isZodIntersection(ZodUnion), false);
        assert.strictEqual(isZodIntersection(zodArray), false);
        assert.strictEqual(isZodIntersection(zodOptional), false);
        assert.strictEqual(isZodIntersection(zodNullable), false);
        assert.strictEqual(isZodIntersection(zodPrimitives), false);
    });

    it("ZodUnion", () => {
        assert.strictEqual(isZodUnion(zodObject), false);
        assert.strictEqual(isZodUnion(zodIntersection), false);
        assert.strictEqual(isZodUnion(ZodUnion), true);
        assert.strictEqual(isZodUnion(zodArray), false);
        assert.strictEqual(isZodUnion(zodOptional), false);
        assert.strictEqual(isZodUnion(zodNullable), false);
        assert.strictEqual(isZodUnion(zodPrimitives), false);
    });

    it("ZodArray", () => {
        assert.strictEqual(isZodArray(zodObject), false);
        assert.strictEqual(isZodArray(zodIntersection), false);
        assert.strictEqual(isZodArray(ZodUnion), false);
        assert.strictEqual(isZodArray(zodArray), true);
        assert.strictEqual(isZodArray(zodOptional), false);
        assert.strictEqual(isZodArray(zodNullable), false);
        assert.strictEqual(isZodArray(zodPrimitives), false);
    });

    it("ZodOptional", () => {
        assert.strictEqual(isZodOptional(zodObject), false);
        assert.strictEqual(isZodOptional(zodIntersection), false);
        assert.strictEqual(isZodOptional(ZodUnion), false);
        assert.strictEqual(isZodOptional(zodArray), false);
        assert.strictEqual(isZodOptional(zodOptional), true);
        assert.strictEqual(isZodOptional(zodNullable), false);
        assert.strictEqual(isZodOptional(zodPrimitives), false);
    });

    it("ZodNullable", () => {
        assert.strictEqual(isZodNullable(zodObject), false);
        assert.strictEqual(isZodNullable(zodIntersection), false);
        assert.strictEqual(isZodNullable(ZodUnion), false);
        assert.strictEqual(isZodNullable(zodArray), false);
        assert.strictEqual(isZodNullable(zodOptional), false);
        assert.strictEqual(isZodNullable(zodNullable), true);
        assert.strictEqual(isZodNullable(zodPrimitives), false);
    });

    it("ZodPrimitives", () => {
        assert.strictEqual(isZodPrimitives(zodObject), false);
        assert.strictEqual(isZodPrimitives(zodIntersection), false);
        assert.strictEqual(isZodPrimitives(ZodUnion), false);
        assert.strictEqual(isZodPrimitives(zodArray), false);
        assert.strictEqual(isZodPrimitives(zodOptional), false);
        assert.strictEqual(isZodPrimitives(zodNullable), false);
        assert.strictEqual(isZodPrimitives(zodPrimitives), true);
    });
});
