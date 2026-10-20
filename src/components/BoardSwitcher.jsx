import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from '../i18n/LanguageContext'
import { getBoardName } from '../utils/boards'
import AddBoardModal from './AddBoardModal'

const BOARD_COLORS = [
  { c: '#58CC02', d: '#46A302' },
  { c: '#1CB0F6', d: '#0E8FCE' },
  { c: '#CE82FF', d: '#A855F7' },
  { c: '#FF9600', d: '#E07C00' },
  { c: '#FF4B4B', d: '#EA2B2B' },
]

export default function BoardSwitcher({ boards, activeBoardId, onSelect, onAddBoard, onDeleteBoard }) {
  const { t } = useTranslation()
  const [modalOpen, setModalOpen] = useState(false)

  function handleAdd(name) {
    const id = onAddBoard(name)
    setModalOpen(false)
    if (id) onSelect(id)
  }

  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
      <div role="tablist" className="flex items-center gap-2 w-max pb-1">
        {boards.map((board, i) => {
          const active = board.id === activeBoardId
          const { c, d } = BOARD_COLORS[i % BOARD_COLORS.length]
          return (
            <div key={board.id} className="group relative">
              <button
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(board.id)}
                className="press h-10 px-4 rounded-2xl text-[14px] font-extrabold whitespace-nowrap border-2"
                style={
                  active
                    ? { background: c, color: '#fff', borderColor: c, boxShadow: `0 4px 0 ${d}` }
                    : { background: '#fff', color: d, borderColor: '#E5E7EB', boxShadow: '0 4px 0 #E5E7EB' }
                }
              >
                {getBoardName(board, t)}
              </button>
              {!board.builtIn && (
                <button
                  onClick={() => onDeleteBoard(board.id)}
                  aria-label={t('deleteBoard')}
                  title={t('deleteBoard')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-coral text-white border-2 border-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus:opacity-100 transition-opacity"
                >
                  <X size={10} strokeWidth={3.5} />
                </button>
              )}
            </div>
          )
        })}
        <button
          onClick={() => setModalOpen(true)}
          className="h-10 px-3.5 rounded-2xl text-[14px] font-extrabold border-2 border-dashed border-borderStrong text-textMuted hover:bg-surfaceAlt hover:text-textSecondary transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <Plus size={16} strokeWidth={3} />
          {t('addBoard')}
        </button>
      </div>

      <AddBoardModal open={modalOpen} onClose={() => setModalOpen(false)} onAdd={handleAdd} />
    </div>
  )
}
