# -*- mode: python -*-
import sys
sys.setrecursionlimit(5000)

block_cipher = None


a = Analysis(['RdfToJson.py'],
             pathex=['D:\\electronproject\\rdf2json\\src'],
             binaries=[],
             datas=[],
             hiddenimports=['gevent.__hub_local', 'gevent._local', 'gevent.__greenlet_primitives', 'gevent.__waiter', 'gevent.__hub_primitives', 'gevent._greenlet', 'gevent.__ident', 'gevent.libev.corecext', 'gevent.libuv.loop', 'gevent._event', 'gevent._queue', 'gevent.__semaphore', 'gevent.__imap'],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name='transform',
          debug=False,
          strip=False,
          upx=True,
          runtime_tmpdir=None,
          console=True )