import type { ZodType, infer as Infer } from "zod";

import { isZodArray, isZodDefault, isZodPipe, isZodIntersection, isZodNullable, isZodObject, isZodOptional, isZodPrimitives, isZodPromise, isZodReadonly, isZodUnion } from ".";

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
            : ParsedFormKeys<
                  Type[K],
                  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                  // @ts-expect-error
                  CreateKeyWithPrevKey<PrevKey, K>
              >
        : CreateKeyWithPrevKey<PrevKey, K>; // If key was a primitive (string, number, boolean)
    // #endregion
}>;

/**
 * Map object keys and it's children to concatenated string
 * Same as ParsedFormKeys but return boolean instead of string or any other type
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
export type ParsedSelectKeys<Type> = Required<{
    // #region
    [K in keyof Type]: IsObject<Type[K]> extends true // If key was an object, or an array
        ? Record<
              "select",
              ParsedSelectKeys<Type[K]> extends object[]
                  ? ParsedSelectKeys<ArrayElement<Type[K]>> // If key was an array, get the first element
                  : ParsedSelectKeys<Type[K]> // If key was an object
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

export const getKeysFromZodSchema = (model: ZodTypeAny, isSelectKey: boolean, parentKey?: string): ZodSchemaKeys => {
    if (isZodObject(model)) {
        const objKeys: ZodSchemaKeys = {};

        Object.entries(model.shape).map(([key, schema]) => {
            objKeys[key] = getKeysFromZodSchema(schema as ZodTypeAny, isSelectKey, parentKey ? `${parentKey}.${key}` : key);
        });

        return objKeys;
    } else if (isZodUnion(model)) {
        const result = model.options.reduce((prev: ZodSchemaKeys, curr: ZodTypeAny) => {
            const result = getKeysFromZodSchema(curr, isSelectKey, parentKey);

            return {
                ...(typeof prev === "object" ? prev : {}),
                ...(typeof result === "object" ? result : {}), //
            };
        }, {});

        if (Object.keys(result).length > 0) {
            return result;
        }
    } else if (isZodIntersection(model)) {
        const left = getKeysFromZodSchema(model._def.left, isSelectKey, parentKey);
        const right = getKeysFromZodSchema(model._def.right, isSelectKey, parentKey);

        return {
            ...(typeof left === "object" ? left : {}),
            ...(typeof right === "object" ? right : {}),
        };
    } else if (isZodArray(model)) {
        const arrayElement = model.element;

        if (!isSelectKey && !isZodPrimitives(arrayElement)) {
            const arrayKey = (index: number) => getKeysFromZodSchema(arrayElement, isSelectKey, `${parentKey}.${index}`);
            arrayKey.key = parentKey!;

            return arrayKey;
        }

        return getKeysFromZodSchema(arrayElement, isSelectKey, parentKey);
    } else if (isZodOptional(model) || isZodNullable(model) || isZodPromise(model)) {
        return getKeysFromZodSchema(model.unwrap(), isSelectKey, parentKey);
    } else if (isZodDefault(model) || isZodReadonly(model)) {
        return getKeysFromZodSchema(model._def.innerType, isSelectKey, parentKey);
    } else if (isZodEffects(model)) {
        return getKeysFromZodSchema(model._def.schema, isSelectKey, parentKey);
    }

    if (parentKey) {
        return isSelectKey ? true : parentKey;
    }

    return {};
};

export const convertExtractedZodKeysToSelectKeys = (keys: ZodSchemaKeys) => {
    const selections = {} as Record<string, unknown>;

    for (const [key, value] of Object.entries(keys)) {
        if (typeof value === "boolean") {
            selections[key] = value;
        } else {
            selections[key] = {
                select: convertExtractedZodKeysToSelectKeys(value),
            };
        }
    }

    return selections;
};

export type ParsedZodSchema<Model extends ZodTypeAny> = {
    keys: ParsedFormKeys<Required<NestedUnionToIntersection<TypeOf<Model>>>>;
    prismaKeys: ParsedSelectKeys<Required<NestedUnionToIntersection<TypeOf<Model>>>>;
    selectKeys: ParsedSelectKeys<Required<NestedUnionToIntersection<TypeOf<Model>>>>;
    model: Model;
};

export const parseZodSchema = <Model extends ZodType>(model: Model): ParsedZodSchema<Model> => {
    type InferredModel = Required<NestedUnionToIntersection<Infer<Model>>>;

    return {
        keys: getKeysFromZodSchema(model, false) as ParsedFormKeys<TypeOfModel>,
        get prismaKeys() {
            console.warn("prismaKeys is deprecated, please use selectKeys instead");
            return convertExtractedZodKeysToSelectKeys(getKeysFromZodSchema(model, true)) as ParsedSelectKeys<TypeOfModel>;
        },
        selectKeys: convertExtractedZodKeysToSelectKeys(getKeysFromZodSchema(model, true)) as ParsedSelectKeys<TypeOfModel>,
        model,
    };
};
