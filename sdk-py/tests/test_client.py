import pytest
from boxty import Client

def test_client_init():
    c = Client(api_key="test")
    assert c.api_key == "test"
