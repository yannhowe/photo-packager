(function () {
  const url = window.SITE?.stripe?.tipJar || "";
  const nodes = document.querySelectorAll("[data-tip-jar]");
  nodes.forEach((node) => {
    if (!url) {
      node.hidden = true;
      return;
    }
    node.hidden = false;
    if (node.tagName === "A") node.setAttribute("href", url);
  });
  document.querySelectorAll("a[data-tip-jar-link]").forEach((link) => {
    if (url) link.setAttribute("href", url);
  });

  window.PhotoPackagerTip = {
    url,
    showToast() {
      const toast = document.getElementById("tipToast");
      if (!toast || !url) return;
      toast.hidden = false;
    },
    hideToast() {
      const toast = document.getElementById("tipToast");
      if (toast) toast.hidden = true;
    },
  };

  const dismiss = document.getElementById("dismissTipToast");
  if (dismiss) {
    dismiss.addEventListener("click", () => window.PhotoPackagerTip.hideToast());
  }
})();
