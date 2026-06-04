import pytest
from boxty import Sandbox, Client

def test_sandbox_id():
    client = Client()
    sb = Sandbox(client, {"id": "sb-1", "status": "running"})
    assert sb.id == "sb-1"
