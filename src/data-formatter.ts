import isBoolean from "validator/lib/isBoolean";
import isDate from "validator/lib/isDate";
import isMobilePhone from "validator/lib/isMobilePhone";
import isNumeric from "validator/lib/isNumeric";
import toBoolean from "validator/lib/toBoolean";
import toDate from "validator/lib/toDate";

export const parseString = (str: string) => {
    if (isNumeric(str) && !isMobilePhone(str)) {
        return Number(str);
    } else if (isDate(str)) {
        return toDate(str)!;
    } else if (isBoolean(str)) {
        return toBoolean(str);
    }

    return str;
};

export type DataFormatterOptions = {
    /**
     * If the returned value is undefined, the value then will be parsed using the default parser.
     * But if the returned value is anything else, the value will be set to the returned value.
     */
    customStringParser?: (value: string) => FormattedFormData | undefined;

    /**
     * If true, empty strings will be kept as empty strings.
     * This not includes empty strings in arrays.
     */
    keepEmptyString?: boolean;

    /**
     * If true, empty strings in arrays will be kept as empty strings.
     */
    keepEmptyStringInArray?: boolean;
};

export type FormattedFormData =
    | number
    | boolean
    | FormDataEntryValue
    | string[]
    | File[]
    | Date
    | FormattedFormData[]
    | {
          [key: string]: FormattedFormData;
      };

export const formatObject = (data: Record<string, FormattedFormData>, options?: DataFormatterOptions) => {
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
            if (options?.customStringParser) {
                const customParsed = options.customStringParser(value);

                if (customParsed !== undefined) {
                    current[lastPart] = customParsed;
                    continue;
                }
            }

            if (value === "" && !options?.keepEmptyString) {
                delete current[lastPart];
            } else {
                current[lastPart] = parseString(value);
            }
        } else if (Array.isArray(value)) {
            const filtered = options?.keepEmptyStringInArray ? value : value.filter((v) => v !== "");

            for (const [index, v] of filtered.entries()) {
                if (typeof v !== "string") continue;

                if (options?.customStringParser) {
                    const customParsed = options.customStringParser(v);

                    if (customParsed !== undefined) {
                        filtered[index] = customParsed;
                        continue;
                    }
                }

                filtered[index] = parseString(v);
            }

            current[lastPart] = filtered;
        }
    }

    return parsed;
};

export const formatFormData = (formData: FormData, options?: DataFormatterOptions) => {
    const data: Record<string, FormattedFormData> = {};

    for (const key of formData.keys()) {
        const files = formData.getAll(key) as File[] | string[];

        if (files.length === 1) {
            data[key] = files[0];
        } else {
            data[key] = files;
        }
    }

    return formatObject(data, options);
};
