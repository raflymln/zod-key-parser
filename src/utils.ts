import type { AnyZodObject, ZodTypeAny } from "zod";

import { ZodOptional, ZodIntersection, ZodUnion, ZodObject, ZodArray, ZodNullable, ZodFirstPartyTypeKind } from "zod";

export const isZodObject = (model: ZodTypeAny): model is AnyZodObject => {
    return model instanceof ZodObject || model._def.typeName === ZodFirstPartyTypeKind.ZodObject;
};

export const isZodUnion = (model: ZodTypeAny): model is ZodUnion<[AnyZodObject]> => {
    return model instanceof ZodUnion || model._def.typeName === ZodFirstPartyTypeKind.ZodUnion;
};

export const isZodIntersection = (model: ZodTypeAny): model is ZodIntersection<ZodTypeAny, ZodTypeAny> => {
    return model instanceof ZodIntersection || model._def.typeName === ZodFirstPartyTypeKind.ZodIntersection;
};

export const isZodArray = (model: ZodTypeAny): model is ZodArray<ZodTypeAny> => {
    return model instanceof ZodArray || model._def.typeName === ZodFirstPartyTypeKind.ZodArray;
};

export const isZodOptional = (model: ZodTypeAny): model is ZodOptional<ZodTypeAny> => {
    return model instanceof ZodOptional || model._def.typeName === ZodFirstPartyTypeKind.ZodOptional;
};

export const isZodNullable = (model: ZodTypeAny): model is ZodNullable<ZodTypeAny> => {
    return model instanceof ZodNullable || model._def.typeName === ZodFirstPartyTypeKind.ZodNullable;
};

export const isZodPrimitives = (model: ZodTypeAny): boolean => {
    const type = model._def.typeName as ZodFirstPartyTypeKind;

    switch (type) {
        case ZodFirstPartyTypeKind.ZodString:
        case ZodFirstPartyTypeKind.ZodNumber:
        case ZodFirstPartyTypeKind.ZodBigInt:
        case ZodFirstPartyTypeKind.ZodBoolean:
        case ZodFirstPartyTypeKind.ZodDate:
        case ZodFirstPartyTypeKind.ZodSymbol:
        case ZodFirstPartyTypeKind.ZodUndefined:
        case ZodFirstPartyTypeKind.ZodNull:
        case ZodFirstPartyTypeKind.ZodVoid:
        case ZodFirstPartyTypeKind.ZodAny:
        case ZodFirstPartyTypeKind.ZodUnknown:
        case ZodFirstPartyTypeKind.ZodNever:
            return true;

        default:
            return false;
    }
};
