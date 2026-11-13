#!/usr/bin/env python3
"""Upload the static app to GitHub using the GitHub REST API.

Usage:
    set GITHUB_TOKEN=ghp_xxx
    python scripts/upload_github.py --repo english-daily --pages

Requires a classic token with `repo` scope. The token is read from the
environment and is never written to disk.
"""

import argparse
import base64
import os
import sys
import time
from pathlib import Path
from urllib.parse import quote

import requests

API = "https://api.github.com"
ROOT = Path(__file__).resolve().parent.parent
EXCLUDE_DIRS = {".git", "__pycache__", "node_modules"}
EXCLUDE_SUFFIXES = {".zip", ".log"}


def headers(token: str) -> dict:
    return {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "english-daily-uploader",
    }


def request(method: str, path: str, token: str, **kwargs):
    response = requests.request(method, API + path, headers=headers(token), timeout=60, **kwargs)
    if response.status_code >= 400:
        raise RuntimeError(f"{method} {path} -> {response.status_code}: {response.text[:500]}")
    if response.text:
        return response.json()
    return {}


def collect_files():
    files = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if any(part in EXCLUDE_DIRS for part in relative.parts):
            continue
        if any(str(relative).endswith(suffix) for suffix in EXCLUDE_SUFFIXES):
            continue
        files.append((relative.as_posix(), path))
    return sorted(files, key=lambda item: item[0])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default="english-daily", help="repository name")
    parser.add_argument("--description", default="英词通 · 外研版初中、高中英语词汇听读 PWA")
    parser.add_argument("--private", action="store_true", help="create a private repository")
    parser.add_argument("--pages", action="store_true", help="enable GitHub Pages after upload")
    args = parser.parse_args()

    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        print("GITHUB_TOKEN is not set.", file=sys.stderr)
        print("Create a classic token with repo scope and set it for this command.", file=sys.stderr)
        return 2

    user = request("GET", "/user", token)
    owner = user["login"]
    repo = args.repo
    print(f"Uploading to {owner}/{repo} ...")

    response = requests.post(
        API + "/user/repos",
        headers=headers(token),
        json={
            "name": repo,
            "description": args.description,
            "private": bool(args.private),
            "auto_init": False,
            "has_issues": True,
            "has_wiki": False,
            "has_projects": False,
        },
        timeout=60,
    )
    if response.status_code == 422 and "already exists" in response.text:
        print("Repository already exists; reusing it.")
    elif response.status_code != 201:
        raise RuntimeError(f"create repo -> {response.status_code}: {response.text[:500]}")

    files = collect_files()
    print(f"Uploading {len(files)} files via Contents API ...")

    for index, (relative, path) in enumerate(files, 1):
        content = path.read_bytes()
        if relative == ".nojekyll" and not content:
            content = b"\n"
        encoded = base64.b64encode(content).decode("ascii")
        contents_path = "/repos/{}/{}/contents/{}".format(owner, repo, quote(relative, safe="/"))
        payload = {
            "message": "YingCiTong: add " + relative,
            "content": encoded,
            "branch": "main",
        }

        existing = requests.get(API + contents_path, headers=headers(token), timeout=60)
        if existing.status_code == 200:
            payload["sha"] = existing.json()["sha"]

        result = requests.put(API + contents_path, headers=headers(token), json=payload, timeout=60)
        if result.status_code not in (200, 201):
            raise RuntimeError(f"upload {relative} -> {result.status_code}: {result.text[:500]}")
        print(f"  [{index}/{len(files)}] {relative}")

    time.sleep(2)

    if args.pages:
        pages_response = requests.post(
            API + f"/repos/{owner}/{repo}/pages",
            headers=headers(token),
            json={"source": {"branch": "main", "path": "/"}, "build_type": "legacy"},
            timeout=60,
        )
        if pages_response.status_code in (201, 202, 204):
            print("GitHub Pages requested.")
        elif pages_response.status_code == 409:
            print("GitHub Pages is already configured.")
        else:
            print(f"Pages not enabled automatically ({pages_response.status_code}): {pages_response.text[:300]}")
            print("Open Settings -> Pages and choose main / (root).")

    print("")
    print(f"Repository: https://github.com/{owner}/{repo}")
    print(f"Pages URL:  https://{owner}.github.io/{repo}/")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        print("Upload failed:", error, file=sys.stderr)
        raise SystemExit(1)
