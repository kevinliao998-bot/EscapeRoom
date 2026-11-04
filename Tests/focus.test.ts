import { test } from "node:test";
import assert from "node:assert/strict";
import { UiFocus } from "../Game/src/focus.ts";

// 只替代焦點模組使用的 DOM 介面；真正 Tab 順序另以正式版瀏覽器驗證。
function page(view = "play:office") {
  const document = { activeElement: null as Control | null };
  class Control {
    attrs: Record<string, string>;
    disabled = false;
    hidden = false;
    children: Control[] = [];
    options: FocusOptions | undefined;
    constructor(action = "", setting = "") {
      this.attrs = action
        ? { "data-action": action }
        : setting
          ? { "data-setting": setting }
          : {};
    }
    getAttribute(name: string) {
      return this.attrs[name] ?? null;
    }
    hasAttribute(name: string) {
      return name === "disabled" && this.disabled;
    }
    closest() {
      return this.hidden ? this : null;
    }
    focus(options?: FocusOptions) {
      document.activeElement = this;
      this.options = options;
    }
    querySelectorAll(selector: string) {
      return this.children.filter(
        (c) => c.getAttribute(selector.slice(1, -1)) !== null,
      );
    }
  }
  const root = {
    dataset: { focusView: view },
    ownerDocument: document,
    children: [] as Control[],
    dialog: null as Control | null,
    contains(element: Control | null) {
      return (
        !!element &&
        (this.children.includes(element) ||
          this.dialog === element ||
          !!this.dialog?.children.includes(element))
      );
    },
    querySelector(selector: string) {
      return selector === ".panel"
        ? this.dialog
        : this.children.find((c) => !c.disabled && !c.hidden) || null;
    },
    querySelectorAll(selector: string) {
      return this.children.filter(
        (c) => c.getAttribute(selector.slice(1, -1)) !== null,
      );
    },
  };
  function rebuild(actions: string[], panel = "", panelActions = ["close"]) {
    // innerHTML 換掉節點後，舊的 document.activeElement 不再存在。
    document.activeElement = null;
    root.children = actions.map((action) => new Control(action));
    root.dialog = panel ? new Control() : null;
    if (root.dialog) {
      root.dialog.attrs["data-panel"] = panel;
      root.dialog.children = panelActions.map((action) => new Control(action));
      root.children.push(root.dialog, ...root.dialog.children);
    }
  }
  return {
    root: root as unknown as HTMLElement,
    dom: root,
    document,
    Control,
    rebuild,
  };
}

test("關閉調查回到重繪後的新觸發按鈕，不保留已移除的 DOM 節點", () => {
  for (const origin of ["spot:cardSlot", "spot:cart", "spot:cabinet"]) {
    const p = page(),
      focus = new UiFocus();
    p.rebuild([origin, "settings"]);
    const oldTrigger = p.dom.children[0];
    oldTrigger.focus();
    const before = focus.capture(p.root);
    focus.openFrom(origin);
    p.rebuild([origin, "settings"], "cabinet");
    focus.restore(p.root, before, "play:office", "cabinet", ["settings"]);
    assert.equal(p.document.activeElement, p.dom.dialog);
    const closing = focus.capture(p.root);
    p.rebuild([origin, "settings"]);
    focus.restore(p.root, closing, "play:office", "", ["settings"]);
    assert.notEqual(p.document.activeElement, oldTrigger);
    assert.equal(p.document.activeElement?.getAttribute("data-action"), origin);
    assert.equal(p.document.activeElement?.options?.preventScroll, true);
  }
});

test("走近及 E 調查以實際物件為返回點，面板重繪不會覆寫來源", () => {
  const p = page(),
    focus = new UiFocus();
  p.rebuild(["journal", "spot:cabinet", "settings"]);
  p.dom.children[0].focus();
  const before = focus.capture(p.root);
  focus.openFrom("spot:cabinet");
  p.rebuild(["journal", "spot:cabinet", "settings"], "cabinet", [
    "close",
    "impression",
  ]);
  focus.restore(p.root, before, "play:office", "cabinet", ["settings"]);
  p.dom.dialog!.children[1].focus();
  const update = focus.capture(p.root);
  p.rebuild(["journal", "spot:cabinet", "settings"], "cabinet", [
    "close",
    "impression",
  ]);
  focus.restore(p.root, update, "play:office", "cabinet", ["settings"]);
  assert.equal(
    p.document.activeElement?.getAttribute("data-action"),
    "impression",
  );
  const closing = focus.capture(p.root);
  p.rebuild(["journal", "spot:cabinet", "settings"]);
  focus.restore(p.root, closing, "play:office", "", ["settings"]);
  assert.equal(
    p.document.activeElement?.getAttribute("data-action"),
    "spot:cabinet",
  );
});

test("切場或來源已移除、隱藏、禁用時，退回有名稱的可操作位置", () => {
  for (const reason of ["scene", "removed", "hidden", "disabled"]) {
    const p = page(),
      focus = new UiFocus();
    p.rebuild(["spot:cabinet", "settings"]);
    p.dom.children[0].focus();
    const before = focus.capture(p.root);
    p.rebuild(["spot:cabinet", "settings"], "cabinet");
    focus.restore(p.root, before, "play:office", "cabinet", ["settings"]);
    const closing = focus.capture(p.root);
    p.rebuild(
      reason === "removed"
        ? ["spot:back", "settings"]
        : ["spot:cabinet", "spot:back", "settings"],
    );
    if (reason === "hidden") p.dom.children[0].hidden = true;
    if (reason === "disabled") p.dom.children[0].disabled = true;
    focus.restore(
      p.root,
      closing,
      reason === "scene" ? "play:platform" : "play:office",
      "",
      ["spot:back", "settings"],
    );
    assert.equal(
      p.document.activeElement?.getAttribute("data-action"),
      "spot:back",
    );
  }
});

test("面板按鈕消失時焦點留在面板；一般按鈕及設定欄位重繪仍保留位置", () => {
  const p = page(),
    focus = new UiFocus();
  p.rebuild(["settings"], "hint", ["close", "hintNext"]);
  p.dom.dialog!.children[1].focus();
  const before = focus.capture(p.root);
  p.rebuild(["settings"], "hint", ["close"]);
  focus.restore(p.root, before, "play:office", "hint", ["settings"]);
  assert.equal(p.document.activeElement, p.dom.dialog);
  p.rebuild(["item:card", "settings"]);
  p.dom.children[0].focus();
  const inventory = focus.capture(p.root);
  p.rebuild(["item:card", "settings"]);
  focus.restore(p.root, inventory, "play:office", "", ["settings"]);
  assert.equal(
    p.document.activeElement?.getAttribute("data-action"),
    "item:card",
  );
  p.rebuild(["settings"], "settings");
  const slider = new p.Control("", "master");
  p.dom.dialog!.children.push(slider);
  slider.focus();
  const settings = focus.capture(p.root);
  p.rebuild(["settings"], "settings");
  p.dom.dialog!.children.push(new p.Control("", "master"));
  focus.restore(p.root, settings, "play:office", "settings", ["settings"]);
  assert.equal(
    p.document.activeElement?.getAttribute("data-setting"),
    "master",
  );
});

test("主選單設定返回原按鈕；沒有觸發控制項時仍提供可操作的退回位置", () => {
  for (const hasTrigger of [true, false]) {
    const p = page("menu:office"),
      focus = new UiFocus();
    p.rebuild(["continue", "settings"]);
    if (hasTrigger) p.dom.children[1].focus();
    const before = focus.capture(p.root);
    p.rebuild(["continue", "settings"], "settings");
    focus.restore(p.root, before, "menu:office", "settings", ["continue"]);
    const closing = focus.capture(p.root);
    p.rebuild(["continue", "settings"]);
    focus.restore(p.root, closing, "menu:office", "", ["continue"]);
    assert.equal(
      p.document.activeElement?.getAttribute("data-action"),
      hasTrigger ? "settings" : "continue",
    );
  }
});
