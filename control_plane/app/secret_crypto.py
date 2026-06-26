from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets

from .config import settings


class SecretCipher:
    def _key_bytes(self) -> bytes:
        key_material = settings.secret_encryption_key.strip()
        if not key_material:
            raise RuntimeError("BOXTY_SECRET_ENCRYPTION_KEY must be configured to store secrets")
        return hashlib.sha256(key_material.encode("utf-8")).digest()

    @staticmethod
    def _xor_keystream(payload: bytes, key: bytes, nonce: bytes) -> bytes:
        output = bytearray()
        counter = 0
        offset = 0
        while offset < len(payload):
            block = hashlib.sha256(key + nonce + counter.to_bytes(8, "big")).digest()
            chunk = payload[offset : offset + len(block)]
            output.extend(byte ^ mask for byte, mask in zip(chunk, block))
            offset += len(chunk)
            counter += 1
        return bytes(output)

    def encrypt_env_vars(self, env_vars: dict[str, str]) -> str:
        key = self._key_bytes()
        payload = json.dumps(env_vars, sort_keys=True).encode("utf-8")
        nonce = secrets.token_bytes(16)
        ciphertext = self._xor_keystream(payload, key, nonce)
        tag = hmac.new(key, nonce + ciphertext, hashlib.sha256).digest()
        return base64.urlsafe_b64encode(nonce + tag + ciphertext).decode("utf-8")

    def decrypt_env_vars(self, encrypted_env_vars: str) -> dict[str, str]:
        key = self._key_bytes()
        raw = base64.urlsafe_b64decode(encrypted_env_vars.encode("utf-8"))
        if len(raw) < 48:
            raise RuntimeError("encrypted secret payload is invalid")
        nonce = raw[:16]
        tag = raw[16:48]
        ciphertext = raw[48:]
        expected = hmac.new(key, nonce + ciphertext, hashlib.sha256).digest()
        if not hmac.compare_digest(tag, expected):
            raise RuntimeError("secret payload integrity check failed")
        payload = self._xor_keystream(ciphertext, key, nonce)
        data = json.loads(payload.decode("utf-8"))
        return {str(key): str(value) for key, value in data.items()}


secret_cipher = SecretCipher()
