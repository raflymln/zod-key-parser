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
        a: z.boolean(),
        b: z.string(),
        h: z.array(
            z.object({
                ha: z.number(),
                hb: z.string(),
                hc: z.boolean(),
                hd: z.string(),
            })
        ),
        i: z.object({
            ia: z.number(),
        }),
    });

    console.log("> Begin test to parse Zod Schema");
    const result = parseZodSchema(schema);

    console.log("- Testing Keys");
    console.log(result.keys);

    if (result.keys.a !== "a" || result.keys.b !== "b") {
        throw new Error("Failed to parse keys");
    }

    if (typeof result.keys.h !== "function" || result.keys.h.key !== "h") {
        throw new Error("Failed to parse keys on array");
    }

    const arrValue = result.keys.h(0);

    if (arrValue.ha !== "h.0.ha") {
        throw new Error("Failed to parse keys on array value");
    }

    if (typeof result.keys.i !== "object" || result.keys.i.ia !== "i.ia") {
        throw new Error("Failed to parse keys on object");
    }

    console.log("- Testing Prisma Keys");
    console.log(result.prismaKeys);

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
