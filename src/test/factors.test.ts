import { describe, expect, it } from "vitest";
import { factorsFor } from "@/data/factors";

describe("Fictional examination network", () => {
  it("anxiety links to the six requested factors", () => {
    expect(factorsFor("f-anxiete").map((f) => f.id)).toEqual(["famille", "relations", "ecole", "repos", "evenements", "protection"]);
  });
  it("a protective resource can be associated with several difficulties", () => {
    expect(factorsFor("f-anxiete").find((f) => f.id === "protection")?.id).toBe(factorsFor("f-conflits").find((f) => f.id === "protection")?.id);
    expect(factorsFor("f-conflits").map((f) => f.id)).toContain("relations");
  });
  it("keeps observed facts, reported speech, hypotheses and unknowns separate", () => {
    const family = factorsFor("f-anxiete").find((f) => f.id === "famille");
    expect(family?.facts).toHaveLength(1);
    expect(family?.reported).toHaveLength(1);
    expect(family?.hypotheses).toHaveLength(1);
    expect(family?.unknown).toHaveLength(2);
  });
});