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

analysis=Analysis(
    [str(root/"desktop_app.py")],
    pathex=[str(root)],
    binaries=[],
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
