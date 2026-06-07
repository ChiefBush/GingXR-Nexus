import {
  createCategorySchema,
  updateCategorySchema,
  createArticleSchema,
  updateArticleSchema,
  articleListQuerySchema,
  restoreVersionSchema,
  slugSchema,
} from "@/lib/validations/knowledge-base";
import { _internal as renderer } from "@/components/kb/article-renderer";

describe("knowledge-base validations", () => {
  describe("slugSchema", () => {
    it("accepts a valid kebab-case slug", () => {
      expect(slugSchema.parse("onboarding-checklist")).toBe(
        "onboarding-checklist",
      );
    });

    it("rejects uppercase letters", () => {
      expect(() => slugSchema.parse("Onboarding")).toThrow();
    });

    it("rejects spaces and underscores", () => {
      expect(() => slugSchema.parse("foo bar")).toThrow();
      expect(() => slugSchema.parse("foo_bar")).toThrow();
    });
  });

  describe("createCategorySchema", () => {
    it("accepts a minimal category", () => {
      const r = createCategorySchema.parse({ name: "Engineering" });
      expect(r.name).toBe("Engineering");
    });

    it("rejects empty name", () => {
      expect(() => createCategorySchema.parse({ name: "" })).toThrow();
    });
  });

  describe("updateCategorySchema", () => {
    it("requires id and allows partial fields", () => {
      const r = updateCategorySchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "New",
      });
      expect(r.name).toBe("New");
    });
  });

  describe("createArticleSchema", () => {
    it("accepts a valid article with required fields", () => {
      const r = createArticleSchema.parse({
        title: "Onboarding",
        content: "Step 1...",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(r.title).toBe("Onboarding");
      expect(r.status).toBe("DRAFT");
      expect(r.tags).toEqual([]);
    });

    it("defaults status to DRAFT and tags to []", () => {
      const r = createArticleSchema.parse({
        title: "X",
        content: "Y",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(r.status).toBe("DRAFT");
      expect(r.tags).toEqual([]);
    });

    it("rejects empty title", () => {
      expect(() =>
        createArticleSchema.parse({
          title: "",
          content: "X",
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      ).toThrow();
    });

    it("rejects more than 20 tags", () => {
      expect(() =>
        createArticleSchema.parse({
          title: "X",
          content: "Y",
          categoryId: "550e8400-e29b-41d4-a716-446655440000",
          tags: Array.from({ length: 21 }, (_, i) => `t${i}`),
        }),
      ).toThrow();
    });

    it("accepts an explicit slug", () => {
      const r = createArticleSchema.parse({
        title: "X",
        content: "Y",
        categoryId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "my-custom-slug",
      });
      expect(r.slug).toBe("my-custom-slug");
    });
  });

  describe("updateArticleSchema", () => {
    it("requires id and allows partial fields", () => {
      const r = updateArticleSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Updated",
      });
      expect(r.title).toBe("Updated");
    });
  });

  describe("restoreVersionSchema", () => {
    it("requires articleId and a positive version", () => {
      const r = restoreVersionSchema.parse({
        articleId: "550e8400-e29b-41d4-a716-446655440000",
        version: 3,
      });
      expect(r.version).toBe(3);
    });

    it("rejects non-integer version", () => {
      expect(() =>
        restoreVersionSchema.parse({
          articleId: "550e8400-e29b-41d4-a716-446655440000",
          version: 1.5,
        }),
      ).toThrow();
    });
  });

  describe("articleListQuerySchema", () => {
    it("applies defaults", () => {
      const r = articleListQuerySchema.parse({});
      expect(r.page).toBe(1);
      expect(r.limit).toBe(20);
    });

    it("rejects limit above 50", () => {
      expect(() => articleListQuerySchema.parse({ limit: 100 })).toThrow();
    });
  });
});

describe("article renderer", () => {
  it("parses a heading", () => {
    const blocks = renderer.parse("# Hello");
    expect(blocks).toEqual([{ type: "h1", text: "Hello" }]);
  });

  it("parses paragraphs and lists", () => {
    const blocks = renderer.parse("Some text.\n\n- one\n- two");
    expect(blocks[0]).toEqual({ type: "p", text: "Some text." });
    expect(blocks[1]).toEqual({ type: "ul", items: ["one", "two"] });
  });

  it("parses fenced code blocks", () => {
    const blocks = renderer.parse("```ts\nconst x = 1;\n```");
    expect(blocks).toEqual([
      { type: "code", lang: "ts", text: "const x = 1;" },
    ]);
  });

  it("parses ordered lists", () => {
    const blocks = renderer.parse("1. one\n2. two");
    expect(blocks[0]).toEqual({ type: "ol", items: ["one", "two"] });
  });

  it("parses horizontal rules and blockquotes", () => {
    const blocks = renderer.parse("---\n> quoted");
    expect(blocks[0]).toEqual({ type: "hr" });
    expect(blocks[1]).toEqual({ type: "quote", text: "quoted" });
  });
});
