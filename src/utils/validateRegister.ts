import { UserInput } from "../resolvers/user";

export const validateRegister = (options: UserInput) => {
  if (options.username?.length < 5) {
    return {
      errors: [
        {
          field: "username",
          message: "username is too short",
        },
      ],
    };
  }

  if (!options.email?.includes("@")) {
    return {
      errors: [
        {
          field: "username",
          message: "cannot includes an @ sign",
        },
      ],
    };
  }

  if (options.username?.includes("@")) {
    return {
      errors: [
        {
          field: "email",
          message: "email is not correct",
        },
      ],
    };
  }

  if (options.password?.length < 5) {
    return {
      errors: [
        {
          field: "password",
          message: "password is too short",
        },
      ],
    };
  }
  return null;
};
