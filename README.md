> ### ⚠ Please use latest version
>
> All bugs related to peer dependency, fail to parsing, and other bugs has been fixed in latest version
>
> **If you still have any problem, please make an issue in the GitHub repository**
>
> ---
>
> #### What's New on v.1.4.0?
>
> -   Improved Types, make type exactly as the result
> -   Add handler for multiple file input
> -   For Zod Union, if both left and right was not an object, it will treat itself as primitive value instead of an object, in the keys, it'll return the key instead of empty object
> -   Make all keys as intersection for Keys and PrismaKeys return type
> -   Add checking by its model props, in case if no peer dependency found (Next.js v13.5 issue)

# Zod Key Parser

Parse your Zod schema into keys or Prisma ORM select format

## What This Do?

### Transform this schema:

```js
import { parseZodSchema } from "zod-key-parser";

const schema = z.object({
    a: z.boolean(),
    b: z.string(),
    c: z.string(),
    d: z.string(),
    e: z.string(),
    f: z.string(),
    g: z.string(),
    h: z.array(
        z.object({
            ha: z.number(),
            hb: z.string(),
            hc: z.boolean(),
            hd: z.string(),
        })
    ),
    i: z.object({
        ia: z.number(),
    }),
});
```

### Into This

```ts
// schema.keys

{
  "a": "a",
  "b": "b",
  "c": "c",
  "d": "d",
  "e": "e",
  "f": "f",
  "g": "g",
  "h": (index: number) => {
  	"ha": `h.${index}.ha`,
  	"hb": `h.${index}.hb`,
  	"hc": `h.${index}.hc`,
  	"hd": `h.${index}.hd`,
  },
  "i": {
    "ia": "i.ia"
  }
}
```

So that you can use it on your form like this:

```tsx

<input name={schema.keys.a} type="string" ... />

```

### And This

```ts
// schema.prismaKeys
{
  "a": true,
  "b": true,
  "c": true,
  "d": true,
  "e": true,
  "f": true,
  "g": true,
  "h": {
    "select": {
      "ha": true,
      "hb": true,
      "hc": true,
      "hd": true
    }
  },
  "i": {
    "select": {
      "ia": true
    }
  }
}
```

So that you can use it on your Prisma ORM like this

```ts
const something = await prisma.table.findUnique({
  where: ...,
  select: schema.prismaKeys
})
```

## How About the Opposite? Don't Worry

There's 2 function, **`formatObject`** and **`formatFormData()`** that you can use

### 1. formatObject(object)

Use it to format object to keys format

-   Format this:

```ts
const inputData = {
    formkey1: "something",
    formkey2: "something",
    "formkey3.a": "something",
    "formkey3.b": "something",
    "formkey5.c": "something",
    "formarray.0.a": "something",
    "formarray.1.a": "something",
    "formarray.1.ab": "something",
    "formarray.2.c.d.0.a": "true",
    "formarray.2.c.d.1.a": "true",
};

const formattedData = formatObject(inputData);
```

-   Into this

```ts
// formattedData
{
  "formkey1": "something",
  "formkey2": "something",
  "formkey3": {
    "a": "something",
    "b": "something"
  },
  "formkey5": {
    "c": "something"
  },
  "formarray": [
    {
      "a": "something"
    },
    {
      "a": "something",
      "ab": "something"
    },
    {
      "c": {
        "d": [
          {
            "a": true
          },
          {
            "a": true
          }
        ]
      }
    }
  ]
}
```

### 2. formatFormData(formData)

Use it to format data from form action directly, **especially for React/Next.js user who use server action**

> It also use `formatObject()` under the hood

```tsx
const formAction = (formData: FormData) => {
  const parsed = schema.safeParse(formatFormData(formData));

  if (!parsed.success) {
    ...
  }
}

return (
  <form action={formAction}>
      <input name={schema.keys.a} />
      <input name={schema.keys.b} />
  </form>
)
```

## What's The Point of This?

#### Pros

-   Avoid typos in form name
-   Easily parsed form data with a little lines of code
-   For Prisma, improve your database performance by only selecting data to be used
-   _You'll lovin it like McDonalds says_

#### Cons

-   _Idk, maybe it's just too much for you? let me know_

## What You Should Know

-   Currently it doesn't support non object schema, if your schema is just like `z.string()` it wont parse anything since it doesn't have a key
-   It **Supports** ZodUnion, ZodIntersection, ZodArray, ZodOptional, ZodNullable, and ZodObject also of course the basic type like string, boolean and so on, i don't know if there are any Zod class that i should be aware of since i myself doesn't use anything beside what I've specify before.

## Any Suggestion or Problem?

Feel free to reach me at `me@raflymaulana.me` or just make a GitHub issue at [this repository](https://github.com/raflymln/zod-key-parser).
