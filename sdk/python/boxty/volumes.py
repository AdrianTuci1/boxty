from __future__ import annotations

from typing import Any

import httpx


class VolumesClient:
    def __init__(self, http: httpx.Client, base: str) -> None:
        self._http = http
        self._base = base

    # -- list / create / delete -----------------------------------------------

    def list(self) -> list[dict[str, Any]]:
        r = self._http.get("/api/volumes")
        r.raise_for_status()
        return r.json()

    def create(
        self, name: str, size_gb: int = 10, volume_type: str = "block-storage"
    ) -> dict[str, Any]:
        payload = {"name": name, "sizeGb": size_gb, "type": volume_type}
        r = self._http.post("/api/volumes", json=payload)
        r.raise_for_status()
        return r.json()

    def delete(self, locator: str) -> bool:
        r = self._http.delete(f"/api/volumes/{locator}")
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- entries --------------------------------------------------------------

    def list_entries(self, locator: str, path: str = "") -> list[dict[str, Any]]:
        params = {"path": path} if path else {}
        r = self._http.get(f"/api/volumes/{locator}/entries", params=params)
        r.raise_for_status()
        return r.json()

    def put_entry(
        self, locator: str, path: str, contents: str | bytes
    ) -> dict[str, Any]:
        if isinstance(contents, bytes):
            contents_str = contents.decode("utf-8", errors="replace")
        else:
            contents_str = contents
        payload = {"path": path, "contents": contents_str}
        r = self._http.post(f"/api/volumes/{locator}/entries", json=payload)
        r.raise_for_status()
        return r.json()

    def delete_entry(self, locator: str, path: str) -> bool:
        r = self._http.delete(f"/api/volumes/{locator}/entries", params={"path": path})
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- blob (raw binary upload) ---------------------------------------------

    def put_blob(self, locator: str, path: str, data: bytes) -> dict[str, Any]:
        params = {"path": path}
        r = self._http.put(
            f"/api/volumes/{locator}/blob", params=params, content=data
        )
        r.raise_for_status()
        return r.json()

    # -- public object URL ----------------------------------------------------

    def object_url(self, locator: str, path: str) -> str:
        return f"{self._base}/objects/{locator}/{path.lstrip('/')}"
