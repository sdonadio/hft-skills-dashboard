# -*- coding: utf-8 -*-
import io, json, sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import fp1, fp2, fp3

sessions = fp1.S + fp2.S + fp3.S
assert [s["n"] for s in sessions] == list(range(1, 14)), [s["n"] for s in sessions]

body = json.dumps({"sessions": sessions}, indent=2, ensure_ascii=False)
out = "window.FOCUS = " + body + ";\n"
path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "focus.js")
io.open(path, "w", encoding="utf-8").write(out)
print("wrote", path, os.path.getsize(path), "bytes")
