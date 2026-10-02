(function () {
  try {
    var theme = localStorage.getItem("portfolio-theme") || "system";
    if (theme === "system") {
      theme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    // Storage can be unavailable under strict browser privacy settings.
  }
})();
