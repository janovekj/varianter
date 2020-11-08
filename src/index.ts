type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never;

// helper
export type UnionToVariantMap<
  U extends { [key: string]: any },
  C extends keyof U
> = Expand<
  UnionToIntersection<
    U extends any ? { [K in U[C]]: Expand<Omit<U, C>> } : never
  >
>;

type VariantMap = {
  [key: string]: any;
};

type MapVariantMap<T extends VariantMap> = {
  [K in keyof T]: (data: T[K]) => any;
};

type VariantData<T extends VariantMap> = Expand<
  {
    [K in keyof T]: T[K] extends undefined ? never : T[K];
  }[keyof T]
>;

type MapVariantMapLike<T extends VariantMap> =
  | MapVariantMap<T>
  | (Partial<MapVariantMap<T>> & { _: (data: VariantData<T>) => any });

type MapVariant<T extends VariantMap> = <M extends MapVariantMapLike<T>>(
  map: M
) => {
  [K in keyof M]: M[K] extends (...args: any) => any ? ReturnType<M[K]> : never;
}[keyof M];

type VariantMethods<T extends VariantMap> = {
  map: MapVariant<T>;
};

type VariantCreatorMap<T extends VariantMap> = {
  [K in keyof T]: [T[K]] extends [never]
    ? () => Expand<{ type: K } & VariantMethods<T>>
    : (
        data: T[K]
      ) => Expand<
        {
          type: K;
          data: T[K];
        } & VariantMethods<T>
      >;
};

export const createVariant = <T extends VariantMap>(): VariantCreatorMap<T> => {
  const map = (prop: keyof T, data: any): MapVariant<T> => (variantMap) => {
    const fn = variantMap[prop] ?? variantMap["_"];
    if (fn) {
      return fn(data);
    } else {
      throw new Error(
        "Property doesn't exist in variant, and no fallthrough was specified"
      );
    }
  };

  return new Proxy(
    {},
    {
      get: (_, prop: keyof T) => (data: any) => ({
        type: prop,
        data,
        map: map(prop, data),
      }),
    }
  ) as VariantCreatorMap<T>;
};

// helper
export type Member<T extends VariantCreatorMap<any>> = Expand<
  {
    [K in keyof T]: ReturnType<T[K]>;
  }[keyof T]
>;
