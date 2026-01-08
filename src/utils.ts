import type { ZodType } from "zod";

import { ZodPromise, ZodDefault, ZodOptional, ZodIntersection, ZodUnion, ZodObject, ZodArray, ZodNullable, ZodReadonly, ZodPipe } from "zod";

export const isZodObject = (model: ZodType): model is ZodObject => {
    return model instanceof ZodObject || model.def.type === "object";
};

export const isZodUnion = (model: ZodType): model is ZodUnion<[ZodType<ZodObject>]> => {
    return model instanceof ZodUnion || model.def.type === "union";
};

export const isZodIntersection = (model: ZodType): model is ZodIntersection<ZodType, ZodType> => {
    return model instanceof ZodIntersection || model.def.type === "intersection";
};

export const isZodArray = (model: ZodType): model is ZodArray<ZodType> => {
    return model instanceof ZodArray || model.def.type === "array";
};

export const isZodOptional = (model: ZodType): model is ZodOptional<ZodType> => {
    return model instanceof ZodOptional || model.def.type === "optional";
};

export const isZodDefault = (model: ZodType): model is ZodDefault<ZodType> => {
    return model instanceof ZodDefault || model.def.type === "default";
};

export const isZodNullable = (model: ZodType): model is ZodNullable<ZodType> => {
    return model instanceof ZodNullable || model.def.type === "nullable";
};

export const isZodPromise = (model: ZodType): model is ZodPromise<ZodType> => {
    return model instanceof ZodPromise || model.def.type === "promise";
};

export const isZodReadonly = (model: ZodType): model is ZodReadonly<ZodType> => {
    return model instanceof ZodReadonly || model.def.type === "readonly";
};

export const isZodPipe = (model: ZodType): model is ZodPipe<ZodType> => {
    return model instanceof ZodPipe || model.def.type === "pipe";
};

export const isZodPrimitives = (model: ZodType): boolean => {
    const type = model.def.type;

    switch (type) {
        case "string":
        case "number":
        case "bigint":
        case "boolean":
        case "date":
        case "symbol":
        case "undefined":
        case "null":
        case "void":
        case "any":
        case "unknown":
        case "never":
        case "nan":
            return true;

        default:
            return false;
    }
};
