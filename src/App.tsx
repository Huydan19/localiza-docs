import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Archive,
  Building2,
  Check,
  Copy,
  DoorOpen,
  MapPin,
  Navigation,
  Search,
  User,
  X,
} from 'lucide-react'
import { BUILDING, rooms } from './data/catalog'
import { findDocuments, floors, QUICK_SEARCHES, suggestQueries } from './lib/search'
import {
  DOC_TYPE_LABEL,
  STATUS_LABEL,
  type DocStatus,
  type DocType,
} from './types'

const ALL_TYPES = Object.keys(DOC_TYPE_LABEL) as DocType[]
const ALL_STATUSES = Object.keys(STATUS_LABEL) as DocStatus[]

export default function App() {
  const [query, setQuery] = useState('')
  const [roomId, setRoomId] = useState<string | 'all'>('all')
  const [floor, setFloor] = useState<string | 'all'>('all')
  const [types, setTypes] = useState<DocType[]>([])
  const [statuses, setStatuses] = useState<DocStatus[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [copied, setCopied] = useState(false)
  const [searchPulse, setSearchPulse] = useState(0)
  const resultsRef = useRef<HTMLElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const results = useMemo(
    () =>
      findDocuments({
        query,
        roomId,
        floor,
        types,
        statuses,
      }),
    [query, roomId, floor, types, statuses],
  )

  const suggestions = useMemo(() => suggestQueries(query), [query])
  const selected = results.find((d) => d.id === selectedId) ?? null
  const floorList = useMemo(() => floors(), [])
  const hasActiveFilters =
    roomId !== 'all' || floor !== 'all' || types.length > 0 || statuses.length > 0 || query.trim() !== ''

  useEffect(() => {
    if (selectedId && !results.some((d) => d.id === selectedId)) {
      setSelectedId(null)
    }
  }, [results, selectedId])

  function runSearch(nextQuery?: string) {
    if (nextQuery !== undefined) setQuery(nextQuery)
    setShowSuggestions(false)
    setSearchPulse((n) => n + 1)
    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  function clearAll() {
    setQuery('')
    setRoomId('all')
    setFloor('all')
    setTypes([])
    setStatuses([])
    setSelectedId(null)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  async function copyLocation() {
    if (!selected) return
    const text = [
      selected.title,
      selected.code,
      selected.locationPhrase,
      `Como chegar: ${selected.room.howToGet}`,
      `${BUILDING.address} — ${BUILDING.city}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function toggleType(t: DocType) {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  function toggleStatus(s: DocStatus) {
    setStatuses((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            LD
          </div>
          <div className="brand-text">
            <strong>Localiza Docs</strong>
            <span>
              {BUILDING.address} · {BUILDING.neighborhood} · {BUILDING.city}
            </span>
          </div>
        </div>
        <div className="pill">
          <Building2 size={14} /> Busca ao vivo · sede BH
        </div>
      </header>

      <section className="hero">
        <p className="hero-kicker">{BUILDING.name}</p>
        <h1>Em qual cômodo está o documento?</h1>
        <p>
          Digite nome, código, tag ou sala — a lista filtra na hora. Clique no
          resultado para ver prateleira, caixa e como chegar.
        </p>

        <form
          className="search-shell"
          onSubmit={(e) => {
            e.preventDefault()
            const found = findDocuments({
              query,
              roomId,
              floor,
              types,
              statuses,
            })
            runSearch()
            if (found[0]) setSelectedId(found[0].id)
          }}
        >
          <label htmlFor="q" className="search-label">
            <Search size={18} color="#5a6b61" aria-hidden />
            <input
              ref={inputRef}
              id="q"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('')
                  setShowSuggestions(false)
                }
              }}
              placeholder="Ex.: contrato frota, NF-88921, cofre, arquivo morto…"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={showSuggestions && suggestions.length > 0}
            />
            {query && (
              <button
                type="button"
                className="clear-btn"
                aria-label="Limpar busca"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
              >
                <X size={16} />
              </button>
            )}
          </label>
          <button type="submit" className="btn btn-primary">
            Localizar
          </button>

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions" role="listbox">
              {suggestions.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => runSearch(s)}
                  >
                    <Search size={14} /> {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>

        <div className="quick-row">
          <span>Experimente:</span>
          {QUICK_SEARCHES.map((q) => (
            <button key={q} type="button" className="quick-chip" onClick={() => runSearch(q)}>
              {q}
            </button>
          ))}
        </div>
      </section>

      <div className="floor-strip" aria-label="Andares">
        <button
          type="button"
          className={`floor-chip ${floor === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFloor('all')
            setRoomId('all')
          }}
        >
          Todo o prédio
        </button>
        {floorList.map((f) => (
          <button
            key={f}
            type="button"
            className={`floor-chip ${floor === f ? 'active' : ''}`}
            onClick={() => {
              setFloor(f)
              setRoomId('all')
            }}
          >
            {f}
          </button>
        ))}
        {hasActiveFilters && (
          <button type="button" className="floor-chip clear-filters" onClick={clearAll}>
            Limpar filtros
          </button>
        )}
      </div>

      <div className="layout">
        <aside className="panel">
          <h2>
            <DoorOpen size={16} style={{ verticalAlign: '-2px', marginRight: 6 }} />
            Cômodos
          </h2>
          <div className="room-list">
            <button
              type="button"
              className={`room ${roomId === 'all' ? 'active' : ''}`}
              onClick={() => setRoomId('all')}
            >
              <strong>Todos os cômodos</strong>
              <span>
                {rooms.length} salas · {BUILDING.address}
              </span>
            </button>
            {rooms
              .filter((r) => floor === 'all' || r.floor === floor)
              .map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className={`room ${roomId === r.id ? 'active' : ''}`}
                  onClick={() => setRoomId(r.id)}
                >
                  <strong>{r.name}</strong>
                  <span>
                    {r.floor} · {r.wing}
                  </span>
                </button>
              ))}
          </div>

          <div className="filters">
            <h2>Tipo</h2>
            <div className="filter-group">
              {ALL_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${types.includes(t) ? 'active' : ''}`}
                  onClick={() => toggleType(t)}
                >
                  {DOC_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
            <h2>Situação</h2>
            <div className="filter-group">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={`chip ${statuses.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleStatus(s)}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <main className="panel" ref={resultsRef} key={searchPulse}>
          <div className="results-head">
            <p>
              <strong style={{ color: 'var(--ink)' }}>{results.length}</strong>
              {results.length === 1 ? ' documento localizado' : ' documentos localizados'}
              {query.trim() ? ` para “${query.trim()}”` : ''}
            </p>
          </div>

          {results.length === 0 ? (
            <div className="empty">
              <strong>Nada encontrado</strong>
              Tente outro termo, limpe os filtros ou use um atalho acima (ex.: cofre).
              <button type="button" className="btn btn-soft empty-btn" onClick={clearAll}>
                Limpar e recomeçar
              </button>
            </div>
          ) : (
            <div className="doc-list">
              {results.map((doc, i) => (
                <button
                  key={doc.id}
                  type="button"
                  className={`doc ${selectedId === doc.id ? 'selected' : ''}`}
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                  onClick={() => setSelectedId(doc.id)}
                >
                  <div>
                    <h3 className="doc-title">{doc.title}</h3>
                    <div className="doc-code">
                      {doc.code} · {doc.pages} págs. · {doc.custodian}
                    </div>
                    <p className="location-line">
                      <MapPin size={14} />
                      {doc.locationPhrase}
                    </p>
                    <div className="doc-meta">
                      <span className="badge badge-green">{DOC_TYPE_LABEL[doc.type]}</span>
                      <span
                        className={`badge ${
                          doc.status === 'na_prateleira'
                            ? 'badge-green'
                            : doc.status === 'com_colaborador' || doc.status === 'em_transito'
                              ? 'badge-warn'
                              : 'badge-muted'
                        }`}
                      >
                        {STATUS_LABEL[doc.status]}
                      </span>
                      {doc.matchedFields.slice(0, 2).map((f) => (
                        <span key={f} className="badge badge-muted">
                          match: {f}
                        </span>
                      ))}
                    </div>
                    {doc.reasons.length > 0 && (
                      <ul className="doc-reasons">
                        {doc.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="doc-side">
                    <div className="room-tag">
                      <DoorOpen size={14} />
                      {doc.room.name}
                      <small>{doc.room.floor}</small>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="detail">
              <h3>{selected.title}</h3>
              <p className="detail-where">
                <MapPin size={16} />
                {selected.locationPhrase}
              </p>
              <p>{selected.summary}</p>

              <div className="detail-grid">
                <div>
                  <span>Cômodo</span>
                  <strong>{selected.room.name}</strong>
                </div>
                <div>
                  <span>Andar</span>
                  <strong>{selected.room.floor}</strong>
                </div>
                <div>
                  <span>Prateleira</span>
                  <strong>{selected.shelf}</strong>
                </div>
                <div>
                  <span>Caixa / pasta</span>
                  <strong>{selected.box}</strong>
                </div>
              </div>

              <div className="howto-get">
                <Navigation size={16} />
                <div>
                  <strong>Como chegar</strong>
                  <p>{selected.room.howToGet}</p>
                </div>
              </div>

              <div className="detail-actions">
                <button type="button" className="btn btn-soft" onClick={copyLocation}>
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? ' Copiado!' : ' Copiar localização'}
                </button>
                <button
                  type="button"
                  className="btn btn-soft"
                  onClick={() => {
                    setRoomId(selected.roomId)
                    setFloor(selected.room.floor)
                  }}
                >
                  <DoorOpen size={16} /> Ver só este cômodo
                </button>
              </div>

              <p className="detail-meta">
                <Archive size={14} /> {selected.code} · Tags: {selected.tags.join(', ')}
                {' · '}
                <User size={14} /> Responsável: {selected.custodian}
              </p>
            </div>
          )}
        </main>
      </div>

      <section className="howto">
        <h2>Como usar</h2>
        <ol>
          <li>
            <strong>Digite</strong> na busca (nome, código, cômodo ou tag) — filtra na hora.
          </li>
          <li>
            <strong>Ou clique</strong> nos atalhos, andares e cômodos à esquerda.
          </li>
          <li>
            <strong>Abra o resultado</strong> para ver prateleira, caixa e o caminho no prédio.
          </li>
          <li>
            <strong>Copie a localização</strong> para mandar no chat da equipe.
          </li>
        </ol>
      </section>
    </div>
  )
}
