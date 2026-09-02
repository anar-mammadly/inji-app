import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import AddBoardModal from './AddBoardModal'

const BOARD_COLORS = ['#58CC02', '#1CB0F6', '#CE82FF', '#FF9600', '#FF4B4B']

export default function BoardSwitcher({ boards, activeBoardId, onSelect, onAddBoard, onDeleteBoard }) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  function handleAdd(name) {
    const id = onAddBoard(name)
    setModalOpen(false)
    if (id) onSelect(id)
  }

  return (
    <div className="flex items-center gap-2 flex-wrap px-4 sm:px-6 pt-4">
      {boards.map((board, i) => {
        const active = board.id === activeBoardId
        const color = BOARD_COLORS[i % BOARD_COLORS.length]
        return (
          <div key={board.id} className="group relative">
            <button
              onClick={() => onSelect(board.id)}
              className="px-4 py-2 rounded-2xl text-[13px] font-extrabold transition-transform active:translate-y-[2px] border-2"
              style={
                active
                  ? { background: color, color: '#fff', borderColor: color, boxShadow: `0 3px 0 ${color}99` }
                  : { background: '#fff', color: color, borderColor: `${color}55` }
              }
            >
              {board.name}
            </button>
            {!board.builtIn && (
              <button
                onClick={() => onDeleteBoard(board.id)}
                aria-label={t('deleteBoard')}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full items-center justify-center bg-coral text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex border-2 border-surface"
              >
                <X size={10} strokeWidth={3} />
              </button>
            )}
          </div>
        )
      })}
      <button
        onClick={() => setModalOpen(true)}
        className="px-3 py-2 rounded-2xl text-[13px] font-extrabold border-2 border-dashed border-borderStrong text-textMuted hover:bg-surfaceAlt transition-colors flex items-center gap-1"
      >
        <Plus size={14} strokeWidth={3} />
        {t('addBoard')}
      </button>

      <AddBoardModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  )
}
