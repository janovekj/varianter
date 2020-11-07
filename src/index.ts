type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

type UnionToVariantMap<
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

type GetVariantMap<T extends VariantMap> =
  | MapVariantMap<T>
  | (Partial<MapVariantMap<T>> & { _: (data: VariantData<T>) => any });

type GetVariant<T extends VariantMap> = <M extends GetVariantMap<T>>(
  map: M
) => {
  [K in keyof M]: M[K] extends (...args: any) => any ? ReturnType<M[K]> : never;
}[keyof M];

type VariantMethods<T extends VariantMap> = {
  map: GetVariant<T>;
};

type VariantCreatorMap<T extends VariantMap> = {
  [K in keyof T]: [T[K]] extends [never]
    ? () => Expand<{ variant: K } & VariantMethods<T>>
    : (
        data: T[K]
      ) => Expand<
        {
          variant: K;
          data: T[K];
        } & VariantMethods<T>
      >;
};

export const createVariant = <T extends VariantMap>(): VariantCreatorMap<T> => {
  return new Proxy(
    {},
    {
      get: (_, prop) => (data: any) => ({
        variant: prop,
        data,
      }),
    }
  ) as VariantCreatorMap<T>;
};

type Member<T extends VariantCreatorMap<any>> = Expand<
  {
    [K in keyof T]: ReturnType<T[K]>;
  }[keyof T]
>;
