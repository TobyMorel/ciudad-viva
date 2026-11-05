#!/usr/bin/env python3
"""Compile the Rust road pathfinder to the checked-in browser WASM asset."""

from pathlib import Path
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "wasm" / "route-engine" / "Cargo.toml"
BUILT = ROOT / "wasm" / "route-engine" / "target" / "wasm32-unknown-unknown" / "release" / "ciudad_viva_route_engine.wasm"
OUTPUT = ROOT / "wasm" / "route-engine.wasm"


def main() -> int:
    cargo = shutil.which("cargo")
    if not cargo:
        raise SystemExit("Instalá Rust/Cargo y el target wasm32-unknown-unknown antes de compilar el pathfinder.")
    subprocess.run(
        [cargo, "build", "--manifest-path", str(MANIFEST), "--target", "wasm32-unknown-unknown", "--release"],
        cwd=ROOT,
        check=True,
    )
    if not BUILT.is_file():
        raise SystemExit(f"Cargo terminó sin generar {BUILT}")
    shutil.copy2(BUILT, OUTPUT)
    print(f"Generado {OUTPUT.relative_to(ROOT)} ({OUTPUT.stat().st_size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
