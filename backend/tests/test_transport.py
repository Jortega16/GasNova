import pytest
from requests.exceptions import Timeout

from pts2_sdk.exceptions import PTS2AuthenticationError, PTS2ProtocolError, PTS2TimeoutError
from pts2_sdk.transport import PTS2Transport


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self.payload = payload
        self.text = text

    def json(self):
        if isinstance(self.payload, Exception):
            raise self.payload
        return self.payload


class FakeSession:
    def __init__(self, response=None, exc=None):
        self.response = response
        self.exc = exc
        self.headers = {}
        self.auth = None

    def mount(self, *_):
        pass

    def post(self, *_args, **_kwargs):
        if self.exc:
            raise self.exc
        return self.response


def make_transport(session):
    return PTS2Transport(
        host="192.168.50.117",
        port=80,
        username="admin",
        password="admin",
        session=session,
        retries=0,
    )


def test_transport_raises_authentication_error_on_401():
    transport = make_transport(FakeSession(FakeResponse(status_code=401, text="unauthorized")))

    with pytest.raises(PTS2AuthenticationError):
        transport.post({"Protocol": "jsonPTS", "Packets": []})


def test_transport_raises_protocol_error_on_invalid_json():
    transport = make_transport(FakeSession(FakeResponse(payload=ValueError("bad json"))))

    with pytest.raises(PTS2ProtocolError):
        transport.post({"Protocol": "jsonPTS", "Packets": []})


def test_transport_tolerates_trailing_data_after_json_object():
    response = FakeResponse(
        text='{"Protocol":"jsonPTS","Packets":[{"Id":1,"Type":"GetDateTime","Data":{"DateTime":"2026-05-27T13:16:00"}}]}]}'
    )
    transport = make_transport(FakeSession(response))

    decoded = transport.post({"Protocol": "jsonPTS", "Packets": []})

    assert decoded["Packets"][0]["Data"]["DateTime"] == "2026-05-27T13:16:00"


def test_transport_raises_timeout_error():
    transport = make_transport(FakeSession(exc=Timeout("slow")))

    with pytest.raises(PTS2TimeoutError):
        transport.post({"Protocol": "jsonPTS", "Packets": []})
