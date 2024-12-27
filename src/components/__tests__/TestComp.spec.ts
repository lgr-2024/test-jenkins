import { describe, it, expect } from "vitest";

import { mount } from "@vue/test-utils";
import TestComp from "../TestComp.vue";

describe("TestComp", () => {
  it("renders properly", () => {
    const wrapper = mount(TestComp);
    expect(wrapper.text()).toContain("TestComp");
  });
});
