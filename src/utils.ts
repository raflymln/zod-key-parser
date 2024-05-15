import type { AnyZodObject, ZodTypeAny } from "zod";

import { ZodPromise, ZodDefault, ZodOptional, ZodIntersection, ZodUnion, ZodObject, ZodArray, ZodNullable, ZodFirstPartyTypeKind, ZodReadonly } from "zod";

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

export const isZodDefault = (model: ZodTypeAny): model is ZodDefault<ZodTypeAny> => {
    return model instanceof ZodDefault || model._def.typeName === ZodFirstPartyTypeKind.ZodDefault;
};

export const isZodNullable = (model: ZodTypeAny): model is ZodNullable<ZodTypeAny> => {
    return model instanceof ZodNullable || model._def.typeName === ZodFirstPartyTypeKind.ZodNullable;
};

export const isZodPromise = (model: ZodTypeAny): model is ZodPromise<ZodTypeAny> => {
    return model instanceof ZodPromise || model._def.typeName === ZodFirstPartyTypeKind.ZodPromise;
};

export const isZodReadonly = (model: ZodTypeAny): model is ZodReadonly<ZodTypeAny> => {
    return model instanceof ZodReadonly || model._def.typeName === ZodFirstPartyTypeKind.ZodReadonly;
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
        case ZodFirstPartyTypeKind.ZodNaN:
            return true;

        default:
            return false;
    }
};
