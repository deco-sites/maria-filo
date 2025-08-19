import { type ClientOf, createHttpClient } from "apps/utils/http.ts";
import { removeDirtyCookies } from "apps/utils/normalize.ts";
import { fetchSafe } from "apps/vtex/utils/fetchVTEX.ts";
import type { VTEXCommerceStable } from "apps/vtex/utils/client.ts";

export default function getClient(): ClientOf<VTEXCommerceStable> {

  const client = createHttpClient<VTEXCommerceStable>({
    base: `https://mariafilo.vtexcommercestable.com.br`,
    fetcher: fetchSafe,
    processHeaders: removeDirtyCookies,
  });

  return client;
}
