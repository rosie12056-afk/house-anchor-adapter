from __future__ import annotations

import argparse
import json
import os
import sys
import traceback


def respond(stream, request_id, ok, result=None, code=None, message=None):
    payload = {"id": request_id, "ok": ok}
    if ok:
        payload["result"] = result
    else:
        payload["error"] = {"code": code or "E_ANCHOR_OPERATION", "message": message or "Anchor operation failed"}
    stream.write(json.dumps(payload, ensure_ascii=False) + "\n")
    stream.flush()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--anchor-root", required=True)
    parser.add_argument("--db-path", required=True)
    args = parser.parse_args()

    protocol_stdout = sys.stdout
    sys.stdout = sys.stderr
    sys.path.insert(0, os.path.abspath(args.anchor_root))
    from anchor_memory import AnchorMemory

    memory = AnchorMemory(db_path=os.path.abspath(args.db_path))
    for line in sys.stdin:
        request = None
        try:
            request = json.loads(line)
            request_id = request.get("id")
            operation = request.get("operation")
            params = request.get("params") or {}
            if operation == "ping":
                result = {"ok": True, "count": memory.count()}
            elif operation == "count":
                result = memory.count()
            elif operation == "store":
                result = memory.store(
                    params["memory_id"],
                    params["text"],
                    tag=params["tag"],
                    tier=params["tier"],
                    emotion_score=params["emotion_score"],
                    context=params.get("context", ""),
                )
            elif operation == "search":
                result = memory.search(
                    params["query"],
                    n_results=params.get("limit", 5),
                    tag=params.get("tag"),
                    associate=params.get("associate", True),
                    hebbian=params.get("learn", False),
                    no_cite=not params.get("learn", False),
                    include_context=False,
                )
            elif operation == "close":
                respond(protocol_stdout, request_id, True, {"closed": True})
                break
            else:
                raise ValueError("unsupported Anchor bridge operation")
            respond(protocol_stdout, request_id, True, result)
        except Exception as error:
            traceback.print_exc(file=sys.stderr)
            respond(protocol_stdout, request.get("id") if isinstance(request, dict) else None, False, code="E_ANCHOR_OPERATION", message=str(error)[:500])


if __name__ == "__main__":
    main()
