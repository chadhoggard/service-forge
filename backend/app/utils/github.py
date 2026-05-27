import re
from urllib.parse import urlparse


def parse_github_repo(repo_url: str) -> tuple[str, str]:
    """
    Parse (owner, repo) from a GitHub URL.

    Supports:
      https://github.com/owner/repo
      https://github.com/owner/repo.git
      git@github.com:owner/repo.git
      ssh://git@github.com/owner/repo.git
    """
    url = repo_url.strip().rstrip("/")

    # SSH shorthand: git@github.com:owner/repo[.git]
    ssh_match = re.match(r"git@github\.com:([^/]+)/([^/]+?)(?:\.git)?$", url)
    if ssh_match:
        return ssh_match.group(1), ssh_match.group(2)

    # SSH with protocol: ssh://git@github.com/owner/repo[.git]
    ssh_proto_match = re.match(r"ssh://git@github\.com/([^/]+)/([^/]+?)(?:\.git)?$", url)
    if ssh_proto_match:
        return ssh_proto_match.group(1), ssh_proto_match.group(2)

    # HTTPS
    parsed = urlparse(url)
    if parsed.hostname not in ("github.com", "www.github.com"):
        raise ValueError(f"Not a GitHub URL: {repo_url!r}")

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        raise ValueError(f"Cannot parse owner and repo from: {repo_url!r}")
    if len(parts) > 2:
        raise ValueError(
            f"URL has extra path segments — expected /owner/repo format: {repo_url!r}"
        )

    owner = parts[0]
    repo = parts[1].removesuffix(".git")
    return owner, repo
