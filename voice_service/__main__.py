"""Run with `python -m voice_service`; one worker, no filesystem reloader."""
import os


def main():
    threads = str(max(1, min(4, int(os.getenv("VOICE_CPU_THREADS", "1")))))
    for key in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS", "VECLIB_MAXIMUM_THREADS", "NUMEXPR_NUM_THREADS"):
        os.environ[key] = threads
    import uvicorn
    from .app import create_app
    app = create_app()
    server = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1",
        port=int(os.getenv("VOICE_SERVICE_PORT", "8001")), workers=1, log_level="info"))
    app.state.request_shutdown = lambda: setattr(server, "should_exit", True)
    server.run()


if __name__ == "__main__":
    main()
