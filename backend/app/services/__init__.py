"""Load presentation services only when explicitly requested."""


def __getattr__(name):
    from importlib import import_module
    if name in {"storage_service", "StorageService"}:
        storage = import_module(".storage", __name__)
        return getattr(storage, name)
    if name in {"pptx_exporter", "PPTXExporter"}:
        exporter = import_module(".pptx_exporter", __name__)
        return getattr(exporter, name)
    raise AttributeError(name)

__all__ = [
    "storage_service",
    "StorageService",
    "pptx_exporter",
    "PPTXExporter",
]

