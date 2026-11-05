from pathlib import Path

from PyInstaller.utils.hooks import collect_submodules

root=Path(SPECPATH)
datas=[]
for pattern in ("*.html","*.css","*.js","*.json","*.svg"):
    for path in root.glob(pattern):
        if path.name not in ("package.json","package-lock.json"):
            datas.append((str(path),"."))
for directory in ("assets","vendor"):
    path=root/directory
    if path.exists():
        datas.append((str(path),directory))
# The LAN game runs offline.js in a separate Node.js process.
# Bundle its entrypoint, ESM package metadata and Node runtime in the one-file EXE.
for filename in ("online_engine.mjs","package.json"):
    path=root/filename
    if path.exists():datas.append((str(path),"."))
node_runtime=root/"runtime"/"node.exe"
binaries=[(str(node_runtime),".")] if node_runtime.is_file() else []
cloudflared=root/"runtime"/"cloudflared.exe"
if cloudflared.is_file():binaries.append((str(cloudflared),"."))

analysis=Analysis(
    [str(root/"desktop_app.py")],
    pathex=[str(root)],
    binaries=binaries,
    datas=datas,
    hiddenimports=collect_submodules("webview"),
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz=PYZ(analysis.pure)
exe=EXE(
    pyz,
    analysis.scripts,
    analysis.binaries,
    analysis.datas,
    [],
    name="CiudadViva",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
