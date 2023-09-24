import type { AnyZodObject, TypeOf, ZodTypeAny } from "zod";

import { ZodArray, ZodIntersection, ZodNullable, ZodObject, ZodOptional, ZodUnion } from "zod";

export type UnionToIntersection<U> = (U extends U ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type NestedUnionToIntersection<T> = {
    [K in keyof T]: T[K] extends object ? (T[K] extends infer U ? UnionToIntersection<U> : never) : T[K];
};

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;

export type FormattedFormData =
    | number
    | boolean
    | FormDataEntryValue
    | File[]
    | Date
    | FormattedFormData[]
    | {
          [key: string]: FormattedFormData;
      };

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
    const data: Record<string, FormDataEntryValue | File[]> = {};

    for (const key of formData.keys()) {
        const value = formData.get(key);

        if (typeof value === "string") {
            data[key] = value;
        } else {
            const files = formData.getAll(key) as File[];

            if (files.length === 1) {
                data[key] = files[0];
            } else {
                data[key] = files;
            }
        }
    }

    return formatObject(data);
};

export type ZodSchemaKeys =
    | string
    | true
    | {
          [key: string]: ZodSchemaKeys;
      }
    | {
          (index: number): ZodSchemaKeys;
          key: string;
      };

export const getKeysFromZodSchema = (model: ZodTypeAny, isPrisma: boolean, prevKey?: string): ZodSchemaKeys => {
    if (model instanceof ZodObject || model.constructor.name === "ZodObject" || !!(model as AnyZodObject).shape) {
        const objKeys: ZodSchemaKeys = {};

        Object.entries((model as AnyZodObject).shape).map(([key, schema]) => {
            objKeys[key] = getKeysFromZodSchema(schema as ZodTypeAny, isPrisma, prevKey ? `${prevKey}.${key}` : key);
        });

        return objKeys;
    } else if (model instanceof ZodUnion || model.constructor.name === "ZodUnion" || Array.isArray((model as ZodUnion<[AnyZodObject]>).options)) {
        const result = (model as ZodUnion<[AnyZodObject]>).options.reduce((prev: ZodSchemaKeys, curr: ZodTypeAny) => {
            const result = getKeysFromZodSchema(curr, isPrisma, prevKey);

            return {
                ...(typeof prev === "object" ? prev : {}),
                ...(typeof result === "object" ? result : {}), //
            };
        }, {});

        if (Object.keys(result).length > 0) {
            return result;
        }
    } else if (model instanceof ZodIntersection || model.constructor.name === "ZodIntersection" || (!!model._def.left && !!model._def.right)) {
        const left = getKeysFromZodSchema(model._def.left, isPrisma, prevKey);
        const right = getKeysFromZodSchema(model._def.right, isPrisma, prevKey);

        return {
            ...(typeof left === "object" ? left : {}),
            ...(typeof right === "object" ? right : {}),
        };
    } else if (model instanceof ZodArray || model.constructor.name === "ZodArray" || (model as ZodArray<ZodTypeAny>).element) {
        const arrayElement = (model as ZodArray<ZodTypeAny>).element;

        if (!isPrisma) {
            const arrayKey = (index: number) => getKeysFromZodSchema(arrayElement, isPrisma, `${prevKey}.${index}`) as ZodSchemaKeys;
            arrayKey.key = prevKey!;

            return arrayKey;
        }

        return getKeysFromZodSchema(arrayElement, isPrisma, prevKey);
    } else if (
        model instanceof ZodOptional ||
        model.constructor.name === "ZodOptional" ||
        model instanceof ZodNullable ||
        model.constructor.name === "ZodNullable" ||
        typeof (model as ZodOptional<ZodTypeAny>).unwrap === "function"
    ) {
        return getKeysFromZodSchema((model as ZodOptional<ZodTypeAny>).unwrap(), isPrisma, prevKey);
    }

    if (prevKey) {
        return isPrisma ? true : prevKey;
    }

    return {};
};

export type CreateKeyWithPrevKey<PrevKey extends string, Key> = PrevKey extends "" ? Key : `${PrevKey}${Key extends string ? `.${Key}` : ""}`;

// Map key => key
// prettier-ignore
export type ParsedFormKeys<Type, PrevKey extends string = ""> = Required<{
    [K in keyof Type]: 
        // If key was an object, or an array
        Type[K] extends object
        
            // Exclude Date and File
            ? Type[K] extends Date | File
                ? K
            
            // If key was an array
            : Type[K] extends object[]
                ? {
                    <Index extends number>(index: Index): ParsedFormKeys<Type[K], K extends string ? `${K}.${Index}` : "">[0];
                    key: K;
                }
                
            // If key was a basic object (key => value)
            : ParsedFormKeys<Type[K], CreateKeyWithPrevKey<PrevKey, K>>
            
        // If key was a primitive (string, number, boolean)
        : CreateKeyWithPrevKey<PrevKey, K>;
}>;

// Map key => { select: key } | true
// prettier-ignore
export type ParsedPrismaKeys<Type> = Required<{
    [K in keyof Type]: 
        // If key was an object, or an array
        Type[K] extends object
        
            // Exclude Date and File
            ? Type[K] extends Date | File
                ? true
                
            // If key was other object or array
            : Record<
                "select",
                ParsedPrismaKeys<Type[K]> extends object[]
                    // If key was an array, get the first element
                    ? ParsedPrismaKeys<ArrayElement<Type[K]>>
                    
                    // If key was an object
                    : ParsedPrismaKeys<Type[K]>
            >
            
        // If key was a primitive (string, number, boolean)
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
    keys: ParsedFormKeys<Required<NestedUnionToIntersection<TypeOf<T>>>>;
    prismaKeys: ParsedPrismaKeys<Required<NestedUnionToIntersection<TypeOf<T>>>>;
    model: T;
};

export const parseZodSchema = <T extends ZodTypeAny>(model: T): ZodSchemaParsed<T> => {
    type TypeOfT = Required<NestedUnionToIntersection<TypeOf<T>>>;

    return {
        keys: getKeysFromZodSchema(model, false) as ParsedFormKeys<TypeOfT>,
        prismaKeys: convertZodKeysToPrismaSelect(getKeysFromZodSchema(model, true)) as ParsedPrismaKeys<TypeOfT>,
        model,
    };
};
