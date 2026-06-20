import { proxyTiersRequest } from "@/lib/server/kernelTiersProxy";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

const handler = async (request: Request, context: RouteContext) => {
  const { path } = await context.params;
  return proxyTiersRequest(request, path);
};

export const dynamic = "force-dynamic";

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
