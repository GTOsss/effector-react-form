type IsRecordLike<T> = T extends object ? (string extends keyof T ? true : false) : false;

export type DerivedFieldType<T> = IsRecordLike<T> extends true
  ? string
  : T extends object
  ? {
      [K in keyof T]: K extends string | number
        ? T[K] extends object
          ? K | `${K}.${DerivedFieldType<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;
