import type { AnyZodObject, TypeOf, ZodTypeAny } from "zod";

// eslint-disable-next-line import/no-namespace
import * as zod from "zod";

export type UnionToIntersection<U> = (U extends U ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type FormattedFormData = number | boolean | FormDataEntryValue | Date | FormattedFormData[] | { [key: string]: FormattedFormData };

export const formatObject = (data: Record<string, FormattedFormData>) => {
    const parsed: Record<string, FormattedFormData> = {};

    for (const key in data) {
        let current: Record<string, FormattedFormData> = parsed;
        const parts = key.split(".");

        // Traverse the parts of the key to build the nested structure
        for (let i = 0; i < parts.length - 1; i++) {
            const part = parts[i];

            // Create an empty object or array if not already present
            if (!current[part]) {
                current[part] = isNaN(Number(parts[i + 1])) ? {} : [];
            }

            // The reason changes in `current` below also reflect on the output variable is due to how JavaScript handles objects and references.
            // When you set `current` to any value, you're actually modifying a property within the output object.
            current = current[part] as Record<string, FormattedFormData>;
        }

        const lastPart = parts[parts.length - 1];
        const value = (current[lastPart] = data[key]);

        if (typeof value === "string") {
            if (value === "") {
                delete current[lastPart];
            } else if (!isNaN(Number(value))) {
                current[lastPart] = Number(value);
            } else if (!isNaN(Date.parse(value))) {
                current[lastPart] = new Date(value);
            } else if (value === "true" || value === "false") {
                current[lastPart] = value === "true";
            }
        }
    }

    return parsed;
};

export const formatFormData = (formData: FormData) => {
    const data: Record<string, FormDataEntryValue> = Object.fromEntries(formData);
    return formatObject(data);
};

export type ZodSchemaKeys =
    | string
    | true
    | {
          [key: string]:
              | ZodSchemaKeys
              | {
                    (index: number): ZodSchemaKeys;
                    key: string;
                };
      };

export const getKeysFromZodSchema = (model: ZodTypeAny, isPrisma: boolean, prevKey?: string, zod_1?: typeof zod.z): ZodSchemaKeys => {
    if (typeof window !== "undefined") {
        console.log(model.constructor.name, zod.z === zod_1, zod.ZodObject === zod_1?.ZodObject);
    }

    if (model instanceof zod.ZodObject || model.constructor.name === "ZodObject") {
        const objKeys: ZodSchemaKeys = {};

        Object.entries((model as AnyZodObject).shape).map(([key, schema]) => {
            if (schema instanceof zod.ZodArray && !isPrisma) {
                const arrayKey = (index: number) => getKeysFromZodSchema(schema as ZodTypeAny, isPrisma, prevKey ? `${prevKey}.${key}.${index}` : `${key}.${index}`) as ZodSchemaKeys;
                arrayKey.key = prevKey ? `${prevKey}.${key}` : key;

                objKeys[key] = arrayKey;
            } else {
                objKeys[key] = getKeysFromZodSchema(schema as ZodTypeAny, isPrisma, prevKey ? `${prevKey}.${key}` : key);
            }
        });

        return objKeys;
    } else if (model instanceof zod.ZodUnion || model.constructor.name === "ZodUnion") {
        return (model as zod.ZodUnion<[ZodTypeAny]>).options.reduce((prev: ZodSchemaKeys, curr: ZodTypeAny) => {
            const result = getKeysFromZodSchema(curr, isPrisma, prevKey);

            return {
                ...(typeof prev === "object" ? prev : {}),
                ...(typeof result === "object" ? result : {}), //
            };
        }, {});
    } else if (model instanceof zod.ZodIntersection || model.constructor.name === "ZodIntersection") {
        const left = getKeysFromZodSchema(model._def.left, isPrisma, prevKey);
        const right = getKeysFromZodSchema(model._def.right, isPrisma, prevKey);

        return {
            ...(typeof left === "object" ? left : {}),
            ...(typeof right === "object" ? right : {}),
        };
    } else if (model instanceof zod.ZodArray || model.constructor.name === "ZodArray") {
        return getKeysFromZodSchema((model as zod.ZodArray<ZodTypeAny>).element, isPrisma, prevKey);
    } else if (model instanceof zod.ZodOptional || model.constructor.name === "ZodOptional" || model instanceof zod.ZodNullable || model.constructor.name === "ZodNullable") {
        return getKeysFromZodSchema((model as zod.ZodOptional<ZodTypeAny>).unwrap(), isPrisma, prevKey);
    }

    if (prevKey) {
        return isPrisma ? true : prevKey;
    }

    return {};
};

// Map key => key
export type ParsedFormKeys<Type> = Required<{
    [K in keyof Type]: Type[K] extends object //
        ? Type[K] extends Date
            ? K
            : ParsedFormKeys<Type[K]> extends object[]
            ? {
                  (index: number): ParsedFormKeys<Type[K]>[0];
                  key: K;
              }
            : ParsedFormKeys<Type[K]>
        : K;
}>;

// Map key => { select: key } | true
export type ParsedPrismaKeys<Type> = Required<{
    [K in keyof Type]: Type[K] extends object //
        ? Type[K] extends Date
            ? true
            : Record<
                  "select",
                  ParsedPrismaKeys<Type[K]> extends object[] //
                      ? ParsedPrismaKeys<ArrayElement<Type[K]>>
                      : ParsedPrismaKeys<Type[K]>
              >
        : true;
}>;

export const convertZodKeysToPrismaSelect = (prismaKeys: ZodSchemaKeys = {}) => {
    const prismaKeysSelect = {} as Record<string, unknown>;

    for (const [key, value] of Object.entries(prismaKeys)) {
        if (typeof value === "boolean") {
            prismaKeysSelect[key] = value;
        } else {
            prismaKeysSelect[key] = {
                select: convertZodKeysToPrismaSelect(value),
            };
        }
    }

    return prismaKeysSelect;
};

type ZodSchemaParsed<T extends ZodTypeAny> = {
    keys: ParsedFormKeys<Required<UnionToIntersection<TypeOf<T>>>>;
    prismaKeys: ParsedPrismaKeys<Required<UnionToIntersection<TypeOf<T>>>>;
    model: T;
};

export const parseZodSchema = <T extends ZodTypeAny>(model: T): ZodSchemaParsed<T> => {
    type TypeOfT = Required<UnionToIntersection<TypeOf<T>>>;

    return {
        keys: getKeysFromZodSchema(model, false) as ParsedFormKeys<TypeOfT>,
        prismaKeys: convertZodKeysToPrismaSelect(getKeysFromZodSchema(model, true)) as ParsedPrismaKeys<TypeOfT>,
        model,
    };
};