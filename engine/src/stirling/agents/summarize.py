from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.output import NativeOutput

from stirling.contracts import PageText, SummarizeRequest, SummarizeResponse
from stirling.services import AppRuntime, build_provider_model


def _system_prompt(max_words: int) -> str:
    return (
        "You summarize documents faithfully and concisely.\n"
        "\n"
        "Rules:\n"
        f"- Write a clear prose summary of at most {max_words} words.\n"
        "- Capture the document's purpose and its most important points.\n"
        "- Also return a short list of key points (notable facts, decisions or figures).\n"
        "- Stay strictly faithful to the text; never invent details.\n"
        "- The document may be in any language; summarize in that same language."
    )


def _format_pages(pages: list[PageText]) -> str:
    if not pages:
        return "(no extractable text)"
    return "\n\n".join(f"[Page {page.page_number}]\n{page.text}" for page in pages)


class SummarizeAgent:
    """Produces a concise, faithful summary of a document from its page text.

    The model is chosen per request: when the request carries an explicit
    provider config (from backend settings) it is built on the fly, otherwise
    the engine's configured smart model is used.
    """

    def __init__(self, runtime: AppRuntime) -> None:
        self.runtime = runtime

    async def summarize(self, request: SummarizeRequest) -> SummarizeResponse:
        model = build_provider_model(request.provider) if request.provider else self.runtime.smart_model
        agent = Agent(
            model=model,
            output_type=NativeOutput(SummarizeResponse),
            system_prompt=_system_prompt(request.max_words),
            model_settings=self.runtime.smart_model_settings,
        )
        prompt = (
            f"Document file name: {request.file_name}\n\n"
            f"Document content:\n{_format_pages(request.pages)}"
        )
        result = await agent.run(prompt)
        return result.output
