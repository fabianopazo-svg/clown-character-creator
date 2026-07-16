' Runs launch-editor.bat completely hidden - no console window at all.
' Use this once you've confirmed launch-editor.bat itself works correctly,
' since this version shows you nothing if something goes wrong.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
scriptFolder = fso.GetParentFolderName(WScript.ScriptFullName)
shell.Run """" & scriptFolder & "\launch-editor.bat""", 0, False
