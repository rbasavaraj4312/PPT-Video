import io
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Response
from fastapi.responses import StreamingResponse

from pydantic import BaseModel
from ..models.presentation import (
    PresentationModel,
    PresentationSummary,
    FolderModel,
    TemplateModel,
    TemplateSummary,
    MotionTemplateModel,
)
from ..services.storage import storage_service
from ..services.pptx_exporter import pptx_exporter
from ..services.video_exporter import video_exporter
from ..services.slide_compiler import slide_compiler, THEMES
from ..services.narration_draft import DraftTextRequest, DraftBuildRequest, parse_narration, build_draft

router = APIRouter(prefix="/api", tags=["presentations"])


# ================= Template Endpoints =================
@router.get("/templates", response_model=List[TemplateModel])
def list_templates(category: Optional[str] = None, aspect_ratio: Optional[str] = None):
    """List all pre-defined and custom templates, with optional category and aspect_ratio filter."""
    return storage_service.list_templates(category=category, aspect_ratio=aspect_ratio)


@router.get("/templates/{template_id}", response_model=TemplateModel)
def get_template(template_id: str):
    """Get a specific template by ID."""
    tpl = storage_service.get_template(template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return tpl


@router.post("/templates", response_model=TemplateModel)
def save_template(template: TemplateModel):
    """Save or update a template."""
    return storage_service.save_template(template)


@router.put("/templates/{template_id}", response_model=TemplateModel)
def update_template(template_id: str, template: TemplateModel):
    """Update an existing template by ID."""
    template.id = template_id
    return storage_service.save_template(template)


@router.delete("/templates/{template_id}")
def delete_template(template_id: str):
    """Delete a template (custom or built-in)."""
    success = storage_service.delete_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Template '{template_id}' not found")
    return {"status": "deleted", "id": template_id}


# ================= Motion Template Endpoints =================
@router.get("/motion-templates", response_model=List[MotionTemplateModel])
def list_motion_templates(category: Optional[str] = None):
    """List all built-in and custom motion templates."""
    return storage_service.list_motion_templates(category=category)


@router.get("/motion-templates/{template_id}", response_model=MotionTemplateModel)
def get_motion_template(template_id: str):
    """Get a specific motion template by ID."""
    tpl = storage_service.get_motion_template(template_id)
    if not tpl:
        raise HTTPException(status_code=404, detail=f"Motion template '{template_id}' not found")
    return tpl


@router.post("/motion-templates", response_model=MotionTemplateModel)
def save_motion_template(template: MotionTemplateModel):
    """Save or create a motion template."""
    return storage_service.save_motion_template(template)


@router.put("/motion-templates/{template_id}", response_model=MotionTemplateModel)
def update_motion_template(template_id: str, template: MotionTemplateModel):
    """Update an existing motion template by ID."""
    template.id = template_id
    return storage_service.save_motion_template(template)


@router.delete("/motion-templates/{template_id}")
def delete_motion_template(template_id: str):
    """Delete a motion template (custom or built-in)."""
    success = storage_service.delete_motion_template(template_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Motion template '{template_id}' not found")
    return {"status": "deleted", "id": template_id}


# ================= Folder Endpoints =================
@router.get("/folders", response_model=List[FolderModel])
def list_folders():
    """List all user folders."""
    return storage_service.list_folders()


@router.post("/folders", response_model=FolderModel)
def create_folder(folder: FolderModel):
    """Create a new presentation folder."""
    return storage_service.create_folder(folder)


class UpdateFolderPayload(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    parent_id: Optional[str] = None


@router.put("/folders/{folder_id}", response_model=FolderModel)
def update_folder(folder_id: str, payload: UpdateFolderPayload):
    """Update a folder name, color, or parent folder."""
    updated = storage_service.update_folder(
        folder_id,
        name=payload.name,
        color=payload.color,
        parent_id=payload.parent_id,
        update_parent=(payload.parent_id is not None or "parent_id" in payload.model_fields_set),
    )
    if not updated:
        raise HTTPException(status_code=404, detail=f"Folder '{folder_id}' not found")
    return updated


class MoveFolderHierarchyPayload(BaseModel):
    parent_id: Optional[str] = None


@router.put("/folders/{folder_id}/move")
def move_folder(folder_id: str, payload: MoveFolderHierarchyPayload):
    """Move a folder into another parent folder (or to root level)."""
    success = storage_service.move_folder(folder_id, payload.parent_id)
    if not success:
        raise HTTPException(status_code=400, detail="Cannot move folder into itself, its descendants, or invalid parent")
    return {"status": "moved", "folder_id": folder_id, "parent_id": payload.parent_id}


@router.delete("/folders/{folder_id}")
def delete_folder(folder_id: str):
    """Delete a folder, its subfolders, and unassign presentations."""
    success = storage_service.delete_folder(folder_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Folder '{folder_id}' not found")
    return {"status": "deleted", "id": folder_id}


class MoveFolderPayload(BaseModel):
    folder_id: Optional[str] = None


@router.put("/presentations/{presentation_id}/folder")
def move_presentation_to_folder(presentation_id: str, payload: MoveFolderPayload):
    """Assign or unassign a presentation to a folder."""
    success = storage_service.move_presentation_to_folder(presentation_id, payload.folder_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Presentation '{presentation_id}' not found")
    return {"status": "updated", "id": presentation_id, "folder_id": payload.folder_id}


# ================= Presentation Endpoints =================
@router.get("/presentations", response_model=List[PresentationSummary])
def list_presentations():
    """Returns a list of all presentations saved in the storage directory."""
    return storage_service.list_presentations()


@router.get("/presentations/{presentation_id}", response_model=PresentationModel)
def get_presentation(presentation_id: str):
    """Loads a full presentation JSON by ID."""
    pres = storage_service.get_presentation(presentation_id)
    if not pres:
        raise HTTPException(
            status_code=404, detail=f"Presentation '{presentation_id}' not found"
        )
    return pres


@router.post("/presentations", response_model=PresentationModel)
def save_presentation(presentation: PresentationModel):
    """Saves or updates a presentation JSON directly to the filesystem."""
    try:
        saved = storage_service.save_presentation(presentation)
        return saved
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save presentation: {e}")


@router.delete("/presentations/{presentation_id}")
def delete_presentation(presentation_id: str):
    """Deletes a presentation JSON from storage."""
    success = storage_service.delete_presentation(presentation_id)
    if not success:
        raise HTTPException(
            status_code=404, detail=f"Presentation '{presentation_id}' not found"
        )
    return {"status": "deleted", "id": presentation_id}


@router.post("/presentations/{presentation_id}/export")
def export_saved_presentation(presentation_id: str):
    """Exports an existing presentation from storage into a downloadable .pptx file."""
    pres = storage_service.get_presentation(presentation_id)
    if not pres:
        raise HTTPException(
            status_code=404, detail=f"Presentation '{presentation_id}' not found"
        )

    try:
        buffer = pptx_exporter.export(pres)
        safe_filename = "".join(
            c for c in pres.title if c.isalnum() or c in (" ", "-", "_")
        ).strip().replace(" ", "_") or "presentation"

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}.pptx"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export presentation: {e}")


@router.post("/export-direct")
def export_direct_presentation(presentation: PresentationModel):
    """Exports directly from the provided presentation JSON payload into a .pptx file."""
    try:
        buffer = pptx_exporter.export(presentation)
        safe_filename = "".join(
            c for c in presentation.title if c.isalnum() or c in (" ", "-", "_")
        ).strip().replace(" ", "_") or "presentation"

        return StreamingResponse(
            buffer,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}.pptx"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export presentation: {e}")


@router.post("/presentations/{presentation_id}/export-video")
def export_saved_video(
    presentation_id: str,
    resolution: str = "1080p",
    fps: int = 30,
    slide_duration: Optional[float] = None,
):
    """Exports an existing presentation from storage into an MP4 video with morph transitions."""
    pres = storage_service.get_presentation(presentation_id)
    if not pres:
        raise HTTPException(
            status_code=404, detail=f"Presentation '{presentation_id}' not found"
        )

    try:
        buffer = video_exporter.export(
            pres, resolution=resolution, fps=fps, slide_duration=slide_duration
        )
        safe_filename = "".join(
            c for c in pres.title if c.isalnum() or c in (" ", "-", "_")
        ).strip().replace(" ", "_") or "presentation"

        return StreamingResponse(
            buffer,
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}.mp4"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export video: {e}")


@router.post("/export-video-direct")
def export_direct_video(
    presentation: PresentationModel,
    resolution: str = "1080p",
    fps: int = 30,
    slide_duration: Optional[float] = None,
):
    """Exports directly from the provided presentation JSON payload into an MP4 video with morph transitions."""
    try:
        buffer = video_exporter.export(
            presentation, resolution=resolution, fps=fps, slide_duration=slide_duration
        )
        safe_filename = "".join(
            c for c in presentation.title if c.isalnum() or c in (" ", "-", "_")
        ).strip().replace(" ", "_") or "presentation"

        return StreamingResponse(
            buffer,
            media_type="video/mp4",
            headers={
                "Content-Disposition": f'attachment; filename="{safe_filename}.mp4"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export video: {e}")


class CompileOutlineRequest(BaseModel):
    outline: str
    theme: Optional[str] = None


@router.post('/narration-draft/parse')
def parse_narration_draft(request: DraftTextRequest):
    try:
        return {'slides': [slide.model_dump() for slide in parse_narration(request.text)]}
    except ValueError as exc:
        raise HTTPException(400, str(exc)) from exc


@router.post('/narration-draft/build', response_model=PresentationModel)
def build_narration_draft(request: DraftBuildRequest):
    return build_draft(request)


@router.post("/compile-outline", response_model=PresentationModel)
def compile_outline(request: CompileOutlineRequest):
    """Compiles an Approach-4 natural semantic outline into a full PresentationModel."""
    try:
        presentation = slide_compiler.compile(request.outline, theme_override=request.theme)
        return presentation
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to compile outline: {e}")


@router.get("/outline-themes")
def get_outline_themes():
    """Returns list of supported themes for outline compilation."""
    return [{"id": k, **v} for k, v in THEMES.items()]



