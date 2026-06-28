import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui'
import { StickyNote, Trash2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface GlobalNote { id: string; text: string; createdAt: string }

export default function NotesPage() {
  const { universityId } = useAuth()
  const notesKey = `uni_global_notes_${universityId}`
  const [notes, setNotes] = useState<GlobalNote[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    try { setNotes(JSON.parse(localStorage.getItem(notesKey) || '[]')) } catch {}
  }, [notesKey])

  const save = (updated: GlobalNote[]) => {
    setNotes(updated)
    localStorage.setItem(notesKey, JSON.stringify(updated))
  }

  const add = () => {
    if (!text.trim()) return
    save([{ id: Date.now().toString(), text: text.trim(), createdAt: new Date().toISOString() }, ...notes])
    setText('')
  }

  const remove = (id: string) => save(notes.filter(n => n.id !== id))

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Internal Notes</h1>
        <p className="text-sm text-gray-500 mt-0.5">University-side notes — not visible to FORSA or students</p>
      </div>

      <Card>
        <textarea
          className="input h-24 resize-none mb-3"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Add a general note about your FORSA partnership, processes, or reminders..."
          onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) add() }}
        />
        <div className="flex justify-end">
          <button onClick={add} disabled={!text.trim()} className="btn-primary text-sm">
            <StickyNote size={14} /> Add Note
          </button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-400">No notes yet</div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <Card key={note.id} className="bg-amber-50 border-amber-100">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-gray-800 flex-1">{note.text}</p>
                <button onClick={() => remove(note.id)} className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">{format(new Date(note.createdAt), 'dd MMM yyyy · HH:mm')}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
