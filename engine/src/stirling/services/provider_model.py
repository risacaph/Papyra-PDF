from __future__ import annotations

from pydantic_ai.models import Model
from pydantic_ai.models.anthropic import AnthropicModel
from pydantic_ai.models.openai import OpenAIChatModel
from pydantic_ai.providers.anthropic import AnthropicProvider
from pydantic_ai.providers.deepseek import DeepSeekProvider
from pydantic_ai.providers.openai import OpenAIProvider

from stirling.contracts.summarize import AiProvider, ProviderConfig


def build_provider_model(config: ProviderConfig) -> Model:
    """Construct a pydantic-ai model from an explicit provider selection.

    Used for on-demand capabilities whose provider and key come from backend
    settings rather than engine startup env, so the model is built per request.
    OpenAI, DeepSeek and self-hosted endpoints all speak the chat-completions
    API (``OpenAIChatModel``), which every OpenAI-compatible server implements;
    Anthropic uses its native model.
    """
    api_key = config.api_key.get_secret_value() if config.api_key else None

    if config.provider is AiProvider.anthropic:
        return AnthropicModel(config.model, provider=AnthropicProvider(api_key=api_key or ""))
    if config.provider is AiProvider.deepseek:
        return OpenAIChatModel(config.model, provider=DeepSeekProvider(api_key=api_key or ""))
    if config.provider is AiProvider.custom:
        if not config.base_url:
            raise ValueError("A base URL is required for a self-hosted (custom) provider")
        return OpenAIChatModel(
            config.model,
            provider=OpenAIProvider(base_url=config.base_url, api_key=api_key or "not-needed"),
        )
    return OpenAIChatModel(config.model, provider=OpenAIProvider(api_key=api_key or ""))
