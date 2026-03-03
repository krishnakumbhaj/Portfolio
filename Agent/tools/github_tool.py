"""
GitHub Data Extraction Tool
Fetches profile info, repositories, languages, READMEs from a GitHub account.
Used by the LangGraph agent to answer questions about projects & skills.
"""

import httpx
import os
import json
from dotenv import load_dotenv
from langchain_core.tools import tool

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")          # optional, increases rate limit
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME", "")  # your GitHub username

HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "PortfolioAgent/1.0",
}
if GITHUB_TOKEN:
    HEADERS["Authorization"] = f"Bearer {GITHUB_TOKEN}"

BASE_URL = "https://api.github.com"

# ─────────────────────── internal helpers ────────────────────────

async def _fetch(url: str) -> dict | list | None:
    """Generic async GET with error handling."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(url, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()
        print(f"⚠️ GitHub API {resp.status_code}: {url}")
        return None


async def _get_profile() -> dict:
    """Fetch GitHub user profile."""
    data = await _fetch(f"{BASE_URL}/users/{GITHUB_USERNAME}")
    if not data:
        return {}
    return {
        "name": data.get("name"),
        "bio": data.get("bio"),
        "location": data.get("location"),
        "public_repos": data.get("public_repos"),
        "followers": data.get("followers"),
        "following": data.get("following"),
        "blog": data.get("blog"),
        "html_url": data.get("html_url"),
        "created_at": data.get("created_at"),
        "avatar_url": data.get("avatar_url"),
    }


async def _get_repos(limit: int = 30) -> list[dict]:
    """Fetch public repos sorted by most recently updated."""
    data = await _fetch(
        f"{BASE_URL}/users/{GITHUB_USERNAME}/repos"
        f"?sort=updated&direction=desc&per_page={limit}&type=owner"
    )
    if not data:
        return []
    repos = []
    for r in data:
        repos.append({
            "name": r.get("name"),
            "full_name": r.get("full_name"),
            "description": r.get("description"),
            "html_url": r.get("html_url"),
            "language": r.get("language"),
            "topics": r.get("topics", []),
            "stargazers_count": r.get("stargazers_count"),
            "forks_count": r.get("forks_count"),
            "created_at": r.get("created_at"),
            "updated_at": r.get("updated_at"),
            "homepage": r.get("homepage"),
            "fork": r.get("fork"),
        })
    return repos


async def _get_repo_languages(repo_name: str) -> dict:
    """Fetch language breakdown for a specific repo."""
    data = await _fetch(
        f"{BASE_URL}/repos/{GITHUB_USERNAME}/{repo_name}/languages"
    )
    return data if data else {}


async def _get_repo_readme(repo_name: str) -> str:
    """Fetch the README content (decoded) for a specific repo."""
    import base64
    data = await _fetch(
        f"{BASE_URL}/repos/{GITHUB_USERNAME}/{repo_name}/readme"
    )
    if data and "content" in data:
        try:
            return base64.b64decode(data["content"]).decode("utf-8")
        except Exception:
            return ""
    return ""


async def _get_pinned_repos() -> list[dict]:
    """
    Fetch pinned repos via GitHub GraphQL API.
    Requires GITHUB_TOKEN with read:user scope.
    Falls back to empty list if no token or error.
    """
    if not GITHUB_TOKEN:
        return []

    query = """
    {
      user(login: "%s") {
        pinnedItems(first: 6, types: REPOSITORY) {
          nodes {
            ... on Repository {
              name
              description
              url
              primaryLanguage { name }
              stargazerCount
              forkCount
              repositoryTopics(first: 10) {
                nodes { topic { name } }
              }
            }
          }
        }
      }
    }
    """ % GITHUB_USERNAME

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.github.com/graphql",
                json={"query": query},
                headers=HEADERS,
            )
            if resp.status_code == 200:
                nodes = (
                    resp.json()
                    .get("data", {})
                    .get("user", {})
                    .get("pinnedItems", {})
                    .get("nodes", [])
                )
                return [
                    {
                        "name": n.get("name"),
                        "description": n.get("description"),
                        "url": n.get("url"),
                        "language": (n.get("primaryLanguage") or {}).get("name"),
                        "stars": n.get("stargazerCount"),
                        "forks": n.get("forkCount"),
                        "topics": [
                            t["topic"]["name"]
                            for t in n.get("repositoryTopics", {}).get("nodes", [])
                        ],
                    }
                    for n in nodes
                ]
    except Exception as e:
        print(f"⚠️ Pinned repos fetch error: {e}")
    return []


# ─────────────────────── LangChain Tools ─────────────────────────

@tool
async def get_github_profile() -> str:
    """
    Fetch the GitHub profile information including name, bio, location,
    number of public repos, followers, and profile URL.
    Use this when a visitor asks about the developer's GitHub presence or general info.
    """
    profile = await _get_profile()
    if not profile:
        return "Could not fetch GitHub profile at the moment."
    return json.dumps(profile, indent=2)


@tool
async def get_github_repos() -> str:
    """
    Fetch the list of public GitHub repositories with their names, descriptions,
    languages, topics, stars, and URLs. Sorted by most recently updated.
    Use this when a visitor asks about projects, repos, or what has been built.
    """
    repos = await _get_repos(limit=30)
    if not repos:
        return "Could not fetch repositories at the moment."
    # Filter out forks for a cleaner view
    own_repos = [r for r in repos if not r.get("fork")]
    return json.dumps(own_repos, indent=2)


@tool
async def get_github_repo_details(repo_name: str) -> str:
    """
    Fetch detailed information about a specific GitHub repository including
    its language breakdown and README content.
    Use this when a visitor asks about a specific project in detail.
    Args:
        repo_name: The name of the repository to fetch details for.
    """
    languages = await _get_repo_languages(repo_name)
    readme = await _get_repo_readme(repo_name)

    # Truncate README if too long (keep first 3000 chars)
    if len(readme) > 3000:
        readme = readme[:3000] + "\n\n... [README truncated]"

    result = {
        "repo_name": repo_name,
        "languages": languages,
        "readme": readme,
    }
    return json.dumps(result, indent=2)


@tool
async def get_github_pinned_repos() -> str:
    """
    Fetch the pinned/featured repositories from the GitHub profile.
    These are the projects the developer has chosen to highlight.
    Use this to answer about top/featured/best projects.
    """
    pinned = await _get_pinned_repos()
    if not pinned:
        return "No pinned repos found or GitHub token not configured for GraphQL."
    return json.dumps(pinned, indent=2)


# ─────────────────────── Convenience: all tools list ─────────────

github_tools = [
    get_github_profile,
    get_github_repos,
    get_github_repo_details,
    get_github_pinned_repos,
]
