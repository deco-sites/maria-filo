import { defineConfig } from "$fresh/server.ts";
import { plugins } from "deco/plugins/deco.ts";
import manifest from "./manifest.gen.ts";
import { mcpServer } from "@deco/mcp";

export default defineConfig({
  plugins: plugins({
    manifest,
    htmx: true,
    useServer: (deco, hono) => {
      hono.use("/*", mcpServer(deco, {
        include: [
          "site/loaders/product/productListByFacets.ts",
          "site/loaders/product/productListBySkuIds.ts",
          "site/loaders/product/productListByTerm.ts",
          "site/loaders/product/productListByProductIds.ts",
          "site/loaders/product/productListByCollection.ts",
          "site/loaders/product/productBySlug.ts",
          "site/loaders/product/relatedProducts.ts",
          "site/loaders/categories/tree.ts",
        ],
      }));
    },
  }),
});
