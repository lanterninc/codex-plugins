"""Build a portal ZIP from an explicit checkout of lanterninc/codex-plugins.

Requires Python 3.11+. No third-party Python dependencies or network calls.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
import shutil
import struct
import subprocess
import tempfile
import tomllib
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo


ROOT = Path(__file__).resolve().parent.parent
TEMPLATES = ROOT / "export" / "chatgpt"
REPOSITORY = "https://github.com/lanterninc/codex-plugins"
MCP_URL = "https://agent.lantern.is/agent/mcp"
SKILLS = (
    "ai-visibility", "brands", "citations", "competitors",
    "product-quality", "website-analysis",
)
# The private source repository supplies an additional leak policy. The public
# export is scanned before publishing and does not disclose that private policy.
TOKEN_POLICY = ROOT / "export" / "private-tokens.json"
FORBIDDEN = json.loads(TOKEN_POLICY.read_text()) if TOKEN_POLICY.is_file() else []


def require(condition, message):
    if not condition:
        raise ValueError(message)


def git(source, *args):
    return subprocess.check_output(
        ["git", "-C", str(source), *args], text=True
    ).strip()


def read_file(path):
    require(not path.is_symlink(), f"Symlink not allowed: {path}")
    return path.read_bytes()


def encode_json(value):
    return (json.dumps(value, indent=2, ensure_ascii=False) + "\n").encode()


def build(source, output):
    source = source.resolve()
    require(git(source, "remote", "get-url", "origin").removesuffix(".git") in (
        REPOSITORY, "git@github.com:lanterninc/codex-plugins",
    ), "Source must be a checkout of lanterninc/codex-plugins")
    require(not git(source, "status", "--porcelain", "--untracked-files=all"),
            "Source checkout must be clean so SOURCE.json identifies the input")
    source_commit = git(source, "rev-parse", "HEAD")
    tracked = set(git(source, "ls-files", "-z").split("\0"))
    plugin = source / "plugins" / "lantern"
    original = json.loads(read_file(plugin / ".codex-plugin" / "plugin.json"))
    require(original["name"] == "lantern" and original["repository"] == REPOSITORY,
            "Unexpected source plugin identity")
    version = original["version"]
    require(re.fullmatch(r"[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?", version),
            "Expected a semantic version")
    original_mcp = json.loads(read_file(plugin / ".mcp.json"))
    require(original_mcp == {"mcpServers": {"lantern": {"url": MCP_URL}}},
            "MCP configuration changed; review it before packaging")

    metadata = json.loads(read_file(TEMPLATES / "metadata.json"))
    interface = {**original["interface"], **metadata["interface"]}
    for field, limit in (("displayName", 30), ("shortDescription", 30),
                         ("longDescription", 4000), ("developerName", 80)):
        require(0 < len(interface[field]) <= limit, f"Invalid {field} length")
    require(interface["category"] == "Data & Analytics", "Unexpected category")
    for field in ("websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"):
        require(interface[field].startswith("https://") and len(interface[field]) <= 1024,
                f"Invalid listing URL: {field}")
    prompts = interface["defaultPrompt"]
    require(isinstance(prompts, list) and 1 <= len(prompts) <= 3
            and all(isinstance(p, str) and 0 < len(p) <= 128 and "\n" not in p for p in prompts)
            and len(set(prompts)) == len(prompts), "Invalid starter prompts")
    cases = metadata["review"]["test_cases"]
    require(len(cases["positive"]) == 5 and len(cases["negative"]) == 3,
            "MCP review needs five positive and three negative cases")
    for group, entries in cases.items():
        for case in entries:
            fields = ["description", "prompt"]
            if group == "positive":
                fields += ["tools_triggered", "expected_behavior"]
            require(all(isinstance(case.get(f), str) and case[f].strip() for f in fields),
                    "Incomplete review case")

    manifest = {key: original[key] for key in (
        "name", "version", "license", "homepage", "repository", "keywords",
    )}
    manifest.update({
        "$schema": "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
        "description": "Read Lantern AI visibility, citations, competitor comparisons, "
                       "AI shopping product appearances, and website readiness in ChatGPT and Codex.",
        "author": {"name": interface["developerName"], "url": "https://lantern.is"},
        "extensions": {"com.openai": {
            **metadata, "interface": interface,
            "onboardingSkill": "./skills/brands/SKILL.md",
        }},
    })
    mcp = {
        "$schema": "https://agent-plugins.org/schemas/1.0.0/mcp.schema.json",
        "mcpServers": {"lantern": {
            "type": "streamable-http", "url": MCP_URL,
            "extensions": {"com.openai": {"auth": {
                "type": "oauth", "client": {"mode": "dcr"},
                "baseScopes": ["read:findings", "read:rankings"],
                "defaultScopes": ["read:findings", "read:rankings"],
            }}},
        }},
    }
    files = {
        "plugin.json": encode_json(manifest), "mcp.json": encode_json(mcp),
        "README.md": read_file(TEMPLATES / "README.md"),
        "LICENSE": read_file(source / "LICENSE"),
        "assets/icon.png": read_file(TEMPLATES / "assets" / "icon.png"),
    }
    icon = files["assets/icon.png"]
    require(icon[:8] == b"\x89PNG\r\n\x1a\n" and len(icon) <= 5 * 1024 * 1024,
            "Expected a PNG icon no larger than 5 MiB")
    width, height = struct.unpack(">II", icon[16:24])
    require(256 <= width <= 4096 and width == height, "Expected a square 256–4096px icon")
    hashes = {}
    for skill in SKILLS:
        folder = plugin / "skills" / skill
        require(folder.is_dir() and not folder.is_symlink(), f"Missing skill: {skill}")
        for path in sorted(folder.rglob("*")):
            # A clean worktree can still contain ignored local files (including
            # credentials). Only committed package files belong in the export.
            if path.relative_to(source).as_posix() not in tracked:
                continue
            require(not path.is_symlink(), f"Symlink not allowed: {path}")
            if path.is_file():
                relative = path.relative_to(plugin).as_posix()
                files[relative] = read_file(path)
                hashes[relative] = hashlib.sha256(files[relative]).hexdigest()
        frontmatter = files[f"skills/{skill}/SKILL.md"].decode().split("---", 2)
        require(len(frontmatter) == 3 and frontmatter[0] == ""
                and f"name: {skill}\n" in frontmatter[1]
                and "description: " in frontmatter[1], f"Invalid skill: {skill}")

    agent_bytes = read_file(source / ".codex" / "agents" / "lantern-analyst.toml")
    agent = tomllib.loads(agent_bytes.decode())
    require(agent["name"] == "lantern-analyst" and agent["sandbox_mode"] == "read-only",
            "Unexpected source analyst persona")
    files["skills/lantern-analyst/SKILL.md"] = (
        "---\nname: lantern-analyst\n"
        "description: Use when the user wants a combined Lantern report covering AI visibility, "
        "citations, competitors, products, website readiness, or AI referral traffic.\n---\n\n"
        "# Lantern analyst\n\n" + agent["developer_instructions"].strip() + "\n\n"
        "Consult the relevant sibling skills for current metric definitions and limitations. "
        "The findings.* references identify Lantern's findings tools; hosts may expose them "
        "under a findings-interpreter namespace or normalize punctuation. Match the operation "
        "name and inspect its actual schema before calling it. Use only the read tools "
        "required for the user's question.\n"
    ).encode()
    files["SOURCE.json"] = encode_json({
        "repository": REPOSITORY, "commit": source_commit,
        "plugin_path": "plugins/lantern", "skill_sha256": hashes,
        "analyst_source": ".codex/agents/lantern-analyst.toml",
        "analyst_sha256": hashlib.sha256(agent_bytes).hexdigest(),
        "icon_source": "https://lantern.is/icon.svg",
        "icon_note": "Existing Lantern vector icon rendered to a 512px PNG without design changes.",
    })
    for name, data in files.items():
        require(not any(token.encode() in data or token in name for token in FORBIDDEN),
                f"Private content found in {name}")

    output = output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    archive = output / f"lantern-chatgpt-{version}.zip"
    # Fixed timestamps, sorted entries, explicit modes, and no enclosing repo files.
    with tempfile.TemporaryDirectory(prefix="lantern-package-") as temporary:
        candidate = Path(temporary) / "plugin.zip"
        with ZipFile(candidate, "w", compression=ZIP_DEFLATED) as bundle:
            for name, data in sorted(files.items()):
                info = ZipInfo(f"lantern/{name}", date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = ZIP_DEFLATED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                bundle.writestr(info, data)
        # Verify the final archive, including all component bytes and hidden entries.
        with ZipFile(candidate) as bundle:
            require(bundle.testzip() is None, "ZIP integrity check failed")
            require(sorted(bundle.namelist()) == sorted(f"lantern/{p}" for p in files),
                    "Unexpected archive contents")
            for name, data in files.items():
                require(bundle.read(f"lantern/{name}") == data, f"Archive mismatch: {name}")
        shutil.copyfile(candidate, archive)
    checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
    archive.with_suffix(".zip.sha256").write_text(f"{checksum}  {archive.name}\n")
    print(f"Built {archive}\nSource: {REPOSITORY}@{source_commit}\n"
          f"Validated {len(files)} files, 7 skills, 1 OAuth MCP server. SHA-256: {checksum}")
    print("Review remains pending: recorded demo, reviewer account, live case runs, and portal checks.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path, help="Clean checkout of the public codex-plugins repo")
    parser.add_argument("--output", type=Path, default=ROOT / "dist" / "chatgpt")
    args = parser.parse_args()
    build(args.source, args.output)
