from __future__ import annotations

import pytest
from pydantic import SecretStr
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel

from stirling.contracts import AiProvider, ProviderConfig
from stirling.services import build_provider_model


def test_openai_builds_openai_chat_model() -> None:
    model = build_provider_model(
        ProviderConfig(provider=AiProvider.openai, model="gpt-4o-mini", api_key=SecretStr("sk-test"))
    )
    assert isinstance(model, OpenAIChatModel)


def test_anthropic_builds_anthropic_model() -> None:
    model = build_provider_model(
        ProviderConfig(provider=AiProvider.anthropic, model="claude-haiku-4-5", api_key=SecretStr("sk-test"))
    )
    assert isinstance(model, AnthropicModel)


def test_deepseek_builds_openai_chat_model() -> None:
    model = build_provider_model(
        ProviderConfig(provider=AiProvider.deepseek, model="deepseek-chat", api_key=SecretStr("sk-test"))
    )
    assert isinstance(model, OpenAIChatModel)


def test_custom_builds_openai_chat_model_with_base_url() -> None:
    model = build_provider_model(
        ProviderConfig(
            provider=AiProvider.custom,
            model="llama3.1",
            base_url="http://localhost:11434/v1",
        )
    )
    assert isinstance(model, OpenAIChatModel)


def test_custom_without_base_url_raises() -> None:
    with pytest.raises(ValueError, match="base URL"):
        build_provider_model(ProviderConfig(provider=AiProvider.custom, model="llama3.1"))
