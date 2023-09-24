import type { FormattedFormData } from ".";

import { formatFormData, formatObject, parseZodSchema } from ".";

import { File } from "@web-std/file";
import { z } from "zod";

const testFile = new File(["test"], "test.ts");

const testFormData = () => {
    const formData = new FormData();

    // Example String
    formData.append("name", "John Doe");
    formData.append("age", "20");
    formData.append("dateOfBirth", "1999-01-01");
    formData.append("status.isAlive", "true");

    // Example Array of Files
    formData.append("image.photo", testFile);
    formData.append("image.photo", testFile);
    formData.append("image.photo", testFile);

    // Example Single File
    formData.append("image.profilePicture", testFile);

    console.log("> Begin test to format FormData");
    const result = formatFormData(formData);
    console.log(result);

    if (result.name !== "John Doe" || result.age !== 20 || !(result.dateOfBirth instanceof Date) || (result.status as Record<string, FormattedFormData>).isAlive !== true) {
        throw new Error("Failed to format string values");
    }

    const images = result.image as Record<string, FormattedFormData>;
    if (!Array.isArray(images.photo) || images.photo.length !== 3 || !(images.photo[0] instanceof File)) {
        throw new Error("Failed to format array of files");
    }

    if (!(images.profilePicture instanceof File)) {
        throw new Error("Failed to format single file");
    }

    console.log("> End test to format FormData");
};

const testObject = () => {
    const obj = {
        name: "John Doe",
        age: "20",
        dateOfBirth: "1999-01-01",
        "status.isAlive": "true",
        "image.photo": [testFile, testFile, testFile],
        "image.profilePicture": testFile,
    };

    console.log("> Begin test to format Object");
    const result = formatObject(obj);
    console.log(result);

    if (result.name !== "John Doe" || result.age !== 20 || !(result.dateOfBirth instanceof Date) || (result.status as Record<string, FormattedFormData>).isAlive !== true) {
        throw new Error("Failed to format string values");
    }

    const images = result.image as Record<string, FormattedFormData>;

    if (!Array.isArray(images.photo) || images.photo.length !== 3 || !(images.photo[0] instanceof File)) {
        throw new Error("Failed to format array of files");
    }

    if (!(images.profilePicture instanceof File)) {
        throw new Error("Failed to format single file");
    }

    console.log("> End test to format Object");
};

const testZodSchemaParser = () => {
    const schema = z.object({
        key1: z.boolean(),
        key2: z.string().nullable(),
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
        union: z.union([z.string(), z.number()]),
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
    });

    console.log("> Begin test to parse Zod Schema");
    const result = parseZodSchema(schema);

    // #region Keys
    console.log("- Testing Keys");
    console.log(result.keys);

    if (result.keys.key1 !== "key1" || result.keys.key2 !== "key2") {
        throw new Error("Failed to parse keys");
    }

    if (typeof result.keys.array !== "function" || result.keys.array.key !== "array") {
        throw new Error("Failed to parse keys on array");
    }

    if (result.keys.array(0).key1 !== "array.0.key1") {
        throw new Error("Failed to parse keys on array value");
    }

    if (typeof result.keys.object !== "object" || result.keys.object.ia !== "object.ia") {
        throw new Error("Failed to parse keys on object");
    }

    if (result.keys.union !== "union") {
        throw new Error("Failed to parse keys on union");
    }

    if (result.keys.unionObject.a !== "unionObject.a" || result.keys.unionObject.b !== "unionObject.b") {
        throw new Error("Failed to parse keys on union object");
    }

    if (result.keys.intersection.a !== "intersection.a" || result.keys.intersection.b !== "intersection.b") {
        throw new Error("Failed to parse keys on intersection");
    }

    // #endregion

    // #region Prisma Keys
    console.log("- Testing Prisma Keys");
    console.log(result.prismaKeys);

    if (result.prismaKeys.key1 !== true || result.prismaKeys.key2 !== true) {
        throw new Error("Failed to parse prisma keys");
    }

    if (!result.prismaKeys.array.select || result.prismaKeys.array.select.key1 !== true) {
        throw new Error("Failed to parse prisma keys on array");
    }

    if (!result.prismaKeys.object.select || result.prismaKeys.object.select.ia !== true) {
        throw new Error("Failed to parse prisma keys on object");
    }

    if (result.prismaKeys.union !== true) {
        throw new Error("Failed to parse prisma keys on union");
    }

    if (!result.prismaKeys.unionObject.select || result.prismaKeys.unionObject.select.a !== true) {
        throw new Error("Failed to parse prisma keys on union object");
    }

    if (!result.prismaKeys.intersection.select || result.prismaKeys.intersection.select.a !== true) {
        throw new Error("Failed to parse prisma keys on intersection");
    }

    // #endregion

    console.log("> End test to parse Zod Schema");
};

function main() {
    console.log("Starting tests...\n");

    testFormData();
    console.log("\n=========================================\n");

    testObject();
    console.log("\n=========================================\n");

    testZodSchemaParser();
    console.log("\n=========================================\n");

    console.log("\nAll tests passed!");
}

main();
