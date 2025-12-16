window.addEventListener("load", () => {
  const loader = document.getElementById("page-loader");
  loader.classList.add("hide");

  setTimeout(() => {
    loader.remove();
  }, 500);
}); 