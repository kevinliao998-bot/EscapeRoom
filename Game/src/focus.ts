type FocusKey = { attribute: "data-action" | "data-setting"; value: string };
export type FocusSnapshot = {
  view: string;
  panel: string;
  key: FocusKey | null;
};

function keyOf(element: Element | null): FocusKey | null {
  for (const attribute of ["data-action", "data-setting"] as const) {
    const value = element?.getAttribute(attribute);
    if (value) return { attribute, value };
  }
  return null;
}
function find(root: HTMLElement, key: FocusKey | null) {
  return key
    ? Array.from(root.querySelectorAll<HTMLElement>(`[${key.attribute}]`)).find(
        (element) =>
          element.getAttribute(key.attribute) === key.value &&
          !element.hasAttribute("disabled") &&
          !element.closest("[hidden],[inert]"),
      )
    : undefined;
}

// 保留語意位置而非舊 DOM 節點；介面重繪後重新尋找可用的控制項。
export class UiFocus {
  private returnTo: FocusKey | null = null;
  private opener: FocusKey | null = null;

  capture(root: HTMLElement): FocusSnapshot {
    const active = root.ownerDocument.activeElement;
    return {
      view: root.dataset.focusView || "",
      panel: root.querySelector(".panel")?.getAttribute("data-panel") || "",
      key: root.contains(active) ? keyOf(active) : null,
    };
  }

  // 自動走近／E 調查的觸發點可能與當下 DOM 焦點不同，以實際物件為準。
  openFrom(action: string) {
    this.opener = { attribute: "data-action", value: action };
  }

  restore(
    root: HTMLElement,
    before: FocusSnapshot,
    view: string,
    panel: string,
    fallbacks: string[],
  ) {
    root.dataset.focusView = view;
    const dialog = root.querySelector<HTMLElement>(".panel");
    if (panel && dialog) {
      if (!before.panel) this.returnTo = this.opener || before.key;
      this.opener = null;
      const target = before.panel === panel ? find(dialog, before.key) : null;
      (target || dialog).focus({ preventScroll: true });
      return;
    }
    const key = before.panel ? this.returnTo : before.key;
    const target = before.view === view ? find(root, key) : null;
    const fallback =
      fallbacks
        .map((value) => find(root, { attribute: "data-action", value }))
        .find(Boolean) ||
      root.querySelector<HTMLElement>("button:not([disabled])");
    (target || fallback)?.focus({ preventScroll: true });
    this.returnTo = null;
    this.opener = null;
  }
}
