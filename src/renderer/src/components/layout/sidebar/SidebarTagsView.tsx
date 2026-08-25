import React from 'react'

interface TagItem {
  id: string
  name: string
  color: string
  count: number
}

const DEFAULT_TAGS: TagItem[] = [
  { id: '1', name: 'General', color: '#3b82f6', count: 12 },
  { id: '2', name: 'Onboarding', color: '#10b981', count: 8 },
  { id: '3', name: 'Design', color: '#8b5cf6', count: 5 },
  { id: '4', name: 'Roadmap', color: '#f59e0b', count: 4 },
  { id: '5', name: 'Interviews', color: '#ec4899', count: 3 },
  { id: '6', name: 'Documentation', color: '#06b6d4', count: 7 }
]

interface SidebarTagsViewProps {
  onSelectTag?: (tagName: string) => void
  selectedTag?: string | null
}

function SidebarTagsView({ onSelectTag, selectedTag }: SidebarTagsViewProps): React.JSX.Element {
  return (
    <div className="sidebar-tags-container px-3 py-2">
      <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 px-1">
        Tags & Categories
      </div>
      <div className="flex flex-col gap-1">
        {DEFAULT_TAGS.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`sidebar-tag-item ${selectedTag === tag.name ? 'active' : ''}`}
            onClick={(): void => onSelectTag?.(tag.name)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: tag.color }}
              />
              <span className="sidebar-tag-name truncate">#{tag.name}</span>
            </div>
            <span className="sidebar-badge-count">{tag.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default React.memo(SidebarTagsView)
