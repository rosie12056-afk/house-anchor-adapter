import json
import os


class AnchorMemory:
    def __init__(self, db_path):
        self.path = os.path.join(db_path, "fake-anchor.json")
        os.makedirs(db_path, exist_ok=True)
        if not os.path.exists(self.path):
            self._write({})

    def _read(self):
        with open(self.path, "r", encoding="utf-8") as handle:
            return json.load(handle)

    def _write(self, value):
        with open(self.path, "w", encoding="utf-8") as handle:
            json.dump(value, handle)

    def count(self):
        return len(self._read())

    def store(self, memory_id, text, tag="general", tier="long", emotion_score=0.5, context=""):
        records = self._read()
        records[memory_id] = {"memory_id": memory_id, "text": text, "tag": tag, "tier": tier, "emotion_score": emotion_score, "context": context}
        self._write(records)
        return memory_id

    def search(self, query, n_results=5, tag=None, **kwargs):
        records = [value for value in self._read().values() if query.lower() in value["text"].lower() and (tag is None or value["tag"] == tag)]
        return [{"memory_id": value["memory_id"], "tag": value["tag"], "snippet": value["text"], "score": 0.0} for value in records[:n_results]]
