from __future__ import annotations

from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from stirling.api import app
from stirling.api.dependencies import get_summarize_agent
from stirling.contracts import SummarizeRequest, SummarizeResponse


class StubSummarizeAgent:
    """Stands in for SummarizeAgent so route tests don't call a model."""

    def __init__(self, response: SummarizeResponse) -> None:
        self._response = response

    async def summarize(self, _request: SummarizeRequest) -> SummarizeResponse:
        return self._response


@pytest.fixture
def summarize_client() -> Iterator[TestClient]:
    app.dependency_overrides[get_summarize_agent] = lambda: StubSummarizeAgent(
        SummarizeResponse(summary="A short summary.", key_points=["First point", "Second point"])
    )
    try:
        yield TestClient(app)
    finally:
        app.dependency_overrides.pop(get_summarize_agent, None)


def test_summarize_returns_summary(summarize_client: TestClient) -> None:
    response = summarize_client.post(
        "/api/v1/documents/summarize",
        json={
            "fileName": "report.pdf",
            "pages": [{"pageNumber": 1, "text": "Quarterly results were strong."}],
        },
    )
    assert response.status_code == 200
    assert response.json() == {
        "summary": "A short summary.",
        "keyPoints": ["First point", "Second point"],
    }


def test_summarize_accepts_provider_config(summarize_client: TestClient) -> None:
    response = summarize_client.post(
        "/api/v1/documents/summarize",
        json={
            "fileName": "report.pdf",
            "pages": [],
            "provider": {
                "provider": "openai",
                "model": "gpt-4o-mini",
                "apiKey": "sk-test",
            },
            "maxWords": 120,
        },
    )
    assert response.status_code == 200


def test_summarize_accepts_empty_pages(summarize_client: TestClient) -> None:
    response = summarize_client.post(
        "/api/v1/documents/summarize",
        json={"fileName": "blank.pdf", "pages": []},
    )
    assert response.status_code == 200


def test_summarize_rejects_empty_file_name(summarize_client: TestClient) -> None:
    response = summarize_client.post(
        "/api/v1/documents/summarize",
        json={"fileName": "", "pages": []},
    )
    assert response.status_code == 422


def test_summarize_rejects_out_of_range_max_words(summarize_client: TestClient) -> None:
    response = summarize_client.post(
        "/api/v1/documents/summarize",
        json={"fileName": "report.pdf", "pages": [], "maxWords": 5},
    )
    assert response.status_code == 422
