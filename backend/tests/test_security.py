import base64
import os

import pytest

from app.security import TokenCipher, hash_state, new_state


def test_token_cipher_round_trip():
    key = base64.urlsafe_b64encode(os.urandom(32)).decode()
    cipher = TokenCipher(key)
    encrypted = cipher.encrypt("secret-access-token")

    assert encrypted != "secret-access-token"
    assert cipher.decrypt(encrypted) == "secret-access-token"


def test_token_cipher_rejects_wrong_key():
    first = TokenCipher(base64.urlsafe_b64encode(os.urandom(32)).decode())
    second = TokenCipher(base64.urlsafe_b64encode(os.urandom(32)).decode())

    with pytest.raises(Exception):
        second.decrypt(first.encrypt("secret"))


def test_oauth_state_is_random_and_hashable():
    first = new_state()
    second = new_state()

    assert first != second
    assert hash_state(first) != first
    assert hash_state(first) == hash_state(first)

