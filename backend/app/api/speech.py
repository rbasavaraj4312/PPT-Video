"""Forward voice work to an on-demand service, keeping existing browser URLs."""
import os
import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from starlette.background import BackgroundTask

from ..services.voice_process import voice_process, VoiceServiceUnavailable

router = APIRouter(prefix="/api/speech", tags=["narration"])
HOP_HEADERS = {"connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade", "host"}


@router.get("/service/status")
async def service_status():
    health = await voice_process.health()
    return {"running": health is not None, "busy": bool(health and health["busy"]),
            "idle_seconds": float(os.getenv("VOICE_SERVICE_IDLE_SECONDS", "60"))}


@router.post("/service/stop")
async def stop_service():
    health = await voice_process.health()
    if health and health["busy"]:
        raise HTTPException(409, "Wait for the current voice or video job to finish, or cancel it first.")
    if health and voice_process.process is None:
        raise HTTPException(409, "This voice service was started manually. Stop it in its terminal.")
    await voice_process.stop()
    return {"running": False}


@router.api_route("/{path:path}", methods=["GET", "POST", "DELETE"])
async def forward_voice(path: str, request: Request):
    try:
        await voice_process.ensure_running()
        headers = {key: value for key, value in request.headers.items() if key.lower() not in HOP_HEADERS}
        url = httpx.URL(voice_process.url + "/api/speech/" + path).copy_with(query=request.url.query.encode())
        upstream = voice_process.http().build_request(request.method, url, headers=headers, content=request.stream())
        response = await voice_process.http().send(upstream, stream=True)
    except (VoiceServiceUnavailable, httpx.HTTPError) as exc:
        raise HTTPException(503, f"Voice service unavailable: {exc}") from exc
    return StreamingResponse(response.aiter_raw(), status_code=response.status_code,
        headers={key: value for key, value in response.headers.items() if key.lower() not in HOP_HEADERS},
        background=BackgroundTask(response.aclose))
