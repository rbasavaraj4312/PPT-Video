import datetime
import json
import logging
from pathlib import Path
from typing import List, Optional
from ..models.presentation import (
    PresentationModel,
    PresentationSummary,
    FolderModel,
    TemplateModel,
    TemplateSummary,
    MotionTemplateModel,
    SlideModel,
    ElementModel,
    ElementType,
    ArrowHead,
    StrokeStyle,
)
from ..data.builtin_templates import BUILTIN_TEMPLATES
from ..data.builtin_motion_templates import BUILTIN_MOTION_TEMPLATES
from .speech_storage import SpeechStorage, atomic_json

logger = logging.getLogger(__name__)

# Base storage path inside backend/storage
STORAGE_DIR = Path(__file__).resolve().parent.parent.parent / "storage"


class StorageService:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or STORAGE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)

        # Structured folder paths: templates, motion-templates, and data
        self.templates_dir = self.storage_dir / "templates"
        self.motion_templates_dir = self.storage_dir / "motion-templates"
        self.data_dir = self.storage_dir / "data"

        self.templates_dir.mkdir(parents=True, exist_ok=True)
        self.motion_templates_dir.mkdir(parents=True, exist_ok=True)
        self.data_dir.mkdir(parents=True, exist_ok=True)

        self.folders_file = self.data_dir / "folders.json"
        self.templates_file = self.templates_dir / "templates.json"
        self.deleted_templates_file = self.templates_dir / "deleted_templates.json"
        self.motion_templates_file = self.motion_templates_dir / "motion_templates.json"
        self.deleted_motion_templates_file = self.motion_templates_dir / "deleted_motion_templates.json"

        self._migrate_legacy_storage()
        self._ensure_default_folders()
        self._ensure_sample_presentation()

    def _migrate_legacy_storage(self):
        """Migrate legacy flat storage into structured templates/, motion-templates/, and data/ folders."""
        legacy_mappings = [
            (self.storage_dir / "_folders.json", self.folders_file),
            (self.storage_dir / "folders.json", self.folders_file),
            (self.storage_dir / "_templates.json", self.templates_file),
            (self.storage_dir / "templates.json", self.templates_file),
            (self.storage_dir / "_deleted_templates.json", self.deleted_templates_file),
            (self.storage_dir / "deleted_templates.json", self.deleted_templates_file),
            (self.storage_dir / "_motion_templates.json", self.motion_templates_file),
            (self.storage_dir / "motion_templates.json", self.motion_templates_file),
            (self.storage_dir / "_deleted_motion_templates.json", self.deleted_motion_templates_file),
            (self.storage_dir / "deleted_motion_templates.json", self.deleted_motion_templates_file),
        ]

        for legacy_path, target_path in legacy_mappings:
            if legacy_path.exists() and legacy_path.resolve() != target_path.resolve():
                try:
                    if not target_path.exists() or (target_path.stat().st_size <= 2 and legacy_path.stat().st_size > 2):
                        target_path.write_bytes(legacy_path.read_bytes())
                    legacy_path.unlink()
                except Exception as e:
                    logger.warning("Failed migrating %s to %s: %s", legacy_path, target_path, e)

        # Migrate presentations and media from root storage_dir into data_dir
        for item in self.storage_dir.iterdir():
            if item.is_file() and item.suffix.lower() in (".json", ".mp4"):
                target = self.data_dir / item.name
                try:
                    if not target.exists():
                        item.rename(target)
                    else:
                        item.unlink()
                except Exception as e:
                    logger.warning("Failed migrating %s to %s: %s", item, target, e)

    def _get_deleted_template_ids(self) -> set:
        if not self.deleted_templates_file.exists():
            return set()
        try:
            with open(self.deleted_templates_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data) if isinstance(data, list) else set()
        except Exception:
            return set()

    def _save_deleted_template_ids(self, ids: set):
        with open(self.deleted_templates_file, "w", encoding="utf-8") as f:
            json.dump(sorted(list(ids)), f, indent=2)

    def _get_deleted_motion_template_ids(self) -> set:
        if not self.deleted_motion_templates_file.exists():
            return set()
        try:
            with open(self.deleted_motion_templates_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return set(data) if isinstance(data, list) else set()
        except Exception:
            return set()

    def _save_deleted_motion_template_ids(self, ids: set):
        with open(self.deleted_motion_templates_file, "w", encoding="utf-8") as f:
            json.dump(sorted(list(ids)), f, indent=2)

    def _get_file_path(self, presentation_id: str) -> Path:
        safe_id = "".join(c for c in presentation_id if c.isalnum() or c in ("-", "_"))
        return self.data_dir / f"{safe_id}.json"

    # ================= Folders Management =================
    def _ensure_default_folders(self):
        if not self.folders_file.exists():
            now = datetime.datetime.now(datetime.timezone.utc).isoformat()
            default_folders = [
                {
                    "id": "folder-reels",
                    "name": "Reels & Shorts",
                    "color": "#ec4899",
                    "created_at": now,
                    "updated_at": now,
                },
                {
                    "id": "folder-tutorials",
                    "name": "AI & Tech Guides",
                    "color": "#6366f1",
                    "created_at": now,
                    "updated_at": now,
                },
            ]
            with open(self.folders_file, "w", encoding="utf-8") as f:
                json.dump(default_folders, f, indent=2)

    def list_folders(self) -> List[FolderModel]:
        if not self.folders_file.exists():
            return []
        try:
            with open(self.folders_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                return [FolderModel.model_validate(item) for item in data]
        except Exception as e:
            logger.warning("Failed to read folders from %s: %s", self.folders_file, e)
            return []

    def create_folder(self, folder: FolderModel) -> FolderModel:
        folders = self.list_folders()
        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not folder.created_at:
            folder.created_at = now
        folder.updated_at = now
        folders.append(folder)
        with open(self.folders_file, "w", encoding="utf-8") as f:
            json.dump([f.model_dump() for f in folders], f, indent=2)
        return folder

    def _get_descendant_folder_ids(self, folders: List[FolderModel], folder_id: str) -> set:
        descendants = {folder_id}
        added = True
        while added:
            added = False
            for f in folders:
                if f.parent_id in descendants and f.id not in descendants:
                    descendants.add(f.id)
                    added = True
        return descendants

    def update_folder(
        self,
        folder_id: str,
        name: Optional[str] = None,
        color: Optional[str] = None,
        parent_id: Optional[str] = None,
        update_parent: bool = False,
    ) -> Optional[FolderModel]:
        folders = self.list_folders()
        target = None
        for f in folders:
            if f.id == folder_id:
                if name is not None:
                    f.name = name
                if color is not None:
                    f.color = color
                if update_parent:
                    if parent_id != folder_id:
                        f.parent_id = parent_id
                f.updated_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
                target = f
                break
        if target:
            with open(self.folders_file, "w", encoding="utf-8") as f:
                json.dump([item.model_dump() for item in folders], f, indent=2)
        return target

    def move_folder(self, folder_id: str, new_parent_id: Optional[str]) -> bool:
        folders = self.list_folders()
        if new_parent_id:
            # Cannot move into itself or its own descendants
            descendant_ids = self._get_descendant_folder_ids(folders, folder_id)
            if new_parent_id in descendant_ids:
                return False
            if not any(f.id == new_parent_id for f in folders):
                return False

        updated = self.update_folder(folder_id, parent_id=new_parent_id, update_parent=True)
        return updated is not None

    def delete_folder(self, folder_id: str) -> bool:
        folders = self.list_folders()
        descendant_ids = self._get_descendant_folder_ids(folders, folder_id)
        filtered = [f for f in folders if f.id not in descendant_ids]
        if len(filtered) == len(folders):
            return False
        with open(self.folders_file, "w", encoding="utf-8") as f:
            json.dump([item.model_dump() for item in filtered], f, indent=2)

        # Unassign deleted folder and any descendant subfolders from presentations
        for file_path in self.data_dir.glob("*.json"):
            if file_path.name.startswith("_") or file_path.name in ("folders.json", "templates.json", "motion_templates.json"):
                continue
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    pdata = json.load(f)
                if pdata.get("folder_id") in descendant_ids:
                    pdata["folder_id"] = None
                    with open(file_path, "w", encoding="utf-8") as f:
                        json.dump(pdata, f, indent=2, ensure_ascii=False)
            except Exception:
                pass
        return True

    def move_presentation_to_folder(self, presentation_id: str, folder_id: Optional[str]) -> bool:
        pres = self.get_presentation(presentation_id)
        if not pres:
            return False
        pres.folder_id = folder_id
        self.save_presentation(pres)
        return True

    # ================= Templates Management =================
    def list_templates(
        self, category: Optional[str] = None, aspect_ratio: Optional[str] = None
    ) -> List[TemplateModel]:
        deleted_ids = self._get_deleted_template_ids()
        templates_map = {
            t["id"]: TemplateModel.model_validate(t)
            for t in BUILTIN_TEMPLATES
            if t["id"] not in deleted_ids
        }

        if self.templates_file.exists():
            try:
                with open(self.templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        t = TemplateModel.model_validate(item)
                        if t.id not in deleted_ids:
                            templates_map[t.id] = t
            except Exception as e:
                logger.warning("Failed to read custom templates from %s: %s", self.templates_file, e)

        templates = list(templates_map.values())

        if category and category != "all":
            templates = [t for t in templates if t.category == category]

        if aspect_ratio and aspect_ratio != "all":
            templates = [t for t in templates if t.aspect_ratio == aspect_ratio]

        return templates

    def get_template(self, template_id: str) -> Optional[TemplateModel]:
        for t in self.list_templates():
            if t.id == template_id:
                return t
        return None

    def save_template(self, template: TemplateModel) -> TemplateModel:
        deleted_ids = self._get_deleted_template_ids()
        if template.id in deleted_ids:
            deleted_ids.remove(template.id)
            self._save_deleted_template_ids(deleted_ids)

        custom_templates = []
        if self.templates_file.exists():
            try:
                with open(self.templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    custom_templates = [TemplateModel.model_validate(item) for item in data]
            except Exception:
                custom_templates = []

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not template.created_at:
            template.created_at = now_iso
        template.updated_at = now_iso
        template.is_builtin = False
        template.slide_count = len(template.slides)

        existing_idx = next((i for i, t in enumerate(custom_templates) if t.id == template.id), -1)
        if existing_idx >= 0:
            custom_templates[existing_idx] = template
        else:
            custom_templates.append(template)

        with open(self.templates_file, "w", encoding="utf-8") as f:
            json.dump([t.model_dump() for t in custom_templates], f, indent=2, ensure_ascii=False)
        return template

    def delete_template(self, template_id: str) -> bool:
        deleted_ids = self._get_deleted_template_ids()
        builtin_ids = {t["id"] for t in BUILTIN_TEMPLATES}

        removed_from_custom = False
        if self.templates_file.exists():
            try:
                with open(self.templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                filtered = [item for item in data if item.get("id") != template_id]
                if len(filtered) < len(data):
                    removed_from_custom = True
                    with open(self.templates_file, "w", encoding="utf-8") as f:
                        json.dump(filtered, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.warning("Failed to remove template %s from custom file: %s", template_id, e)

        if template_id in builtin_ids or removed_from_custom or template_id in deleted_ids:
            deleted_ids.add(template_id)
            self._save_deleted_template_ids(deleted_ids)
            return True

        return False

    # ================= Motion Templates Management =================
    def list_motion_templates(self, category: Optional[str] = None) -> List[MotionTemplateModel]:
        deleted_ids = self._get_deleted_motion_template_ids()
        templates_map = {
            t["id"]: MotionTemplateModel.model_validate(t)
            for t in BUILTIN_MOTION_TEMPLATES
            if t["id"] not in deleted_ids
        }

        if self.motion_templates_file.exists():
            try:
                with open(self.motion_templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    for item in data:
                        t = MotionTemplateModel.model_validate(item)
                        if t.id not in deleted_ids:
                            templates_map[t.id] = t
            except Exception as e:
                logger.warning("Failed to read motion templates from %s: %s", self.motion_templates_file, e)

        templates = list(templates_map.values())
        if category and category != "all":
            templates = [t for t in templates if t.category == category]
        return templates

    def get_motion_template(self, template_id: str) -> Optional[MotionTemplateModel]:
        for t in self.list_motion_templates():
            if t.id == template_id:
                return t
        return None

    def save_motion_template(self, template: MotionTemplateModel) -> MotionTemplateModel:
        deleted_ids = self._get_deleted_motion_template_ids()
        if template.id in deleted_ids:
            deleted_ids.remove(template.id)
            self._save_deleted_motion_template_ids(deleted_ids)

        custom_templates = []
        if self.motion_templates_file.exists():
            try:
                with open(self.motion_templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    custom_templates = [MotionTemplateModel.model_validate(item) for item in data]
            except Exception:
                custom_templates = []

        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not template.created_at:
            template.created_at = now_iso
        template.updated_at = now_iso
        template.is_builtin = False

        existing_idx = next((i for i, t in enumerate(custom_templates) if t.id == template.id), -1)
        if existing_idx >= 0:
            custom_templates[existing_idx] = template
        else:
            custom_templates.append(template)

        with open(self.motion_templates_file, "w", encoding="utf-8") as f:
            json.dump([t.model_dump() for t in custom_templates], f, indent=2, ensure_ascii=False)
        return template

    def delete_motion_template(self, template_id: str) -> bool:
        deleted_ids = self._get_deleted_motion_template_ids()
        builtin_ids = {t["id"] for t in BUILTIN_MOTION_TEMPLATES}

        removed_from_custom = False
        if self.motion_templates_file.exists():
            try:
                with open(self.motion_templates_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                filtered = [item for item in data if item.get("id") != template_id]
                if len(filtered) < len(data):
                    removed_from_custom = True
                    with open(self.motion_templates_file, "w", encoding="utf-8") as f:
                        json.dump(filtered, f, indent=2, ensure_ascii=False)
            except Exception as e:
                logger.warning("Failed to remove motion template %s from custom file: %s", template_id, e)

        if template_id in builtin_ids or removed_from_custom or template_id in deleted_ids:
            deleted_ids.add(template_id)
            self._save_deleted_motion_template_ids(deleted_ids)
            return True

        return False

    # ================= Presentations Management =================
    def list_presentations(self) -> List[PresentationSummary]:
        summaries = []
        for file_path in self.data_dir.glob("*.json"):
            if file_path.name.startswith("_") or file_path.name in ("folders.json", "templates.json", "motion_templates.json"):
                continue
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    summaries.append(
                        PresentationSummary(
                            id=data.get("id", file_path.stem),
                            title=data.get("title", "Untitled Presentation"),
                            aspect_ratio=data.get("aspect_ratio", "16:9"),
                            slide_count=len(data.get("slides", [])),
                            folder_id=data.get("folder_id"),
                            created_at=data.get("created_at"),
                            updated_at=data.get("updated_at"),
                        )
                    )
            except Exception as e:
                logger.warning("Failed to parse presentation file %s: %s", file_path, e)
        # Sort by updated_at descending
        summaries.sort(key=lambda s: s.updated_at or "", reverse=True)
        return summaries

    def get_presentation(self, presentation_id: str) -> Optional[PresentationModel]:
        file_path = self._get_file_path(presentation_id)
        if not file_path.exists():
            return None
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return PresentationModel.model_validate(data)

    def save_presentation(self, pres: PresentationModel) -> PresentationModel:
        now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
        if not pres.created_at:
            pres.created_at = now_iso
        pres.updated_at = now_iso

        file_path = self._get_file_path(pres.id)
        atomic_json(file_path, pres.model_dump())
        # A failed save never reaches cleanup. Cleanup itself is best effort and
        # uses disk files only; it cannot start the voice service or load models.
        try:
            SpeechStorage().cleanup_saved_jobs(pres)
        except Exception:
            logger.warning('Speech scratch cleanup deferred after saving %s', pres.id, exc_info=True)
        return pres

    def delete_presentation(self, presentation_id: str) -> bool:
        file_path = self._get_file_path(presentation_id)
        if file_path.exists():
            file_path.unlink()
            return True
        return False

    def _ensure_sample_presentation(self):
        sample_path = self.data_dir / "sample-presentation.json"
        if sample_path.exists():
            return

        now = datetime.datetime.now(datetime.timezone.utc).isoformat()
        sample = PresentationModel(
            id="sample-presentation",
            title="Interactive Visual Presentation",
            aspect_ratio="16:9",
            created_at=now,
            updated_at=now,
            slides=[
                SlideModel(
                    id="slide-1",
                    title="Slide 1 - Welcome & Shapes",
                    background="#ffffff",
                    notes="Welcome slide introducing text, shapes, lines, arrows, and colors.",
                    elements=[
                        ElementModel(
                            id="el-title",
                            type=ElementType.TEXT,
                            x=80,
                            y=60,
                            width=1120,
                            height=70,
                            content="Visual Presentation Builder",
                            font_size=40,
                            font_weight="bold",
                            font_color="#0f172a",
                            text_align="left",
                        ),
                        ElementModel(
                            id="el-subtitle",
                            type=ElementType.TEXT,
                            x=80,
                            y=135,
                            width=900,
                            height=40,
                            content="Pure JSON-driven architecture • Excalidraw / tldraw canvas style",
                            font_size=20,
                            font_color="#64748b",
                            text_align="left",
                        ),
                        ElementModel(
                            id="el-rect-1",
                            type=ElementType.RECTANGLE,
                            x=80,
                            y=220,
                            width=280,
                            height=180,
                            fill="#3b82f6",
                            stroke="#1d4ed8",
                            stroke_width=3,
                        ),
                        ElementModel(
                            id="el-rect-label",
                            type=ElementType.TEXT,
                            x=95,
                            y=280,
                            width=250,
                            height=50,
                            content="Rectangle Shape",
                            font_size=22,
                            font_weight="bold",
                            font_color="#ffffff",
                            text_align="center",
                        ),
                        ElementModel(
                            id="el-arrow-1",
                            type=ElementType.ARROW,
                            x1=370,
                            y1=310,
                            x2=480,
                            y2=310,
                            stroke="#6366f1",
                            stroke_width=4,
                            arrow_head=ArrowHead.END,
                        ),
                        ElementModel(
                            id="el-round-rect",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=490,
                            y=220,
                            width=280,
                            height=180,
                            fill="#10b981",
                            stroke="#047857",
                            stroke_width=3,
                            radius=20,
                        ),
                        ElementModel(
                            id="el-round-label",
                            type=ElementType.TEXT,
                            x=505,
                            y=280,
                            width=250,
                            height=50,
                            content="Rounded Rectangle",
                            font_size=22,
                            font_weight="bold",
                            font_color="#ffffff",
                            text_align="center",
                        ),
                        ElementModel(
                            id="el-arrow-2",
                            type=ElementType.ARROW,
                            x1=780,
                            y1=310,
                            x2=890,
                            y2=310,
                            stroke="#f59e0b",
                            stroke_width=4,
                            arrow_head=ArrowHead.END,
                        ),
                        ElementModel(
                            id="el-circle",
                            type=ElementType.ELLIPSE,
                            x=900,
                            y=220,
                            width=200,
                            height=180,
                            fill="#ec4899",
                            stroke="#be185d",
                            stroke_width=3,
                        ),
                        ElementModel(
                            id="el-circle-label",
                            type=ElementType.TEXT,
                            x=900,
                            y=285,
                            width=200,
                            height=50,
                            content="Ellipse",
                            font_size=22,
                            font_weight="bold",
                            font_color="#ffffff",
                            text_align="center",
                        ),
                        ElementModel(
                            id="el-divider",
                            type=ElementType.LINE,
                            x1=80,
                            y1=460,
                            x2=1160,
                            y2=460,
                            stroke="#cbd5e1",
                            stroke_width=2,
                            stroke_style=StrokeStyle.DASHED,
                        ),
                        ElementModel(
                            id="el-footer",
                            type=ElementType.TEXT,
                            x=80,
                            y=490,
                            width=1000,
                            height=40,
                            content="⚡ Direct JSON storage — no database required. Export to native PowerPoint anytime!",
                            font_size=18,
                            font_color="#475569",
                        ),
                    ],
                ),
                SlideModel(
                    id="slide-2",
                    title="Slide 2 - Flow & Architecture",
                    background="#f8fafc",
                    notes="Slide showing process flow diagram with arrows and colored connectors.",
                    elements=[
                        ElementModel(
                            id="el-s2-title",
                            type=ElementType.TEXT,
                            x=80,
                            y=70,
                            width=1120,
                            height=60,
                            content="Process & Directional Flows",
                            font_size=36,
                            font_weight="bold",
                            font_color="#0f172a",
                        ),
                        ElementModel(
                            id="el-step-1",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=120,
                            y=240,
                            width=220,
                            height=120,
                            fill="#f1f5f9",
                            stroke="#3b82f6",
                            stroke_width=3,
                            radius=16,
                        ),
                        ElementModel(
                            id="el-step-1-text",
                            type=ElementType.TEXT,
                            x=130,
                            y=275,
                            width=200,
                            height=50,
                            content="1. Design in Canvas",
                            font_size=18,
                            font_weight="bold",
                            font_color="#1e293b",
                            text_align="center",
                        ),
                        ElementModel(
                            id="el-step-arrow-1",
                            type=ElementType.ARROW,
                            x1=350,
                            y1=300,
                            x2=480,
                            y2=300,
                            stroke="#3b82f6",
                            stroke_width=3,
                            arrow_head=ArrowHead.END,
                        ),
                        ElementModel(
                            id="el-step-2",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=490,
                            y=240,
                            width=240,
                            height=120,
                            fill="#f1f5f9",
                            stroke="#10b981",
                            stroke_width=3,
                            radius=16,
                        ),
                        ElementModel(
                            id="el-step-2-text",
                            type=ElementType.TEXT,
                            x=500,
                            y=275,
                            width=220,
                            height=50,
                            content="2. Auto-Save to JSON",
                            font_size=18,
                            font_weight="bold",
                            font_color="#1e293b",
                            text_align="center",
                        ),
                        ElementModel(
                            id="el-step-arrow-2",
                            type=ElementType.ARROW,
                            x1=740,
                            y1=300,
                            x2=870,
                            y2=300,
                            stroke="#10b981",
                            stroke_width=3,
                            arrow_head=ArrowHead.END,
                        ),
                        ElementModel(
                            id="el-step-3",
                            type=ElementType.ROUNDED_RECTANGLE,
                            x=880,
                            y=240,
                            width=240,
                            height=120,
                            fill="#f1f5f9",
                            stroke="#8b5cf6",
                            stroke_width=3,
                            radius=16,
                        ),
                        ElementModel(
                            id="el-step-3-text",
                            type=ElementType.TEXT,
                            x=890,
                            y=275,
                            width=220,
                            height=50,
                            content="3. Export to PPTX",
                            font_size=18,
                            font_weight="bold",
                            font_color="#1e293b",
                            text_align="center",
                        ),
                    ],
                ),
            ],
        )
        self.save_presentation(sample)


# Global singleton instance
storage_service = StorageService()

