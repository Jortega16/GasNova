import pytest

from pts2_sdk import PTS2Client
from pts2_sdk.exceptions import (
    PTS2PacketError,
    PTS2ProtocolError,
    PTS2TimeoutError,
    PTS2ValidationError,
)


class FakeTransport:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def post(self, payload):
        self.requests.append(payload)
        return self.responses.pop(0)

    def close(self):
        pass


def make_client(responses):
    return PTS2Client(host="192.168.50.117", transport=FakeTransport(responses))


def test_get_network_settings_builds_jsonpts_payload():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 1,
                        "Type": "GetPtsNetworkSettings",
                        "Data": {"IpAddress": "192.168.50.117", "Gateway": "192.168.50.1"},
                    }
                ],
            }
        ]
    )

    network = client.get_network_settings()

    assert network.ip_address == "192.168.50.117"
    assert client.transport.requests[0] == {
        "Protocol": "jsonPTS",
        "Packets": [{"Id": 1, "Type": "GetPtsNetworkSettings"}],
    }


def test_get_network_settings_normalizes_ipv4_lists():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 1,
                        "Type": "GetPtsNetworkSettings",
                        "Data": {
                            "IpAddress": [192, 168, 50, 117],
                            "Gateway": [192, 168, 50, 1],
                            "Dns1": [8, 8, 8, 8],
                        },
                    }
                ],
            }
        ]
    )

    network = client.get_network_settings()

    assert network.ip_address == "192.168.50.117"
    assert network.gateway == "192.168.50.1"
    assert network.dns1 == "8.8.8.8"


def test_pump_authorize_payload_contains_requested_preset():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [{"Id": 1, "Type": "PumpAuthorize", "Data": {"Accepted": True}}],
            }
        ]
    )

    assert client.pumps.authorize(1, nozzle=2, volume=10.5) == {"Accepted": True}
    assert client.transport.requests[0]["Packets"][0]["Data"] == {
        "Pump": 1,
        "Nozzle": 2,
        "Type": "Volume",
        "Dose": 10.5,
    }


def test_pump_authorize_amount_uses_type_and_dose():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [{"Id": 1, "Type": "PumpAuthorize", "Data": {"Accepted": True}}],
            }
        ]
    )

    client.pumps.authorize_amount(1, nozzle=1, amount=500)

    assert client.transport.requests[0]["Packets"][0]["Data"] == {
        "Pump": 1,
        "Nozzle": 1,
        "Type": "Amount",
        "Dose": 500,
    }


def test_pump_authorize_free_defaults_to_full_tank():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [{"Id": 1, "Type": "PumpAuthorize", "Data": {"Accepted": True}}],
            }
        ]
    )

    client.pumps.authorize_free(1, nozzle=1)

    assert client.transport.requests[0]["Packets"][0]["Data"] == {"Pump": 1, "Nozzle": 1, "Type": "FullTank"}


def test_authorize_rejects_volume_and_amount_together():
    client = make_client([])

    with pytest.raises(PTS2ValidationError):
        client.pumps.authorize(1, volume=1, amount=100)


@pytest.mark.parametrize(
    ("method_name", "expected_type", "expected_data"),
    [
        ("suspend", "PumpSuspend", {"Pump": 1}),
        ("resume", "PumpResume", {"Pump": 1}),
        ("close_transaction", "PumpCloseTransaction", {"Pump": 1}),
        ("lock", "PumpLock", {"Pump": 1}),
        ("unlock", "PumpUnlock", {"Pump": 1}),
        ("emergency_stop_all", "PumpEmergencyStop", {"Pump": 0}),
    ],
)
def test_pump_pos_commands_build_expected_packets(method_name, expected_type, expected_data):
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [{"Id": 1, "Type": expected_type, "Data": {"OK": True}}],
            }
        ]
    )

    method = getattr(client.pumps, method_name)
    if method_name == "emergency_stop_all":
        method()
    else:
        method(1)

    packet = client.transport.requests[0]["Packets"][0]
    assert packet["Type"] == expected_type
    assert packet["Data"] == expected_data


def test_get_prices_polls_status_until_pump_prices_received():
    # PumpGetPrices only confirms receipt; the actual prices arrive later on
    # a PumpGetStatus poll as a PumpPrices packet.
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [{"Id": 1, "Type": "PumpGetPrices", "Message": "OK"}],
            },
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 2,
                        "Type": "PumpPrices",
                        "Data": {"Pump": 1, "Prices": [1.25, 1.69], "User": "admin"},
                    }
                ],
            },
        ]
    )

    result = client.pumps.get_prices(1, poll_interval=0)

    assert result == {"Pump": 1, "NozzlePrices": [1.25, 1.69]}
    requests = client.transport.requests
    assert requests[0]["Packets"][0]["Type"] == "PumpGetPrices"
    assert requests[1]["Packets"][0]["Type"] == "PumpGetStatus"


def test_get_prices_times_out_when_pump_prices_never_arrives():
    status_response = {
        "Protocol": "jsonPTS",
        "Packets": [{"Id": 2, "Type": "PumpIdleStatus", "Data": {"Pump": 1}}],
    }
    client = make_client(
        [
            {"Protocol": "jsonPTS", "Packets": [{"Id": 1, "Type": "PumpGetPrices", "Message": "OK"}]},
            status_response,
            status_response,
        ]
    )

    with pytest.raises(PTS2TimeoutError):
        client.pumps.get_prices(1, timeout=0, poll_interval=0)


def test_get_totals_sends_default_nozzle_and_polls_status():
    client = make_client(
        [
            {"Protocol": "jsonPTS", "Packets": [{"Id": 1, "Type": "PumpGetTotals", "Message": "OK"}]},
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 2,
                        "Type": "PumpTotals",
                        "Data": {"Pump": 1, "Nozzle": 1, "Volume": 123.45, "Amount": 456.78},
                    }
                ],
            },
        ]
    )

    totals = client.pumps.get_totals(1, poll_interval=0)

    assert client.transport.requests[0]["Packets"][0]["Data"] == {"Pump": 1, "Nozzle": 1}
    assert totals.pump == 1
    assert totals.to_dict()["Volume"] == 123.45


def test_get_display_data_polls_status_until_received():
    client = make_client(
        [
            {"Protocol": "jsonPTS", "Packets": [{"Id": 1, "Type": "PumpGetDisplayData", "Message": "OK"}]},
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 2,
                        "Type": "PumpDisplayData",
                        "Data": {"Pump": 1, "Volume": 1.55, "Amount": 12.34},
                    }
                ],
            },
        ]
    )

    result = client.pumps.get_display_data(1, poll_interval=0)

    assert result == {"Pump": 1, "Volume": 1.55, "Amount": 12.34}


def test_packet_error_raises_sdk_exception():
    client = make_client(
        [
            {
                "Protocol": "jsonPTS",
                "Packets": [
                    {
                        "Id": 1,
                        "Type": "PumpAuthorize",
                        "Message": "Error",
                        "Data": {"Code": 123, "Description": "Denied"},
                    }
                ],
            }
        ]
    )

    with pytest.raises(PTS2PacketError) as exc:
        client.pumps.authorize(1)

    assert "Denied" in str(exc.value)


def test_response_without_packets_is_protocol_error():
    client = make_client([{"Protocol": "jsonPTS"}])

    with pytest.raises(PTS2ProtocolError):
        client.get_datetime()
