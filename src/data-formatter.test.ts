import type { DataFormatterOptions } from ".";

import { formatFormData, formatObject } from ".";

import { File } from "@web-std/file";

import assert from "assert";
import { randomUUID } from "crypto";

describe("Data Formatter (`formatObject` and `formatFormData`)", () => {
    type ResultTestObject = {
        uuid: string;
        name: string;
        phoneNumber: string;
        phoneNumberIndonesia: string;
        phoneNumberAlbania: string;

        isWorking: boolean;

        dateOfBirth: Date;
        gmt7Date: Date;
        dateISO: Date;
        dateString: string;

        smallNumber: number;
        mediumNumber: string;
        largeNumber: string;
        float: number;

        tags: string[];
        tagIds: number[];

        status: {
            isAlive: boolean;
            url: string;
            longUrl: string;
        };

        image: {
            photo: File[];
            profilePicture: File;
        };

        deepNested: {
            children: {
                anotherChildren: {
                    name: string;
                    age: number;
                    file: File;

                    aliases: string[];
                    aliasIds: number[];
                    images: File[];
                };
            };
        };
    };

    const testFile = new File(["test"], "test.ts");

    const inputTestObject = {
        uuid: randomUUID(),
        name: "John Doe",
        phoneNumber: "02348161892",
        phoneNumberIndonesia: "+622223651741",
        phoneNumberAlbania: "+35586596157",

        isWorking: "false",
        "status.isAlive": "true",

        dateOfBirth: "1999-01-01",
        gmt7Date: "2017-08-25 09:11:35 GMT+7",
        dateISO: new Date("2022-01-01").toISOString(),
        dateString: new Date().toString(),

        smallNumber: "269",
        mediumNumber: Date.now().toString(),
        largeNumber: Math.pow(2, 53).toString(),
        float: Math.PI.toString(),

        tags: ["", "a", "b", "", "c", "", ""],
        tagIds: ["", "1", "", "2", "3", ""],

        "status.url": "https://google.com",
        "status.longUrl":
            "https://www.google.com/search?q=assert+js&sca_esv=575137264&sxsrf=AM9HkKm_4PcHqB0_Z68mH7Zsxg1p2j8xcA%3A1697793344716&ei=QEUyZYGmK7W2qtsP5ravgAg&ved=0ahUKEwiBxtqJpYSCAxU1m2oFHWbbC4AQ4dUDCBE&uact=5&oq=assert+js&gs_lp=Egxnd3Mtd2l6LXNlcnAiCWFzc2VydCBqczIHEAAYigUYQzIFEAAYgAQyBxAAGIoFGEMyBRAAGIAEMgUQABiABDIFEAAYgAQyBRAAGIAEMggQABjLARiABDIFEAAYgAQyBRAAGIAESOEGUN0BWPwFcAB4ApABAJgBygSgAcoEqgEDNS0xuAEDyAEA-AEBwgIEEAAYR-IDBBgAIEGIBgGQBgg&sclient=gws-wiz-serp",

        "image.photo": [testFile, testFile, "", testFile],
        "image.profilePicture": testFile,

        "deepNested.children.anotherChildren.name": "John Doe",
        "deepNested.children.anotherChildren.age": "20",
        "deepNested.children.anotherChildren.file": testFile,
        "deepNested.children.anotherChildren.aliases": ["", "a", "b", "", "c", "", ""],
        "deepNested.children.anotherChildren.aliasIds": ["", "1", "", "2", "3", ""],
        "deepNested.children.anotherChildren.images": [testFile, testFile, "", testFile],
    } satisfies Record<string, string | File | (File | string)[]>;

    const formData = new FormData();

    for (const key in inputTestObject) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const value = inputTestObject[key] as string | string[] | File | File[];

        if (Array.isArray(value)) {
            for (const file of value) {
                formData.append(key, file);
            }
        } else {
            formData.append(key, value);
        }
    }

    const formatterOptions: DataFormatterOptions = {
        customStringParser: ({ value }) => {
            // Cannot parse localized phone number
            if (value === inputTestObject.phoneNumberIndonesia) {
                return inputTestObject.phoneNumberIndonesia;
            }

            if (value === inputTestObject.phoneNumberAlbania) {
                return inputTestObject.phoneNumberAlbania;
            }

            // Cannot parse localized date string with timezone
            if (value === inputTestObject.gmt7Date) {
                return new Date(inputTestObject.gmt7Date);
            }

            return undefined;
        },
    };

    const objectResult = formatObject(inputTestObject, formatterOptions) as ResultTestObject;
    const formDataResult = formatFormData(formData, formatterOptions) as ResultTestObject;

    it("Both `formatObject` and `formatFormData` should return the same result", () => {
        assert.deepStrictEqual(objectResult, formDataResult);
    });

    it("The value of this should be the same as the input (string)", () => {
        assert.strictEqual(formDataResult.uuid, inputTestObject.uuid);
        assert.strictEqual(formDataResult.name, inputTestObject.name);

        assert.strictEqual(formDataResult.phoneNumber, inputTestObject.phoneNumber);
        assert.strictEqual(formDataResult.phoneNumberIndonesia, inputTestObject.phoneNumberIndonesia);
        assert.strictEqual(formDataResult.phoneNumberAlbania, inputTestObject.phoneNumberAlbania);

        assert.strictEqual(formDataResult.status.url, inputTestObject["status.url"]);
        assert.strictEqual(formDataResult.status.longUrl, inputTestObject["status.longUrl"]);
    });

    it("The value of this should be a boolean version of the input (boolean)", () => {
        assert.strictEqual(formDataResult.isWorking, false);
        assert.strictEqual(formDataResult.status.isAlive, true);
    });

    it("The value of this should be a Date version of the input (Date)", () => {
        assert.strictEqual(formDataResult.dateOfBirth instanceof Date, true);
        assert.strictEqual(formDataResult.dateOfBirth.toISOString(), new Date(inputTestObject.dateOfBirth).toISOString());

        assert.strictEqual(formDataResult.gmt7Date instanceof Date, true);
        assert.strictEqual(formDataResult.gmt7Date.toISOString(), new Date(inputTestObject.gmt7Date).toISOString());

        assert.strictEqual(formDataResult.dateISO instanceof Date, true);
        assert.strictEqual(formDataResult.dateISO.toISOString(), new Date(inputTestObject.dateISO).toISOString());

        assert.strictEqual(formDataResult.dateString, inputTestObject.dateString);
        assert.strictEqual(formDataResult.dateString, new Date(inputTestObject.dateString).toString());
    });

    it("The value of this should be a number version of the input (number)", () => {
        assert.strictEqual(formDataResult.smallNumber, Number(inputTestObject.smallNumber));
        assert.strictEqual(formDataResult.mediumNumber, Number(inputTestObject.mediumNumber));
        assert.strictEqual(formDataResult.largeNumber, Number(inputTestObject.largeNumber));
        assert.strictEqual(formDataResult.float, Number(inputTestObject.float));
    });

    it("`tags` should return an array of string without the empty one", () => {
        assert.equal(Array.isArray(formDataResult.tags), true);
        assert.equal(formDataResult.tags.length, 3);
        assert.strictEqual(formDataResult.tags[0], "a");
    });

    it("`tagIds` should return an array of number without the empty one", () => {
        assert.equal(Array.isArray(formDataResult.tagIds), true);
        assert.equal(formDataResult.tagIds.length, 3);
        assert.strictEqual(formDataResult.tagIds[0], 1);
    });

    it("`image.photo` should return an array of files", () => {
        assert.equal(Array.isArray(formDataResult.image.photo), true);
        assert.equal(formDataResult.image.photo.length, 3);
        assert.strictEqual(formDataResult.image.photo[0] instanceof File, true);
    });

    it("`image.profilePicture` should return a single file", () => {
        assert.equal(formDataResult.image.profilePicture instanceof File, true);
    });

    it("`deepNested should work as expected", () => {
        assert.equal(formDataResult.deepNested.children.anotherChildren.name, inputTestObject["deepNested.children.anotherChildren.name"]);
        assert.strictEqual(formDataResult.deepNested.children.anotherChildren.age, Number(inputTestObject["deepNested.children.anotherChildren.age"]));
        assert.strictEqual(formDataResult.deepNested.children.anotherChildren.file instanceof File, true);

        assert.equal(Array.isArray(formDataResult.deepNested.children.anotherChildren.aliases), true);
        assert.equal(formDataResult.deepNested.children.anotherChildren.aliases.length, 3);
        assert.strictEqual(formDataResult.deepNested.children.anotherChildren.aliases[0], "a");

        assert.equal(Array.isArray(formDataResult.deepNested.children.anotherChildren.aliasIds), true);
        assert.equal(formDataResult.deepNested.children.anotherChildren.aliasIds.length, 3);
        assert.strictEqual(formDataResult.deepNested.children.anotherChildren.aliasIds[0], 1);

        assert.equal(Array.isArray(formDataResult.deepNested.children.anotherChildren.images), true);
        assert.equal(formDataResult.deepNested.children.anotherChildren.images.length, 3);
        assert.strictEqual(formDataResult.deepNested.children.anotherChildren.images[0] instanceof File, true);
    });
});
