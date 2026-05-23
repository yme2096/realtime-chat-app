import api from "./api";

export const searchUsers =
  (query) => {

    return api.get(
      `/users/search?query=${query}`
    );

  };