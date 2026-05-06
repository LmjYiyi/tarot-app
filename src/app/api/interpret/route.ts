import {
  handleInterpretRoute,
  isNetlifyFunctionRuntime,
} from "@/lib/interpretation/api-route";
import { handleInterpretJobCreate } from "@/lib/interpretation/jobs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Netlify 同步函数有 60s 上限，MiniMax 解读可能跑到几分钟。
  // 在 Netlify 运行时改走 background-function + jobId 轮询，本地 dev 仍走原本的 stream。
  if (isNetlifyFunctionRuntime()) {
    return handleInterpretJobCreate(request);
  }

  return handleInterpretRoute(request);
}
