export function isLight() {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("light");
}

export function swalColors() {
  return isLight()
    ? { background: "#ffffff", color: "#18181b" }
    : { background: "#09090b", color: "#f4f4f5" };
}

export function tooltipColors() {
  return isLight()
    ? { backgroundColor: "#ffffff", borderColor: "#e2e2e7", color: "#18181b" }
    : { backgroundColor: "#09090b", borderColor: "#27272a", color: "#f4f4f5" };
}
