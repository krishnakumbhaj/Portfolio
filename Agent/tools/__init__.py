"""
Agent Tools Package
Import all tools here for clean usage in Brain.py
"""

from tools.github_tool import (
    github_tools,
    get_github_profile,
    get_github_repos,
    get_github_repo_details,
    get_github_pinned_repos,
)

from tools.email_tool import (
    email_tools,
    send_connection_email,
)

# Combined list of all tools for the agent
all_tools = github_tools + email_tools
