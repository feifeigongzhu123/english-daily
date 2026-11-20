#!/usr/bin/env python3
"""Upload the current voice pack and app changes to GitHub, one commit on main."""

import argparse
import base64
import hashlib
import json
import sys
import time
from pathlib import Path

import requests

ROOT = Path(r"D:\AI\ZCode\english-daily")
TOKEN_FILE = Path.home() / ".zcode" / "secrets" / "english-daily-token.txt"
OWNER = "feifeigongzhu123"
REPO = "english-daily"
MAIN = "main"
PROGRESS = ROOT / "audio" / "voice-progress.json"
PENDING = ROOT / "audio" / "voice-pending.json"
EXCLUDE_PARTS = {"jenny", "guy", "sonia"}
TOKEN = TOKEN_FILE.read_text(encoding="utf-8").strip()

HEADERS = {
    "Authorization": "Bearer " + TOKEN,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "english-daily-uploader",
}
REST = "https://api.github.com"
GRAPHQL = "https://api.github.com/graphql"


def rest(method, path, retries=7, **kwargs):
    for attempt in range(retries):
        try:
            r = requests.request(method, REST + path, headers=HEADERS, timeout=120, **kwargs)
        except requests.RequestException:
            time.sleep(min(30, 2 ** attempt))
            continue
        if r.status_code in (403, 408, 413, 429, 499, 500, 502, 503, 504, 520):
            wait = min(60, 2 ** attempt)
            print(f"retry {method} {path} in {wait}s ({r.status_code})", flush=True)
            time.sleep(wait)
            continue
        if r.status_code >= 400:
            raise RuntimeError(f"{method} {path} -> {r.status_code}: {r.text[:600]}")
        return r.json() if r.text else {}
    raise RuntimeError("request failed " + path)


def graphql(query, variables, retries=7):
    for attempt in range(retries):
        try:
            r = requests.post(GRAPHQL, headers=HEADERS, json={"query": query, "variables": variables}, timeout=120)
        except requests.RequestException:
            time.sleep(min(30, 2 ** attempt))
            continue
        if r.status_code in (403, 408, 413, 429, 499, 500, 502, 503, 504, 520):
            wait = min(60, 2 ** attempt)
            print(f"retry graphql in {wait}s ({r.status_code})", flush=True)
            time.sleep(wait)
            continue
        if r.status_code >= 400:
            raise RuntimeError(f"graphql {r.status_code}: {r.text[:600]}")
        try:
            data = r.json()
        except ValueError:
            time.sleep(min(30, 2 ** attempt))
            continue
        if data.get("errors"):
            raise RuntimeError("graphql errors: " + str(data["errors"])[:800])
        return data["data"]
    raise RuntimeError("graphql failed")


def blob_sha(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def collect():
    files = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        parts = set(rel.parts)
        if ".git" in parts or "__pycache__" in parts:
            continue
        if parts.intersection(EXCLUDE_PARTS):
            continue
        if path.name in {"upload_v180.py", "upload_v181.py"}:
            continue
        if path.suffix in {".zip", ".log"}:
            continue
        data = path.read_bytes()
        if rel.as_posix() == ".nojekyll" and not data:
            data = b"\n"
        files.append({"path": rel.as_posix(), "data": data, "sha": blob_sha(data)})
    files.sort(key=lambda item: item["path"])
    return files


MUTATION = """
mutation($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) {
    commit { oid }
  }
}
"""


def commit(branch, head, additions, message):
    variables = {
        "input": {
            "branch": {"repositoryNameWithOwner": f"{OWNER}/{REPO}", "branchName": branch},
            "message": {"headline": message},
            "fileChanges": {"additions": additions},
            "expectedHeadOid": head,
        }
    }
    result = graphql(MUTATION, variables)
    return result["createCommitOnBranch"]["commit"]["oid"]


def rollback(book_id):
    if not book_id:
        return
    progress = json.loads(PROGRESS.read_text(encoding="utf-8"))
    progress["completed"] = [x for x in progress.get("completed", []) if x != book_id]
    PROGRESS.write_text(json.dumps(progress, ensure_ascii=False), encoding="utf-8")
    PENDING.write_text(json.dumps({"book": book_id}, ensure_ascii=False), encoding="utf-8")
    print(f"rolled back progress for {book_id}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--book", default="")
    args = parser.parse_args()
    pending = json.loads(PENDING.read_text(encoding="utf-8")) if PENDING.exists() else {}
    book_id = args.book or pending.get("book", "")
    branch = "upload-voice-" + time.strftime("%Y%m%d-%H%M%S")

    ref = rest("GET", f"/repos/{OWNER}/{REPO}/git/ref/heads/{MAIN}")
    main_head = ref["object"]["sha"]
    head_commit = rest("GET", f"/repos/{OWNER}/{REPO}/git/commits/{main_head}")
    tree = rest("GET", f"/repos/{OWNER}/{REPO}/git/trees/{head_commit['tree']['sha']}?recursive=1")
    remote = {e["path"]: e.get("sha") for e in tree.get("tree", []) if e.get("type") == "blob"}
    changed = [f for f in collect() if remote.get(f["path"]) != f["sha"]]
    print(f"book={book_id} changed={len(changed)} main={main_head[:10]}", flush=True)
    if not changed:
        if PENDING.exists():
            PENDING.unlink()
        print("NOTHING_TO_UPLOAD", flush=True)
        return 0

    try:
        rest("DELETE", f"/repos/{OWNER}/{REPO}/git/refs/heads/{branch}")
    except Exception:
        pass
    rest("POST", f"/repos/{OWNER}/{REPO}/git/refs", json={"ref": f"refs/heads/{branch}", "sha": main_head})
    head = main_head
    batch_size = 50
    total = (len(changed) + batch_size - 1) // batch_size
    try:
        for index in range(total):
            batch = changed[index * batch_size:(index + 1) * batch_size]
            additions = [{
                "path": item["path"],
                "contents": base64.b64encode(item["data"]).decode("ascii"),
            } for item in batch]
            head = commit(branch, head, additions, f"英词通 v1.9.0: {book_id} audio ({index + 1}/{total})")
            print(f"batch {index + 1}/{total} -> {head[:10]}", flush=True)
            time.sleep(0.7)
        rest("PATCH", f"/repos/{OWNER}/{REPO}/git/refs/heads/{MAIN}", json={"sha": head, "force": False})
        rest("DELETE", f"/repos/{OWNER}/{REPO}/git/refs/heads/{branch}")
    except Exception:
        rollback(book_id)
        raise
    if PENDING.exists():
        PENDING.unlink()
    print(f"UPLOADED {head}", flush=True)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print("UPLOAD_FAILED", exc, file=sys.stderr, flush=True)
        raise SystemExit(1)
