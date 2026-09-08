"""Mobile snapshot regression checks. Does not start or test the desktop app."""
import importlib.util
import json
from pathlib import Path
import sqlite3
import tempfile

ROOT = Path(__file__).resolve().parents[3]
spec = importlib.util.spec_from_file_location("snapshot", Path(__file__).with_name("snapshot-desktop.py"))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def apply_desktop_schema(db):
    migrations = ROOT / "apps/desktop/drizzle"
    for entry in json.loads((migrations / "meta/_journal.json").read_text())["entries"]:
        db.executescript((migrations / (entry["tag"] + ".sql")).read_text())


def check():
    with tempfile.TemporaryDirectory(prefix="relay-snapshot-test-") as directory:
        root = Path(directory)
        source, target = root / "source.db", root / "desktop.db"
        db = sqlite3.connect(source)
        apply_desktop_schema(db)
        db.execute("PRAGMA journal_mode = WAL")
        db.execute("PRAGMA wal_autocheckpoint = 0")
        db.execute("INSERT INTO customers (id,name,customer_type) VALUES ('one','Snapshot test','account')")
        db.commit()
        assert Path(str(source) + "-wal").stat().st_size > 0
        module.snapshot(source, target)
        with sqlite3.connect(target) as copy:
            assert copy.execute("SELECT name FROM customers WHERE id='one'").fetchone()[0] == "Snapshot test"
            copy.execute("PRAGMA query_only = ON")
            try:
                copy.execute("DELETE FROM customers")
                raise AssertionError("Snapshot accepted a write")
            except sqlite3.OperationalError as error:
                assert "readonly" in str(error)
        previous = target.read_bytes()
        bad = root / "bad.db"
        bad.write_bytes(b"not sqlite")
        try:
            module.snapshot(bad, target)
            raise AssertionError("Invalid snapshot accepted")
        except sqlite3.DatabaseError:
            assert target.read_bytes() == previous
        with sqlite3.connect(bad := root / "old.db") as old:
            old.execute("CREATE TABLE customers(id TEXT)")
        try:
            module.snapshot(bad, target)
            raise AssertionError("Old schema accepted")
        except ValueError:
            assert target.read_bytes() == previous
        db.execute("INSERT INTO customers (id,name,customer_type) VALUES ('two','New customer','cash')")
        db.commit()
        module.snapshot(source, target)
        with sqlite3.connect(target) as copy:
            assert copy.execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 2
        assert db.execute("SELECT COUNT(*) FROM customers").fetchone()[0] == 2
        db.close()
    print("PASS: desktop schema parity, WAL snapshot, read-only enforcement, invalid/old rejection, atomic refresh, source preservation")


if __name__ == "__main__":
    check()
