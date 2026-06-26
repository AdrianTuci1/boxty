from __future__ import annotations

from typing import Any

import httpx


class DatabasesClient:
    def __init__(self, http: httpx.Client, base: str) -> None:
        self._http = http
        self._base = base

    # -- list / create / delete -----------------------------------------------

    def list(self) -> list[dict[str, Any]]:
        r = self._http.get("/api/databases")
        r.raise_for_status()
        return r.json()

    def create(
        self,
        name: str,
        pk_name: str,
        sk_name: str = "",
        gsi_name: str = "",
        gsi_pk_name: str = "",
        gsi_sk_name: str = "",
    ) -> dict[str, Any]:
        payload = {
            "name": name,
            "pkName": pk_name,
            "skName": sk_name,
            "gsiName": gsi_name,
            "gsiPkName": gsi_pk_name,
            "gsiSkName": gsi_sk_name,
        }
        r = self._http.post("/api/databases", json=payload)
        r.raise_for_status()
        return r.json()

    def delete(self, locator: str) -> bool:
        r = self._http.delete(f"/api/databases/{locator}")
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- items ----------------------------------------------------------------

    def list_items(self, locator: str) -> list[dict[str, Any]]:
        r = self._http.get(f"/api/databases/{locator}/items")
        r.raise_for_status()
        return r.json()

    def put_item(self, locator: str, value: dict[str, Any]) -> dict[str, Any]:
        payload = {"value": value}
        r = self._http.post(f"/api/databases/{locator}/items", json=payload)
        r.raise_for_status()
        return r.json()

    def delete_item(self, locator: str, pk: str, sk: str = "") -> bool:
        params = {"pk": pk, "sk": sk}
        r = self._http.delete(f"/api/databases/{locator}/items", params=params)
        r.raise_for_status()
        return r.json().get("deleted", False)

    # -- query ----------------------------------------------------------------

    def query(
        self,
        locator: str,
        pk: str | None = None,
        sk: str | None = None,
        sk_begins_with: str | None = None,
        sk_from: str | None = None,
        sk_to: str | None = None,
        gsi_pk: str | None = None,
        gsi_sk: str | None = None,
        gsi_sk_begins_with: str | None = None,
        gsi_sk_from: str | None = None,
        gsi_sk_to: str | None = None,
        limit: int | None = None,
    ) -> list[dict[str, Any]]:
        payload: dict[str, Any] = {}
        if pk is not None:
            payload["pk"] = pk
        if sk is not None:
            payload["sk"] = sk
        if sk_begins_with is not None:
            payload["skBeginsWith"] = sk_begins_with
        if sk_from is not None:
            payload["skFrom"] = sk_from
        if sk_to is not None:
            payload["skTo"] = sk_to
        if gsi_pk is not None:
            payload["gsiPk"] = gsi_pk
        if gsi_sk is not None:
            payload["gsiSk"] = gsi_sk
        if gsi_sk_begins_with is not None:
            payload["gsiSkBeginsWith"] = gsi_sk_begins_with
        if gsi_sk_from is not None:
            payload["gsiSkFrom"] = gsi_sk_from
        if gsi_sk_to is not None:
            payload["gsiSkTo"] = gsi_sk_to
        if limit is not None:
            payload["limit"] = limit
        r = self._http.post(f"/api/databases/{locator}/query", json=payload)
        r.raise_for_status()
        return r.json()
