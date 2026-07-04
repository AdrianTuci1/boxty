from __future__ import annotations

from typing import Any

import httpx


class VolumesClient:
    def __init__(self, http: httpx.Client, base: str) -> None:
        self._http = http
        self._base = base

    # -- list / create / delete / get -----------------------------------------

    def list(self, workspace_id: str | None = None) -> list[dict[str, Any]]:
        params = {"workspace_id": workspace_id} if workspace_id else None
        r = self._http.get("/v1/volumes", params=params)
        r.raise_for_status()
        return r.json()

    def create(
        self, workspace_id: str, name: str, size_gb: int = 10, volume_type: str = "object-storage"
    ) -> dict[str, Any]:
        payload = {"workspace_id": workspace_id, "name": name, "size_gb": size_gb, "volume_type": volume_type}
        r = self._http.post("/v1/volumes", json=payload)
        r.raise_for_status()
        return r.json()

    def get(self, workspace_id: str, locator: str) -> dict[str, Any]:
        r = self._http.get(f"/v1/volumes/{workspace_id}/{locator}")
        r.raise_for_status()
        return r.json()

    def delete(self, workspace_id: str, locator: str) -> bool:
        r = self._http.delete(f"/v1/volumes/{workspace_id}/{locator}")
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- entries --------------------------------------------------------------

    def list_entries(self, locator: str, path: str = "") -> list[dict[str, Any]]:
        params = {"path": path} if path else {}
        r = self._http.get(f"/v1/volumes/{locator}/entries", params=params)
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
        r = self._http.post(f"/v1/volumes/{locator}/entries", json=payload)
        r.raise_for_status()
        return r.json()

    def delete_entry(self, locator: str, path: str) -> bool:
        r = self._http.delete(f"/v1/volumes/{locator}/entries", params={"path": path})
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- blob (raw binary upload) ---------------------------------------------

    def put_blob(self, locator: str, path: str, data: bytes) -> dict[str, Any]:
        params = {"path": path}
        r = self._http.put(
            f"/v1/volumes/{locator}/blob", params=params, content=data
        )
        r.raise_for_status()
        return r.json()

    def get_blob(self, locator: str, path: str) -> bytes:
        r = self._http.get(f"/v1/volumes/{locator}/blob", params={"path": path})
        r.raise_for_status()
        return r.content

    def delete_blob(self, locator: str, path: str) -> bool:
        r = self._http.delete(f"/v1/volumes/{locator}/blob", params={"path": path})
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- helpers for CLI cp/rm/ls --------------------------------------------

    def cp(self, src_locator: str, src_path: str, dst_locator: str, dst_path: str) -> dict[str, Any]:
        r = self._http.post(
            f"/v1/volumes/{src_locator}/copy",
            json={
                "source_path": src_path,
                "destination_volume_id": dst_locator,
                "destination_path": dst_path,
            },
        )
        r.raise_for_status()
        return r.json()

    # -- public object URL ----------------------------------------------------

    def object_url(self, locator: str, path: str) -> str:
        return f"{self._base}/objects/{locator}/{path.lstrip('/')}"
