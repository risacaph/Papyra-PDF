from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from stirling.agents import SummarizeAgent
from stirling.api.dependencies import get_summarize_agent
from stirling.contracts import SummarizeRequest, SummarizeResponse

router = APIRouter(prefix="/api/v1/documents/summarize", tags=["summarize"])


@router.post("", response_model=SummarizeResponse)
async def summarize_document(
    request: SummarizeRequest,
    agent: Annotated[SummarizeAgent, Depends(get_summarize_agent)],
) -> SummarizeResponse:
    """Summarize a document from its supplied page text.

    The caller sends the page text inline, so no per-user document storage is
    touched here — the request is self-contained.
    """
    return await agent.summarize(request)
