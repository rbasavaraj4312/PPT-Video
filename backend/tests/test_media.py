import pytest
from pydantic import ValidationError
from backend.app.models.presentation import PresentationModel, SlideMedia
from backend.app.services.narration_timeline import timeline, srt


def media(**patch):
    return dict(kind='video', src='data:video/mp4;base64,AAAA', duration=4,
                trim_start=1, trim_end=3, subtitles=[dict(text='Clip subtitle', startMs=200, endMs=800)], **patch)


def test_media_roundtrip_and_timing_between_slides():
    deck = PresentationModel.model_validate(dict(id='deck', slides=[
        dict(id='a', slide_duration=1), dict(id='clip', media=media()), dict(id='b', slide_duration=1)]))
    deck = PresentationModel.model_validate_json(deck.model_dump_json())
    items, total = timeline(deck)
    assert [item['start'] for item in items] == [0, 30, 90]
    assert total == 120
    assert all(item['transition'] == 0 for item in items)
    assert '00:00:01,200 --> 00:00:01,800\nClip subtitle' in srt(deck)


def test_image_duration_and_clipped_subtitles():
    deck = PresentationModel.model_validate(dict(id='deck', slides=[dict(id='image', slide_duration=1.5,
        media=dict(kind='image', src='data:image/png;base64,AAAA', subtitles=[
            dict(text='Ends at clip end', startMs=500, endMs=3000),
            dict(text='Outside clip', startMs=2000, endMs=3000)]))]))
    assert timeline(deck)[1] == 45
    assert '00:00:00,500 --> 00:00:01,500' in srt(deck)
    assert 'Outside clip' not in srt(deck)


@pytest.mark.parametrize('patch', [dict(trim_start=3, trim_end=2), dict(trim_end=5),
    dict(volume=2), dict(src='https://example.com/video.mp4'), dict(src='data:image/png;base64,AAAA'), dict(duration=float('nan'))])
def test_invalid_media_rejected(patch):
    data = media()
    data.update(patch)
    with pytest.raises(ValidationError):
        SlideMedia.model_validate(data)
