"""
Base adapter interface for all job source ingestion adapters.
Every adapter must implement fetch() and normalize().
"""
from abc import ABC, abstractmethod


class JobSourceAdapter(ABC):
    """
    Abstract base class for all job source adapters.

    Subclasses must:
    - Set `source_name` as a class attribute.
    - Implement `fetch(config)` returning a list of raw dicts from the source.
    - Implement `normalize(raw)` mapping one raw dict to the internships schema.
    """
    source_name: str

    @abstractmethod
    def fetch(self, config: dict) -> list[dict]:
        """
        Fetch raw items from this source using the provided config dict.
        No normalization here — return exactly what the source returns.
        """

    @abstractmethod
    def normalize(self, raw: dict) -> dict:
        """
        Map one raw item to the internships table schema.
        Return a dict with keys matching the internships columns.
        Do NOT include company_id or dedup_key — the orchestrator adds those.
        """
