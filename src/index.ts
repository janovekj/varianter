// bør nok heller bruke denne, siden brukeren ikke nødvendigvis ønsker å ekspandere sine egne typer
type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

// Helper type for making types more readable when hovering
type ExpandRecursively<T> = T extends object
  ? T extends infer O
    ? { [K in keyof O]: ExpandRecursively<O[K]> }
    : never
  : T;

export type DiscriminateMap<
  T extends {
    [key: string]: {};
  },
  TagName extends string = 'type'
> = {
  [K in keyof T]: Expand<
    {
      [tagName in TagName]: K;
    } &
      T[K]
  >;
}[keyof T];

type UnionToVariantMap<
  U extends { [key: string]: any },
  C extends keyof U
> = Expand<
  UnionToIntersection<
    U extends any ? { [K in U[C]]: Expand<Omit<U, C>> } : never
  >
>;

type KOK = UnionToVariantMap<S, 'type'>;

type S =
  | {
      type: 'test';
      lol: string;
    }
  | {
      type: 'asdasd';
      nu: number;
    };

type VariantMap = {
  [key: string]: any;
};

type Variant<T extends VariantMap> = Expand<
  {
    [K in keyof T]: Expand<{
      variant: K;
      data: T[K];
    }>;
  }[keyof T]
>;

type MapVariantMap<T extends VariantMap> = {
  [K in keyof T]: (data: T[K]) => any;
};

type MapVariant<T extends VariantMap> = <M extends MapVariantMap<T>>(
  map: M
) => VariantMember<
  {
    [K in keyof M]: ReturnType<M[K]>;
  }
>;

type MapVariantAs<T extends VariantMap> = <K extends keyof T, V>(
  variant: K,
  fn: (data: T[K]) => V
) => VariantMember<
  Expand<
    Override<
      T,
      {
        [key in K]: V;
      }
    >
  >
>;

type Override<T1, T2> = Omit<T1, keyof T2> & T2;

type GetVariantMap<T extends VariantMap> = {
  [K in keyof T]: (data: T[K]) => any;
};

type GetVariant<T extends VariantMap> = <M extends GetVariantMap<T>>(
  map: M
) => {
  [K in keyof M]: ReturnType<M[K]>;
}[keyof T];

type GetVariantAs<T extends VariantMap> = <K extends keyof T, V>(
  variant: K,
  fn: (data: T[K]) => V
) => V | undefined;

type VariantMember<T extends VariantMap> = {
  variant: Variant<T>;
  map: MapVariant<T>;
  mapAs: MapVariantAs<T>;
  get: GetVariant<T>;
  getAs: GetVariantAs<T>;
};

type VariantMethods<T extends VariantMap> = {
  map: (
    m: {
      [K in keyof T]?: (data: T[K]) => void;
    }
  ) => Member<VariantCreatorMap<T>>;
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

const createVariant = <T extends VariantMap>(): VariantCreatorMap<T> => {
  return new Proxy(
    {},
    {
      get: (target, prop) => (data: any) => ({
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

const LoginState = createVariant<{
  idle: {
    username: string;
    password: string;
  };
  submitting: {
    username: string;
    password: string;
  };
  succeeded: {
    username: string;
    password: string;
    user: {
      id: string;
    };
  };
  failed: {
    username: string;
    password: string;
    error: string;
  };
}>();

type LoginState = Member<typeof LoginState>;

const LoginAction = createVariant<{
  setName: string;
  setPassword: string;
  login: never;
  success: { id: string };
  fail: string;
}>();

type LoginAction = Member<typeof LoginAction>;

const asdb = LoginAction.login();

const loginMachine = (state: LoginState, action: LoginAction): LoginState => {
  const b = state.map({
    idle: d => {
      return LoginState.succeeded({
        ...d,
        user: {
          id: 'Asdas',
        },
      });
    },
  });

  return b;

  state.map({
    idle: data =>
      // fix mapPartial type. Make partial default? i.e. non-exhaustive?
      action.map({
        login: () => LoginState.submitting(data),
      }),
  });
};

const id = <V>(value: V) => value;

export type Distribute<U extends {}, C extends {}> = U extends any
  ? Expand<U & C>
  : never;

export type NonEmptyArray<T> = [T, ...T[]];

export const isNonEmptyArray = <T>(arr: T[]): arr is NonEmptyArray<T> => {
  return arr.length > 0;
};

// From https://stackoverflow.com/a/50375286
type UnionToIntersection<U> = (U extends any
? (k: U) => void
: never) extends (k: infer I) => void
  ? I
  : never;

// From: https://stackoverflow.com/a/53955431
type IsUnion<T> = [T] extends [UnionToIntersection<T>] ? false : true;

// Here we come!
export type SingleKey<T> = IsUnion<keyof T> extends true
  ? never
  : {} extends T
  ? never
  : T;

type A = SingleKey<{ [key: string]: string }> & {};

// type E = Distribute<
//   DiscriminateMap<
//     {
//       idle: Sta<{
//         start: string;
//       }>;
//     },
//     "id"
//   >,
//   { context: { name: string } }
// >;
