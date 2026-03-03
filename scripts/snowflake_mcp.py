#!/usr/bin/env python3
"""
Formentera Snowflake MCP Server — AR Accounting Skills backend.

Connects to Snowflake once at startup via SSO (browser auth), then serves
SQL execution requests over the MCP stdio protocol.

Usage:
    pip install mcp snowflake-connector-python
    python scripts/snowflake_mcp.py

Claude Code integration: configure in .mcp.json (see repo root).
"""

import asyncio
import json
import sys

import snowflake.connector
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import TextContent, Tool

# ---------------------------------------------------------------------------
# Connection config — matches dbt profiles.yml
# ---------------------------------------------------------------------------
ACCOUNT   = "YL35090.south-central-us.azure"
USER      = "MICHAEL.SHIRAZ@FORMENTERAOPS.COM"
DATABASE  = "FO_PRODUCTION_DB"
WAREHOUSE = "DBT_WH"
ROLE      = "DBT_ROLE"

_conn: snowflake.connector.SnowflakeConnection | None = None


def _get_connection() -> snowflake.connector.SnowflakeConnection:
    """Return a live connection, reconnecting if the session has closed."""
    global _conn
    if _conn is None or _conn.is_closed():
        _conn = snowflake.connector.connect(
            account=ACCOUNT,
            user=USER,
            authenticator="externalbrowser",
            database=DATABASE,
            warehouse=WAREHOUSE,
            role=ROLE,
        )
    return _conn


# ---------------------------------------------------------------------------
# MCP server
# ---------------------------------------------------------------------------
server = Server("formentera-snowflake")


@server.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="execute_sql",
            description=(
                "Execute SQL against FO_PRODUCTION_DB (Formentera gold financial models). "
                "Returns results as JSON with row_count, columns, and rows. "
                "Use for AR aging, GL details, revenue checks, and any ad-hoc Snowflake query. "
                "A LIMIT clause is automatically appended to SELECT queries that don't include one."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": (
                            "SQL query to execute. No trailing semicolon needed. "
                            "Fully-qualified names are not required — FO_PRODUCTION_DB is the default database."
                        ),
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max rows to return (default 500, max 5000).",
                        "default": 500,
                    },
                },
                "required": ["query"],
            },
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name != "execute_sql":
        return [TextContent(type="text", text=f"Unknown tool: {name}")]

    query = arguments["query"].strip().rstrip(";")
    limit = min(int(arguments.get("limit", 500)), 5000)

    # Auto-add LIMIT to SELECT queries that don't already have one.
    if query.upper().startswith("SELECT") and "LIMIT" not in query.upper():
        query = f"{query} LIMIT {limit}"

    try:
        conn = _get_connection()
        cur = conn.cursor(snowflake.connector.DictCursor)
        cur.execute(query)
        rows = cur.fetchall()

        if not rows:
            return [TextContent(type="text", text="Query returned 0 rows.")]

        return [
            TextContent(
                type="text",
                text=json.dumps(
                    {
                        "row_count": len(rows),
                        "columns": list(rows[0].keys()),
                        "rows": rows,
                    },
                    default=str,
                    indent=2,
                ),
            )
        ]

    except Exception as exc:
        return [TextContent(type="text", text=f"Snowflake error: {exc}")]


# ---------------------------------------------------------------------------
# Startup
# ---------------------------------------------------------------------------
async def main() -> None:
    # SSO auth must happen BEFORE stdio_server() takes over stdin/stdout.
    # We redirect stdout to stderr during auth so that SSO status messages
    # (browser-open prompts, URLs) don't corrupt the MCP JSON protocol.
    print("Connecting to Snowflake (SSO — browser window will open)...", file=sys.stderr)

    class _ToStderr:
        def write(self, s: str) -> None:
            sys.stderr.write(s)
        def flush(self) -> None:
            sys.stderr.flush()

    real_stdout = sys.stdout
    sys.stdout = _ToStderr()  # type: ignore[assignment]
    try:
        _get_connection()
    finally:
        sys.stdout = real_stdout

    print("Snowflake connected. MCP server ready.", file=sys.stderr)

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
