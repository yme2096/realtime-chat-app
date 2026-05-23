import { create }
from "zustand";

const useThemeStore =
  create((set) => ({

    theme:
      localStorage.getItem(
        "theme"
      ) || "dark",

    setTheme:
      (theme) => {

        document.body.className =
          theme;

        localStorage.setItem(
          "theme",
          theme
        );

        set({
          theme,
        });

      },

  }));

export default
  useThemeStore;