import isBoolean from "validator/lib/isBoolean";
import isMobilePhone from "validator/lib/isMobilePhone";
import isNumeric from "validator/lib/isNumeric";
import toBoolean from "validator/lib/toBoolean";
import toDate from "validator/lib/toDate";

export type StringParserOptions = {
    formatNumber?: boolean;
    formatBoolean?: boolean;
    formatDate?: boolean;
};

function isValidDate(dateString: string): boolean {
    // Check if the input is a string
    if (typeof dateString !== "string") {
        return false;
    }

    // Attempt to create a Date object from the input string
    const date = new Date(dateString);

    // Check if the resulting Date object is valid
    if (isNaN(date.getTime())) {
        return false;
    }

    // Check if the input string matches the ISO format
    const isoRegex = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?)?$/;
    if (!isoRegex.test(dateString)) {
        return false;
    }

    return true;
}

export const parseString = (str: string, options: StringParserOptions = {}) => {
    options.formatBoolean ??= true;
    options.formatDate ??= true;
    options.formatNumber ??= true;

    if (isNumeric(str) && !isMobilePhone(str) && options.formatNumber) {
        return Number(str);
    } else if (isBoolean(str) && options.formatBoolean) {
        return toBoolean(str);
    } else if (isValidDate(str) && options.formatDate) {
        return toDate(str)!;
    }

    return str;
};

export type DataFormatterOptions = {
    /**
     * If the returned value is undefined, the value then will be parsed using the default parser.
     * But if the returned value is anything else, the value will be set to the returned value.
     *
     * @param name The name of the key.
     * @param value The value of the key (If on array, the value is the element of the array)
     */
    customStringParser?: ({ name, value }: { name: string; value: string }) => FormattedFormData | undefined;

    /**
     * If true, empty strings will be kept as empty strings.
     * This not includes empty strings in arrays.
     */
    keepEmptyString?: boolean;

    /**
     * If true, empty strings in arrays will be kept as empty strings.
     */
    keepEmptyStringInArray?: boolean;

    /**
     * Options for the string parser.
     * By default, all options are enabled.
     */
    stringParserOptions?: StringParserOptions;
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
                const customParsed = options.customStringParser({ name: key, value });

                if (customParsed !== undefined) {
                    current[lastPart] = customParsed;
                    continue;
                }
            }

            if (value === "" && !options?.keepEmptyString) {
                delete current[lastPart];
            } else {
                current[lastPart] = parseString(value, options?.stringParserOptions);
            }
        } else if (Array.isArray(value)) {
            const filtered = options?.keepEmptyStringInArray ? value : value.filter((v) => v !== "");

            for (const [index, v] of filtered.entries()) {
                if (typeof v !== "string") continue;

                if (options?.customStringParser) {
                    const customParsed = options.customStringParser({ name: key, value: v });

                    if (customParsed !== undefined) {
                        filtered[index] = customParsed;
                        continue;
                    }
                }

                filtered[index] = parseString(v, options?.stringParserOptions);
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
