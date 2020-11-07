import { createVariant } from "../src/index";

test("createVariant", () => {
  const User = createVariant<{
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

  const anon = User.anonymous({ generatedId: "123123" });

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
