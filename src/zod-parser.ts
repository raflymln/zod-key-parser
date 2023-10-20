import type { AnyZodObject, TypeOf, ZodTypeAny } from "zod";

import { ZodArray, ZodIntersection, ZodNullable, ZodObject, ZodOptional, ZodUnion } from "zod";

export type UnionToIntersection<U> = (U extends U ? (k: U) => void : never) extends (k: infer I) => void ? I : never;
export type NestedUnionToIntersection<T> = UnionToIntersection<{ [K in keyof T]: T[K] extends object ? (T[K] extends infer U ? UnionToIntersection<U> : never) : T[K] }>;
export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never;
export type CreateKeyWithPrevKey<PrevKey extends string, Key> = PrevKey extends "" ? Key : `${PrevKey}${Key extends string ? `.${Key}` : ""}`;
export type IsObject<T> = T extends object ? (T extends Date | File ? false : true) : false;

/**
 * Map object keys and it's children to concatenated string
 *
 * @example
 * // Input
 * const input = {
 *     a: string;
 *     b: {
 *         c: number;
 *         d: {
 *             e: boolean;
 *         };
 *     };
 * };
 *
 * // Result
 * type Result = {
 *     a: "a";
 *     b: {
 *         c: "b.c";
 *         d: {
 *             e: "b.d.e";
 *         };
 *     };
 * }
 */
export type ParsedFormKeys<Type, PrevKey extends string = ""> = Required<{
    // #region
    [K in keyof Type]: IsObject<Type[K]> extends true // If key was an object, or an array
        ? Type[K] extends object[] // If key was an array, set as a function
            ? {
                  <Index extends number>(index: Index): ParsedFormKeys<Type[K], K extends string ? `${K}.${Index}` : "">[0];
                  key: K;
              }
            : ParsedFormKeys<Type[K], CreateKeyWithPrevKey<PrevKey, K>>
        : CreateKeyWithPrevKey<PrevKey, K>; // If key was a primitive (string, number, boolean)
    // #endregion
}>;

/**
 * Map object keys and it's children to concatenated string
 * Same as ParsedFormKeys but follows Prisma ORM select syntax
 *
 * @see https://www.prisma.io/docs/concepts/components/prisma-client/select-fields#select-specific-fields
 *
 * @example
 * // Input
 * const input = {
 *     a: string;
 *     b: {
 *         c: number;
 *         d: {
 *             e: boolean;
 *         };
 *     };
 * };
 *
 * // Result
 * type Result = {
 *     a: true;
 *     b: {
 *         select: {
 *             c: true;
 *             d: {
 *                 select: {
 *                     e: true;
 *                 };
 *             };
 *         };
 *     }
 * }
 */
export type ParsedPrismaKeys<Type> = Required<{
    // #region
    [K in keyof Type]: IsObject<Type[K]> extends true // If key was an object, or an array
        ? Record<
              "select",
              ParsedPrismaKeys<Type[K]> extends object[]
                  ? ParsedPrismaKeys<ArrayElement<Type[K]>> // If key was an array, get the first element
                  : ParsedPrismaKeys<Type[K]> // If key was an object
          >
        : true; // If key was a primitive (string, number, boolean)
    // #endregion
}>;

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

export const getKeysFromZodSchema = (model: ZodTypeAny, isForPrisma: boolean, parentKey?: string): ZodSchemaKeys => {
    if (model instanceof ZodObject || model.constructor.name === "ZodObject" || !!(model as AnyZodObject).shape) {
        const objKeys: ZodSchemaKeys = {};

        Object.entries((model as AnyZodObject).shape).map(([key, schema]) => {
            objKeys[key] = getKeysFromZodSchema(schema as ZodTypeAny, isForPrisma, parentKey ? `${parentKey}.${key}` : key);
        });

        return objKeys;
    } else if (model instanceof ZodUnion || model.constructor.name === "ZodUnion" || Array.isArray((model as ZodUnion<[AnyZodObject]>).options)) {
        const result = (model as ZodUnion<[AnyZodObject]>).options.reduce((prev: ZodSchemaKeys, curr: ZodTypeAny) => {
            const result = getKeysFromZodSchema(curr, isForPrisma, parentKey);

            return {
                ...(typeof prev === "object" ? prev : {}),
                ...(typeof result === "object" ? result : {}), //
            };
        }, {});

        if (Object.keys(result).length > 0) {
            return result;
        }
    } else if (model instanceof ZodIntersection || model.constructor.name === "ZodIntersection" || (!!model._def?.left && !!model._def?.right)) {
        const left = getKeysFromZodSchema(model._def.left, isForPrisma, parentKey);
        const right = getKeysFromZodSchema(model._def.right, isForPrisma, parentKey);

        return {
            ...(typeof left === "object" ? left : {}),
            ...(typeof right === "object" ? right : {}),
        };
    } else if (model instanceof ZodArray || model.constructor.name === "ZodArray" || (model as ZodArray<ZodTypeAny>).element) {
        const arrayElement = (model as ZodArray<ZodTypeAny>).element;

        if (!isForPrisma) {
            const arrayKey = (index: number) => getKeysFromZodSchema(arrayElement, isForPrisma, `${parentKey}.${index}`) as ZodSchemaKeys;
            arrayKey.key = parentKey!;

            return arrayKey;
        }

        return getKeysFromZodSchema(arrayElement, isForPrisma, parentKey);
    } else if (
        model instanceof ZodOptional ||
        model.constructor.name === "ZodOptional" ||
        model instanceof ZodNullable ||
        model.constructor.name === "ZodNullable" ||
        typeof (model as ZodOptional<ZodTypeAny>).unwrap === "function"
    ) {
        return getKeysFromZodSchema((model as ZodOptional<ZodTypeAny>).unwrap(), isForPrisma, parentKey);
    }

    if (parentKey) {
        return isForPrisma ? true : parentKey;
    }

    return {};
};

export const convertExtractedZodKeysToPrismaSelect = (keys: ZodSchemaKeys) => {
    const prismaKeysSelect = {} as Record<string, unknown>;

    for (const [key, value] of Object.entries(keys)) {
        if (typeof value === "boolean") {
            prismaKeysSelect[key] = value;
        } else {
            prismaKeysSelect[key] = {
                select: convertExtractedZodKeysToPrismaSelect(value),
            };
        }
    }

    return prismaKeysSelect;
};

export type ParsedZodSchema<Model extends ZodTypeAny> = {
    keys: ParsedFormKeys<Required<NestedUnionToIntersection<TypeOf<Model>>>>;
    prismaKeys: ParsedPrismaKeys<Required<NestedUnionToIntersection<TypeOf<Model>>>>;
    model: Model;
};

export const parseZodSchema = <Model extends ZodTypeAny>(model: Model): ParsedZodSchema<Model> => {
    type TypeOfModel = Required<NestedUnionToIntersection<TypeOf<Model>>>;

    return {
        keys: getKeysFromZodSchema(model, false) as ParsedFormKeys<TypeOfModel>,
        prismaKeys: convertExtractedZodKeysToPrismaSelect(getKeysFromZodSchema(model, true)) as ParsedPrismaKeys<TypeOfModel>,
        model,
    };
};
