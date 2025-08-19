import type { OpenAPI } from "apps/vtex/utils/openapi/vcs.openapi.gen.ts";
import type { LegacyProduct } from "apps/vtex/utils/types.ts";

export type ProductProperties = keyof LegacyProduct;

export type VCS = OpenAPI;