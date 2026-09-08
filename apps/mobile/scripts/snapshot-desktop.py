"""Create a consistent, private mobile snapshot; never modify the desktop DB."""
import argparse
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import tempfile

MOBILE = Path(__file__).resolve().parents[1]
CONTRACT = json.loads((MOBILE / "src/lib/db/desktop-schema.json").read_text())


def validate(db):
    if db.execute("PRAGMA quick_check").fetchone()[0] != "ok":
        raise ValueError("Database integrity check failed")
    for table, columns in CONTRACT.items():
        actual = {row[1] for row in db.execute(f'PRAGMA table_info("{table}")')}
        if not set(columns) <= actual:
            raise ValueError(f"Incompatible desktop schema: {table}")


def snapshot(source, destination):
    source = Path(source).expanduser().resolve(strict=True)
    destination = Path(destination).resolve()
    if source == destination:
        raise ValueError("Source and destination must differ")
    destination.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary = tempfile.mkstemp(suffix=".db", dir=destination.parent)
    os.close(handle)
    try:
        with closing(sqlite3.connect(source.as_uri() + "?mode=ro", uri=True)) as original:
            with closing(sqlite3.connect(temporary)) as copied:
                original.backup(copied)
                validate(copied)
                # The backup contains all WAL pages; ship one standalone file.
                copied.execute("PRAGMA journal_mode = DELETE")
        os.replace(temporary, destination)
    finally:
        Path(temporary).unlink(missing_ok=True)
    return destination


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    result = snapshot(args.source, MOBILE / "assets/data/desktop.db")
    print(f"Snapshot ready ({result.stat().st_size / 1_000_000:.1f} MB). Restart Expo to load it.")
