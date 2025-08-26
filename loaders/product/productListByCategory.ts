import { STALE } from "apps/utils/fetch.ts";
import type { LegacyProduct, PageType, Sort } from "apps/vtex/utils/types.ts";
import { ProductProperties } from "site/sdk/vcs.ts";
import getClient from "site/utils/getClient.ts";
import { AppContext } from "../../apps/site.ts";
import {
  pageTypesFromUrl,
  toPath,
  withDefaultFacets,
} from "apps/vtex/utils/intelligentSearch.ts";
import { getValidTypesFromPageTypes } from "apps/vtex/utils/legacy.ts";
import { slugify } from "apps/vtex/utils/slugify.ts";

export interface Props {
  /**
   * @description category to use on search
   */
  category: string;
  /**
   * @description search sort parameter
   */
  sort?: Sort;
  /**
   * @description total number of items to display
   */
  count: number;
  /**
   * @title Select specific properties to return
   * @name select_properties
   * @description Select specific properties to return. Values: - all (returns all properties) - allSpecifications - allSpecificationsGroups - brand - brandId - brandImageUrl - cacheId - categories - categoriesIds - categoryId - clusterHighlights - description - items - link - linkText - metaTagDescription - origin - priceRange - productClusters - productId - productName - productReference - productTitle - properties - releaseDate - selectedProperties - skuSpecifications - specificationGroups
   */
  select: (
    | "all"
    | "allSpecifications"
    | "allSpecificationsGroups"
    | "brand"
    | "brandId"
    | "brandImageUrl"
    | "cacheId"
    | "categories"
    | "categoriesIds"
    | "categoryId"
    | "clusterHighlights"
    | "description"
    | "items"
    | "link"
    | "linkText"
    | "metaTagDescription"
    | "origin"
    | "priceRange"
    | "productClusters"
    | "productId"
    | "productName"
    | "productReference"
    | "productTitle"
    | "properties"
    | "releaseDate"
    | "selectedProperties"
    | "skuSpecifications"
    | "specificationGroups"
  )[];
}

const PAGE_TYPE_TO_MAP_PARAM = {
  Brand: "brand",
  Collection: "productClusterIds",
  Cluster: "productClusterIds",
  Search: null,
  Product: null,
  NotFound: null,
  FullText: null,
};

const pageTypeToMapParam = (type: PageType["pageType"], index: number) => {
  if (type === "Category" || type === "Department" || type === "SubCategory") {
    return `category-${index + 1}`;
  }
  return PAGE_TYPE_TO_MAP_PARAM[type];
};
const filtersFromPathname = (pages: PageType[]) =>
  pages
    .map((page, index) => {
      const key = pageTypeToMapParam(page.pageType, index);
      if (!key || !page.name) {
        return;
      }
      return (key &&
        page.name && {
        key,
        value: slugify(page.name),
      });
    })
    .filter((facet): facet is {
      key: string;
      value: string;
    } => Boolean(facet));

/**
 * @name product_list_by_category
 * @description Get a list of products by category
 */
const loader = async (
  props: Props,
  _req: Request,
  ctx: AppContext,
) => {
  const vcsDeprecated = getClient();
  // @ts-ignore Somehow deno task check breaks, I have no idea why
  const allPageTypes = await pageTypesFromUrl(props.category, {
    ...ctx,
    vcsDeprecated,
  });
  const pageTypes = getValidTypesFromPageTypes(allPageTypes);
  const selectedFacets = filtersFromPathname(pageTypes);
  // @ts-ignore Somehow deno task check breaks, I have no idea why
  const selected = withDefaultFacets(selectedFacets, { ...ctx, vcsDeprecated });
  const params = {
    page: 1,
    count: props.count,
    query: "",
    sort: props.sort,
    fuzzy: "auto",
    locale: "pt-BR",
    hideUnavailableItems: true,
    simulationBehavior: "default",
  };
  const facets = toPath(selected);

  const { products: vtexProducts } = await vcsDeprecated
    ["GET /api/io/_v/api/intelligent-search/product_search/*facets"]({
      ...params,
      facets,
    }, { ...STALE })
    .then((res) => res.json());

  if (vtexProducts && !Array.isArray(vtexProducts)) {
    throw new Error(
      `Error while fetching VTEX data ${JSON.stringify(vtexProducts)}`,
    );
  }

  const partialProducts = props.select?.length && !props.select.includes("all")
    ? vtexProducts.map((product) =>
      props.select!.reduce((acc, prop) => {
        // @ts-ignore ignore
        acc[prop] = product[prop];
        // the return was too long, so we limit the items to 3
        if (prop === "items") {
          acc[prop] = acc[prop].slice(0, 3);
        }
        return acc;
        // deno-lint-ignore no-explicit-any
      }, {} as Record<ProductProperties, any>)
    )
    : vtexProducts;

  return {
    products: partialProducts as LegacyProduct[],
  };
};

export default loader;
