import React, { useState } from 'react'
import { Terminal as TerminalIcon, Play, Trash2, CheckCircle2 } from 'lucide-react'

interface QuickTerminalWidgetProps {
  workspacePath?: string | null
  activeFileName?: string | null
  activeContent?: string
}

function QuickTerminalWidgetComponent({
  workspacePath,
  activeFileName,
  activeContent = ''
}: QuickTerminalWidgetProps): React.JSX.Element {
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Oink Desktop Engine v0.1.0 initialized',
    '[WORKSPACE] ' + (workspacePath || 'No workspace opened'),
    '[STATUS] Ready. Type "help" for a list of available commands.'
  ])
  const [inputVal, setInputVal] = useState<string>('')

  const executeCommand = async (rawInput: string): Promise<void> => {
    const input = rawInput.trim()
    if (!input) return

    const parts = input.split(/\s+/)
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1).join(' ')

    const newLogs: string[] = [`> ${input}`]

    switch (cmd) {
      case 'help':
        newLogs.push(
          'Available commands:',
          '  help               - Display this help message',
          '  clear | cls        - Clear the terminal console',
          '  stats              - Show word, character, and line count of active file',
          '  calc <expr>        - Evaluate math expression (e.g. "calc 14 * 25 + 7")',
          '  count <text>       - Count words and characters in provided text',
          '  date | time        - Show current date and local time',
          '  echo <text>        - Print text output',
          '  files | ls         - List files in current directory',
          '  info               - Show application build and system details'
        )
        break

      case 'clear':
      case 'cls':
        setLogs([])
        return

      case 'stats': {
        const text = activeContent || ''
        const words = text ? text.trim().split(/\s+/).filter(Boolean).length : 0
        const chars = text.length
        const lines = text ? text.split('\n').length : 0
        const readingTime = Math.max(1, Math.ceil(words / 200))
        newLogs.push(
          `Document: ${activeFileName || 'Untitled'}`,
          `  Words: ${words}`,
          `  Characters: ${chars}`,
          `  Lines: ${lines}`,
          `  Estimated Read Time: ~${readingTime} min`
        )
        break
      }

      case 'calc': {
        if (!args) {
          newLogs.push('Usage: calc <expression> (e.g. "calc 42 * 12 + 10")')
          break
        }
        try {
          // Safe math evaluator supporting basic arithmetic
          const sanitized = args.replace(/[^0-9+\-*/().%^ ]/g, '')
          if (!sanitized) throw new Error('Invalid math expression')
          const result = Function(`'use strict'; return (${sanitized})`)()
          newLogs.push(`= ${result}`)
        } catch {
          newLogs.push('Error evaluating math expression.')
        }
        break
      }

      case 'count': {
        if (!args) {
          newLogs.push('Usage: count <text to analyze>')
          break
        }
        const words = args.trim().split(/\s+/).filter(Boolean).length
        const chars = args.length
        newLogs.push(`Text length: ${chars} chars, ${words} words`)
        break
      }

      case 'date':
      case 'time':
        newLogs.push(`Current Time: ${new Date().toLocaleString()}`)
        break

      case 'echo':
        newLogs.push(args)
        break

      case 'files':
      case 'ls': {
        if (!workspacePath) {
          newLogs.push('No workspace open.')
          break
        }
        try {
          const entries = await window.api.fs.readDirectory(workspacePath)
          newLogs.push(`Workspace: ${workspacePath}`)
          entries.forEach((e) => {
            newLogs.push(`  ${e.isDir ? '📁' : '📄'} ${e.name}`)
          })
        } catch (err) {
          newLogs.push(`Failed to read directory: ${err}`)
        }
        break
      }

      case 'info':
        newLogs.push(
          'Oink Desktop Workspace',
          '  Version: 0.1.0 (MIT License)',
          '  Runtime: Electron + React 19 + TypeScript',
          `  Active File: ${activeFileName || 'None'}`,
          `  Workspace: ${workspacePath || 'None'}`
        )
        break

      default:
        newLogs.push(`Command not recognized: "${cmd}". Type "help" for list of commands.`)
    }

    setLogs((prev) => [...prev, ...newLogs])
  }

  const handleRunCommand = (e: React.FormEvent): void => {
    e.preventDefault()
    if (!inputVal.trim()) return
    const cmd = inputVal
    setInputVal('')
    void executeCommand(cmd)
  }

  return (
    <div className="flex flex-col h-full gap-2 p-3 font-mono text-xs overflow-hidden bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-semibold">
          <TerminalIcon size={12} className="text-zinc-300" />
          <span>Interactive Quick Terminal</span>
        </span>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] text-emerald-400">
            <CheckCircle2 size={10} />
            <span>Ready</span>
          </span>
          <button
            className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors"
            onClick={(): void => setLogs([])}
            title="Clear Logs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 text-[11px] text-zinc-300 pr-1">
        {logs.map((log, i) => (
          <div
            key={i}
            className={
              log.startsWith('>')
                ? 'text-zinc-200 font-semibold'
                : log.includes('ERROR') || log.includes('Error')
                  ? 'text-red-400'
                  : log.startsWith('=')
                    ? 'text-emerald-400 font-bold'
                    : 'text-zinc-400'
            }
          >
            {log}
          </div>
        ))}
      </div>

      <form
        onSubmit={handleRunCommand}
        className="flex items-center gap-1.5 border-t border-zinc-800 pt-2"
      >
        <span className="text-zinc-400 select-none font-bold">&gt;</span>
        <input
          type="text"
          value={inputVal}
          onChange={(e): void => setInputVal(e.target.value)}
          placeholder="Type command (e.g. 'help', 'stats', 'calc 42*12')..."
          className="flex-1 bg-transparent border-none outline-none text-zinc-300 text-xs font-mono"
        />
        <button
          type="submit"
          className="p-1 text-zinc-300 hover:text-white transition-colors"
          title="Run"
        >
          <Play size={12} />
        </button>
      </form>
    </div>
  )
}

export default React.memo(QuickTerminalWidgetComponent)
