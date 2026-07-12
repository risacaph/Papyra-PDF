from __future__ import annotations

from enum import StrEnum

from pydantic import Field, SecretStr

from stirling.models import ApiModel

from .documents import PageText


class AiProvider(StrEnum):
    """The AI provider backing an on-demand capability.

    ``custom`` is any OpenAI-compatible endpoint (self-hosted Ollama, vLLM,
    LM Studio, ...) reached through a configured base URL.
    """

    openai = "openai"
    anthropic = "anthropic"
    deepseek = "deepseek"
    custom = "custom"


class ProviderConfig(ApiModel):
    """Per-request AI provider selection and credentials.

    Supplied by the backend from server-side settings so the provider and key
    can change without restarting the engine. ``api_key`` is optional for
    self-hosted endpoints that require no auth; ``base_url`` is required for the
    ``custom`` provider and ignored otherwise.
    """

    provider: AiProvider
    model: str = Field(min_length=1)
    api_key: SecretStr | None = None
    base_url: str | None = None


class SummarizeRequest(ApiModel):
    """Summarize one document from its supplied page text.

    The caller sends the page text inline (no ingestion or RAG step).
    ``provider`` is optional: when omitted the engine falls back to its own
    configured smart model.
    """

    file_name: str = Field(min_length=1)
    pages: list[PageText] = Field(default_factory=list)
    provider: ProviderConfig | None = None
    max_words: int = Field(default=250, ge=20, le=2000)


class SummarizeResponse(ApiModel):
    """Terminal summary result.

    ``summary`` is a faithful prose summary; ``key_points`` is a short list of
    the document's most important facts. This is a plain answer from a dedicated
    endpoint — it carries no ``outcome`` discriminator.
    """

    summary: str = Field(default="")
    key_points: list[str] = Field(default_factory=list)
