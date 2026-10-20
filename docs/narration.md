# Local English voice cloning and highlighted captions

The editor puts slides, narration, captions, and playback in one workspace.
The right inspector has **Design**, **Voice**, and **Captions** tabs. The timeline
below the canvas shows slides, real audio waveforms, caption phrases, and Morph/Fade
transitions. **Preview** plays in the canvas; **Back to editing** returns to editing.

## On-demand voice service

Voice processing runs in a separate FastAPI process in `voice_service/`, on
`127.0.0.1:8001`. The main backend forwards the existing `/api/speech/*` URLs,
so the browser configuration and saved presentations keep working.

- Starting the normal backend alone does not start the voice process. Editing
  slide artwork does not load any voice models.
- Loading an existing narration waveform, opening the voice selector, generating
  speech, or exporting a narrated video starts the service automatically. Models
  are not loaded to display existing audio or voice profiles.
- The service exits after **60 idle seconds**. Active jobs, uploads, and downloads
  prevent idle shutdown. The next request starts it again.
- Models load only in short-lived inference processes. Generation and alignment
  run serially, with **one CPU thread** by default. Model memory is released when
  each process exits. Active generation can still make the laptop warm.
- **Stop voice processing** under **Voice → Voice settings** stops the idle service immediately.
  It refuses to stop while a job is running. Stopping the backend also stops the
  voice service it launched.

Existing `backend/.venv-speech` installations are detected automatically; there
is no need to reinstall the voice models. Install the lightweight proxy dependency
in whichever environment runs your normal backend:

```bash
python -m pip install -r backend/requirements.txt
```

Restart the backend after updating. For an existing setup, run from the project root:

```bash
backend/.venv-speech/bin/python -m uvicorn backend.app.main:app --port 8000
```

Use your normal backend environment instead if you have a separate one. Avoid
`--reload` for everyday use; it runs an extra file watcher. For development,
restrict it to backend source: `--reload --reload-dir backend/app`.

Configuration is inherited from the terminal that starts the backend:

| Variable | Default | Purpose |
| --- | --- | --- |
| `VOICE_SERVICE_PYTHON` | `voice_service/.venv/bin/python`, then `backend/.venv-speech/bin/python` | Interpreter for the separate service |
| `VOICE_SERVICE_PORT` | `8001` | Local service port |
| `VOICE_SERVICE_IDLE_SECONDS` | `60` | Exit after idle time; `0` disables automatic exit |
| `VOICE_CPU_THREADS` | `1` | CPU thread limit, clamped to 1–4 |

`GET /api/speech/service/status` reports its state without starting it.
`POST /api/speech/service/stop` stops an idle service owned by the backend.
Startup errors and service logs are in `backend/storage/speech/service.log`.
Existing voices, jobs, prompt caches, and generated files stay in the same storage
directory. Interrupted jobs can be retried after a restart.

## Apple Silicon setup (M2, 8 GB)

Use native ARM Python 3.11 or 3.12, not an Intel/Rosetta interpreter. From the repository root:

```bash
/opt/homebrew/bin/brew install python@3.11
/opt/homebrew/bin/python3.11 -c 'import sys, platform; print(sys.version); print(platform.machine())'
/opt/homebrew/bin/python3.11 -m venv voice_service/.venv
voice_service/.venv/bin/python -m pip install --upgrade pip
voice_service/.venv/bin/python -m pip install -r voice_service/requirements.txt
```

The interpreter check must report Python 3.11 and `arm64`. The backend's existing
`.venv` can remain on its current Python. Pocket TTS requires Python 3.10 or newer;
installing it with Python 3.9 can report `No matching distribution found`.
Upgrading pip alone does not fix an unsupported Python version. An Intel Python
under `/usr/local/bin` also cannot run the Apple Silicon MLX engine.

The service automatically uses its own environment for inference. Separate engine
environments are also supported: set `OMNIVOICE_PYTHON`, `POCKET_TTS_PYTHON`, or
`ALIGNMENT_PYTHON` to the relevant executable in the terminal that starts the backend.
The normal backend environment needs only `backend/requirements.txt`; it never
imports the voice queue or speech libraries. First generation can
download model weights. Some model repositories may require accepting their terms
and authenticating with Hugging Face in the speech environment.

### OmniVoice using the model already installed by VoiceStudio

OmniVoice is the default TTS engine. On Apple Silicon, MLX Audio can load the
original `k2-fsa/OmniVoice` weights directly, including their audio tokenizer.
The service automatically reuses a complete model in your Hugging Face cache
(including one downloaded by VoiceStudio), without copying or downloading it again.
You do not need to run VoiceStudio or its other models.

To use another local model folder, set `OMNIVOICE_MODEL=/absolute/path/to/model`
before starting the backend. The folder must include the model, text tokenizer,
and `audio_tokenizer` config and weights. Explicit configuration takes precedence
over automatic cache detection. If no local model exists, the service uses
`mlx-community/OmniVoice-bf16`, which may require an initial download.

In **Voice**, choose **TTS engine → OmniVoice**, select your existing voice profile,
and click **Generate voice**. Existing slides keep their previous engine until you
change it. A new engine requires generating fresh narration. Only the selected
TTS model loads; Pocket TTS and VoiceStudio's ASR/separation models are not loaded.
The existing caption aligner runs afterward in a separate process, after TTS
has exited. Your reference transcript prevents auto-transcription during cloning.

### Optional: enable Pocket TTS for your own voice

Pocket TTS is excluded from the default installation. To enable it, install
`voice_service/requirements-pocket.txt` in your speech environment.

A saved voice profile stores your recording and transcript. Generating speech
from that recording also requires Pocket TTS's gated voice-cloning weights.
The public model with built-in voices cannot clone your recording.

1. Sign in at <https://huggingface.co/kyutai/pocket-tts> and accept its terms.
2. From the project root, log in with the **same account**:

   ```bash
   backend/.venv-speech/bin/hf auth login
   ```

   If you installed the separate environment, use `voice_service/.venv/bin/hf`
   instead. Follow the CLI's login prompts; keep any access token out of chat
   and source files. The account/token needs access to the gated model.
3. Retry **Generate voice** with your existing profile. The first successful
   attempt downloads the cloning weights; you do not need to record again.

The inference process inherits `HF_HOME` and `HF_TOKEN` from the backend's
environment. If you set these explicitly, make sure login and the voice service
use the same Hugging Face configuration. Detailed download failures are kept in
`backend/storage/speech/jobs/<job-id>/worker.log`.

Install video export dependencies:

```bash
cd frontend
npm ci
```

Remotion needs Chrome Headless Shell or a compatible Chrome installation. Its renderer
downloads a browser on first use if needed. To use an existing browser, set
`REMOTION_BROWSER_EXECUTABLE` in the backend environment.

Start the backend as usual on port 8000, with **one Uvicorn worker** and no reloader
for everyday use. The voice service starts automatically. If using a
different port, set `NARRATION_API_ORIGIN`, e.g. `http://127.0.0.1:8010`.
This is the address the local video renderer uses to fetch audio from FastAPI.
Run on the host to use MLX; a Linux Docker container cannot use Apple's MLX runtime.

## Workflow

1. Open a presentation and select the **Voice** inspector tab.
2. Choose a saved voice, or **Record** / **Upload sample**. Select a 3–15 second clip (5–15 recommended),
   enter the exact words spoken in that clip, and save the voice profile.
   The saved, normalized WAV is available for review in the voice selector.
3. In **Voice settings**, choose OmniVoice MLX or Pocket TTS. Both clone the same reference sample;
   derived voice prompts are cached separately for each engine.
4. Write the current slide's narration and click **Generate voice**. Generation and word alignment
   run in separate processes, in that order. Missing dependencies appear in the UI.
5. Use the timeline or **Preview** to play and seek without leaving the editor.
   The **Captions** tab lets you correct individual words and timing, disable word
   highlighting, and change font size, phrase length, colors, and caption position.
   Transition type, duration, and fit-to-audio are available in both narration tabs.
6. Repeat for other slides, then **Save** the presentation to retain narration metadata.
7. Preview narration and captions, or use **Export MP4 Video** to export with voice,
   enabled captions, and transitions at 1080p / 30 FPS. The standard export button
   automatically uses the narrated renderer and downloads the finished video.
   Download SRT from **Captions** and individual WAV files beside the voice player.
   SRT contains phrase timings, not the animated highlighting.

Narration scripts are separate from speaker notes. Changing the script, selected
voice, or engine makes previous audio outdated; export rejects it until regeneration.
Caption text/timing changes do not regenerate audio. Generation results are attached
only if the original slide still has the same script, voice, and engine.

Decks with narration, motion components, or narration reveals automatically use the animated renderer
at 1080p / 30 FPS. Motion-only exports do not load speech models. The static
silent-video exporter remains available for decks without narration or motion
components. Motion clocks start when each slide first becomes visible, including
incoming Morph/Fade transitions; HTML/CSS templates are locked to the same frame
clock for deterministic scrubbing and export. PowerPoint audio embedding
is not included in this version. Present/F5 opens synchronized Remotion playback for
narrated decks, and the existing interactive slideshow for decks without narration.

## Reveal content as it is spoken

1. Generate current narration for the slide, then select an element or a group.
2. Open **Design → Reveal with narration → Choose spoken word**. Each word shows
   its position and source-audio timestamp, so repeated words can be linked precisely.
3. Choose the word. All selected elements receive the same link and a 200 ms fade.
   Choose **Appear** for an immediate reveal, or **Always visible** to clear the link.
4. Use **Preview reveal** to play from 500 ms before the trigger until one second
   after the effect finishes. **Advanced timing** adjusts the offset (−500 to +500 ms)
   and fade duration (100–1000 ms). Reveal edits support undo/redo and never generate speech.

The **Reveals** timeline lane appears when links exist. Click a marker to seek and
select its element. Elements remain visible and selectable while editing and in
thumbnails; during playback they stay hidden until their word, then remain visible
through the outgoing transition. Motion components start their animation at the reveal.
Reveals work with captions hidden and use the same frame evaluator in preview and MP4.
They add no time, silence, or model loading. Images and portrait slides are supported.
PowerPoint includes all elements visibly in their final state, without reveal animations.

Links store word anchors, not fixed video timestamps. Caption timing corrections
and regenerated audio with the same script and normalized word sequence update their
timing automatically. Changed scripts or word sequences require relinking; links never
silently move to another occurrence. Stale or missing narration also needs attention.
Unresolved elements remain visible in playback with an editor warning, and drafts can
still be saved. MP4 export requires resolving or removing invalid links. A trigger
outside its slide’s visible interval requires adjusting its word, offset, or transition.

## Timing and memory

- One speech generation, alignment, or video render runs at a time.
- The service uses one worker and no reload watcher. The frontend uses native file
  watching; set `VITE_USE_POLLING=true` only if your filesystem requires polling.
- Long scripts are split at sentence/word boundaries into bounded chunks.
- Each heavy stage runs in a short-lived process; process exit releases model memory.
- Default alignment uses CPU Whisper `base.en`; set `ALIGNMENT_MODEL=small.en`
  for a quality comparison if word timing is inaccurate.
- Fit-to-audio uses narration duration plus the configured trailing pause. With fit
  disabled, the slide holds for at least its configured duration and the full audio.
- Narration plays on an independent, continuous track. Morph/Fade overlaps the
  narration boundary and adds no extra time or silence. Captions keep following
  the spoken words throughout the transition, including the next slide's words.
- **Pause before next narration** controls the intentional gap (200 ms for new
  slides). Existing saved pauses are preserved. **Pause for emphasis** sets 800 ms.
  Final slides have no extra trailing pause. Manual slide holds remain explicit
  and can intentionally create more time before the next narration.
- Leading/trailing silence is scanned once from the PCM WAV without loading a
  model. Quiet speech and aligned words are protected with safety margins; internal
  sentence pauses and original WAV files are preserved. Existing assets gain
  timing metadata automatically; save the presentation to retain it in the deck.
- Transition blocks overlap both slide clips in the timeline. **Transition timing**
  can be Auto or Adjust; negative offsets move the visual change earlier, positive
  offsets later. Transitions are clamped to available space so short slides never
  create collisions. Voice starts do not change when Morph duration changes.
- Editor preview, narrated MP4 export, and SRT all use the same frame-rounded audio
  trims and narration offsets. SRT remains in presentation time; caption word
  editing remains in the original narration clip's time.
- Browser preview and narrated export use the same frame-based React composition.
  SRT uses the equivalent 30 FPS rounding contract, covered by tests.
- Cancelling a job terminates its process group. Interrupted jobs are marked failed
  on backend restart and can be retried. Completed assets remain cached.

## Storage and portability

`backend/storage/speech/` contains voice profiles, reference recordings, engine prompt
caches, generated WAV/caption assets, jobs, logs, and rendered videos. This directory
is gitignored. Back it up alongside presentation JSON files. JSON exports reference
audio by asset ID and do not embed audio files; copying JSON alone is insufficient.
Set `SPEECH_STORAGE_DIR` to choose another local storage location.

Cache keys include reference audio/transcript, script, selected engine/model,
installed engine/alignment package versions, and a pipeline version. If changing
weights behind the same model ID, clear the relevant cache or change `OMNIVOICE_MODEL`
to a distinct local model path. Automatic selection prefers a complete cached
`k2-fsa/OmniVoice` snapshot; fallback: `mlx-community/OmniVoice-bf16`.

## Benchmark before relying on M2 performance

```bash
voice_service/.venv/bin/python backend/scripts/benchmark_speech.py \
  --audio /absolute/path/my-voice.wav \
  --transcript "The exact words spoken in my sample." \
  --text "Hello. This is a short English narration test."
```

Use a 3–15 second input sample. The benchmark runs the actual adapters serially in
temporary storage, reports elapsed time, per-stage peak process RSS, and generated duration for each engine,
and keeps output files in the printed directory for listening. Observe Activity
Monitor's Memory Pressure and swap while running it with the editor open. Compare
voice resemblance, technical terms, missing words, and captions. No M2 throughput or
memory claim is assumed by the implementation. After a successful Mac benchmark,
record exact installed versions with `pip freeze` for a reproducible local setup.

## Verification

```bash
backend/.venv/bin/pytest backend/tests/test_narration.py backend/tests/test_voice_service.py -q
cd frontend
node --test tests/narration.test.mjs
npm run build
```

Automated backend tests use small WAV fixtures and mocked speech engines; they do
not download voice models or establish perceptual quality. Real OmniVoice inference
requires Apple Silicon. Test actual voice quality and peak memory on the target Mac.

## Upstream projects and licenses

- [OmniVoice](https://huggingface.co/k2-fsa/OmniVoice): pretrained weights carry
  **CC-BY-NC** terms; an MLX conversion does not remove this restriction.
- [MLX Audio](https://github.com/Blaizzy/mlx-audio): Apple Silicon speech runtime.
- [Pocket TTS](https://github.com/kyutai-labs/pocket-tts): official English model and
  CPU implementation; review the chosen model's terms before distribution.
- [Stable-ts](https://github.com/jianfch/stable-ts): word-level forced alignment.
- [Remotion](https://www.remotion.dev): browser preview and video rendering;
  its own license terms apply.
