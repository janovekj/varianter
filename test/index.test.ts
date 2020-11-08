import { createVariant, from, Member } from "../src/index";
import { suite } from "uvu";
import * as assert from "uvu/assert";

const createVariantSuite = suite("createVariant");

createVariantSuite("default", () => {
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

  assert.is(result, "correct");

  const result2 = anon.map({
    admin: () => "wrong",
    _: () => "correct",
  });

  assert.is(result2, "correct");
});

createVariantSuite("state machine reducer example", () => {
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
          fetch: (credentials) => fetchUserState.fetching({ credentials }),
          _: () => state,
        }),
      fetching: () =>
        action.map({
          success: (user) => fetchUserState.successful({ user }),
          fail: (error) => fetchUserState.failed({ error }),
          _: () => state,
        }),
      _: () => state,
    });

  const initialState = fetchUserState.idle();

  assert.is(
    fetchUserReducer(initialState, fetchUserAction.fail("error")).type,
    "idle"
  );

  const fetchingState = fetchUserReducer(
    initialState,
    fetchUserAction.fetch({
      username: "testusername",
      password: "testpassword",
    })
  );

  fetchingState.map({
    fetching: (data) =>
      assert.equal(
        data.credentials,
        {
          username: "testusername",
          password: "testpassword",
        },
        "credentials are defined on the fetching variant"
      ),
    _: () => assert.unreachable("is in the fetching state"),
  });

  const successState = fetchUserReducer(
    fetchingState,
    fetchUserAction.success({ id: "test" })
  );

  successState.map({
    successful: (data) =>
      assert.equal(
        data.user,
        { id: "test" },
        "user object is defined on the success variant"
      ),
    _: () => assert.unreachable("is in the success state"),
  });

  const failedState = fetchUserReducer(
    fetchingState,
    fetchUserAction.fail("error")
  );

  failedState.map({
    failed: (data) =>
      assert.is(data.error, "error", "error is defined on the failed variant"),
    _: () => assert.unreachable("is in the failed state"),
  });
});

createVariantSuite.run();

const fromSuite = suite("from");

fromSuite("from", () => {
  type User = {
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
  };

  const user = from<User>({
    type: "admin",
    data: {
      id: "testid",
      name: "testname",
      permissions: ["testpermission"],
    },
  });

  user.map({
    admin: (data) =>
      assert.equal(data, {
        id: "testid",
        name: "testname",
        permissions: ["testpermission"],
      }),
    _: () => assert.unreachable(),
  });

  const somethingElse = from({
    type: "somethingElse" as const,
    data: {
      testProperty: "testValue",
    },
  });

  somethingElse.map({
    _: (data) =>
      assert.equal(
        data,
        {
          testProperty: "testValue",
        },
        "'invalid' properties are also handled"
      ),
  });
});

fromSuite.run();
