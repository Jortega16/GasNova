"""jsonPTS §188 exige DateTimeStart/DateTimeEnd en formato exacto
'YYYY-MM-DDThh:mm:ss' (19 caracteres, sin sufijo de zona horaria). Usar
datetime.isoformat() sobre un datetime con tzinfo (p.ej. UTC) agrega
'+00:00' y rompe el parseo en el controlador (JSONPTS_ERROR_TIME_OUT_OF_RANGE,
código 48) — ver backend/pts2_api/routers/sync.py.
"""

from datetime import datetime, timedelta, timezone

from pts2_api.routers.sync import _controller_now, _default_date_range, _fmt_pts_datetime


def test_fmt_pts_datetime_has_no_timezone_suffix():
    naive = datetime(2026, 8, 13, 14, 30, 0)
    assert _fmt_pts_datetime(naive) == "2026-08-13T14:30:00"
    assert len(_fmt_pts_datetime(naive)) == 19


def test_fmt_pts_datetime_strips_tzinfo_offset_if_passed_naive_equivalent():
    # Si alguien pasa un datetime tz-aware ya convertido a naive antes de
    # llegar aquí, el formato sigue siendo correcto (19 chars, sin '+00:00').
    aware = datetime(2026, 8, 13, 14, 30, 0, tzinfo=timezone.utc)
    naive_equivalent = aware.replace(tzinfo=None)
    formatted = _fmt_pts_datetime(naive_equivalent)
    assert "+" not in formatted
    assert len(formatted) == 19


def test_default_date_range_without_client_has_no_offset_suffix():
    start, end = _default_date_range(client=None)
    for value in (start, end):
        assert len(value) == 19, f"esperado 19 chars, got {value!r}"
        assert "+" not in value
        assert "Z" not in value
        # Debe poder re-parsearse con el mismo formato exacto que exige el PTS-2
        datetime.strptime(value, "%Y-%m-%dT%H:%M:%S")


def test_default_date_range_spans_48_hours():
    start, end = _default_date_range(client=None)
    start_dt = datetime.strptime(start, "%Y-%m-%dT%H:%M:%S")
    end_dt = datetime.strptime(end, "%Y-%m-%dT%H:%M:%S")
    assert end_dt - start_dt == timedelta(hours=48)


def test_default_date_range_uses_controller_datetime_when_available():
    class FakeClient:
        def get_datetime(self):
            return {"DateTime": "2020-01-10T08:00:00", "UTCOffset": -360}

    start, end = _default_date_range(client=FakeClient())
    assert end == "2020-01-10T08:00:00"
    assert start == "2020-01-08T08:00:00"


def test_default_date_range_falls_back_when_controller_datetime_fails():
    class BrokenClient:
        def get_datetime(self):
            raise RuntimeError("PTS-2 unreachable")

    # No debe propagar la excepción — debe caer al respaldo en UTC del backend.
    start, end = _default_date_range(client=BrokenClient())
    assert len(start) == 19 and len(end) == 19
    assert "+" not in start and "+" not in end


def test_controller_now_parses_datetime_field():
    class FakeClient:
        def get_datetime(self):
            return {"DateTime": "2026-08-13T14:30:00", "UTCOffset": -360}

    result = _controller_now(FakeClient())
    assert result == datetime(2026, 8, 13, 14, 30, 0)


def test_controller_now_returns_none_on_missing_field():
    class FakeClient:
        def get_datetime(self):
            return {"UTCOffset": -360}

    assert _controller_now(FakeClient()) is None
