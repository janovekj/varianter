import { createVariant, Member } from "../src/index";

test("createVariant", () => {
  const user = createVariant<{
    anonymous: {
      generatedId: string;
    };
    regular: {
      id: string;
      name: string;
    };
    admin: {
      id: string;
      name: string;
      permissions: string[];
    };
  }>();

  const anon = user.anonymous({ generatedId: "123123" });

  const result = anon.map({
    anonymous: () => "correct",
    admin: () => "wrong",
    regular: () => "wrong",
  });

  expect(result).toBe("correct");

  const result2 = anon.map({
    admin: () => "wrong",
    _: () => "correct",
  });

  expect(result2).toBe("correct");
});

test("state machine reducer example", () => {
  type User = {
    id: string;
  };

  type UserCredentials = {
    username: string;
    password: string;
  };

  const fetchUserState = createVariant<{
    idle: never;
    fetching: {
      credentials: UserCredentials;
    };
    successful: {
      user: User;
    };
    failed: {
      error: string;
    };
  }>();

  type FetchUserState = Member<typeof fetchUserState>;

  const fetchUserAction = createVariant<{
    fetch: { username: string; password: string };
    success: User;
    fail: string;
  }>();

  type FetchUserAction = Member<typeof fetchUserAction>;

  const fetchUserReducer = (
    state: FetchUserState,
    action: FetchUserAction
  ): FetchUserState =>
    state.map({
      idle: () =>
        action.map({
          fetch: credentials => fetchUserState.fetching({ credentials }),
          _: () => state,
        }),
      fetching: () =>
        action.map({
          success: user => fetchUserState.successful({ user }),
          fail: error => fetchUserState.failed({ error }),
          _: () => state,
        }),
      _: () => state,
    });

  const initialState = fetchUserState.idle();

  expect(
    fetchUserReducer(initialState, fetchUserAction.fail("error")).variant
  ).toBe("idle");

  const fetchingState = fetchUserReducer(
    initialState,
    fetchUserAction.fetch({
      username: "testusername",
      password: "testpassword",
    })
  );
  expect(fetchingState.variant).toBe("fetching");
  //@ts-ignore
  expect(fetchingState.data).toStrictEqual({
    credentials: { username: "testusername", password: "testpassword" },
  });

  const successState = fetchUserReducer(
    fetchingState,
    fetchUserAction.success({ id: "test" })
  );
  expect(successState.variant).toBe("successful");
  // @ts-ignore
  expect(successState.data).toStrictEqual({ user: { id: "test" } });

  const failedState = fetchUserReducer(
    fetchingState,
    fetchUserAction.fail("error")
  );
  expect(failedState.variant).toBe("failed");
  // @ts-ignore
  expect(failedState.data).toStrictEqual({ error: "error" });
});
