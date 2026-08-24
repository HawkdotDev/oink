import React, { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, ZoomIn, ZoomOut, Home, X } from 'lucide-react'

interface GraphNode {
  id: string
  name: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
}

interface GraphLink {
  source: string
  target: string
}

interface GraphViewProps {
  workspacePath: string
  onNodeClick: (nodeId: string) => void
  onClose: () => void
}

export default function GraphView({
  workspacePath,
  onNodeClick,
  onClose
}: GraphViewProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [loading, setLoading] = useState(true)

  // Simulation physics parameters
  const repulsionStrength = 180
  const attractionStrength = 0.05
  const gravityStrength = 0.02
  const friction = 0.9
  const energyThreshold = 0.005

  // View state: pan (offsetX, offsetY) and scale (zoom)
  const [transform, setTransform] = useState({ x: 0, y: 0, zoom: 1.0 })
  const transformRef = useRef(transform)
  useEffect(() => {
    transformRef.current = transform
  }, [transform])

  // Mouse drag states
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)
  const activeDraggedNodeRef = useRef<GraphNode | null>(null)
  const hoveredNodeRef = useRef<GraphNode | null>(null)
  const isPanningRef = useRef(false)

  // Simulation loop tracking
  const animationIdRef = useRef<number | null>(null)
  const isSimulatingRef = useRef(false)

  // Load graph data from main process
  const loadGraphData = useCallback(async (): Promise<void> => {
    setLoading(true)
    try {
      const data = await window.api.fs.getGraphData(workspacePath)

      const canvas = canvasRef.current
      const width = canvas ? canvas.clientWidth || 800 : 800
      const height = canvas ? canvas.clientHeight || 600 : 600
      const centerX = width / 2
      const centerY = height / 2
      const radius = Math.min(width, height) / 3

      const graphNodes: GraphNode[] = data.nodes.map((node, i) => {
        const angle = (i / Math.max(1, data.nodes.length)) * Math.PI * 2
        return {
          id: node.id,
          name: node.name,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 20,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 20,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2,
          radius: 6
        }
      })

      setNodes(graphNodes)
      setLinks(data.links)
    } catch (err) {
      console.error('Failed to load graph data:', err)
    } finally {
      setLoading(false)
    }
  }, [workspacePath])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGraphData()
  }, [loadGraphData])

  // Draw graph frame with HiDPI Retina support
  const drawGraph = useCallback((): void => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()

    // 1. High-DPI Canvas scaling
    ctx.scale(dpr, dpr)

    // 2. Pan & zoom transform
    const { x, y, zoom } = transformRef.current
    ctx.translate(x, y)
    ctx.scale(zoom, zoom)

    const nodeMap = new Map<string, GraphNode>()
    nodes.forEach((n) => nodeMap.set(n.id, n))

    // Highlight connections if hovered
    const hovered = hoveredNodeRef.current
    const connectedNodeIds = new Set<string>()
    if (hovered) {
      connectedNodeIds.add(hovered.id)
      links.forEach((l) => {
        if (l.source === hovered.id) connectedNodeIds.add(l.target)
        if (l.target === hovered.id) connectedNodeIds.add(l.source)
      })
    }

    // Draw links / edges
    ctx.lineWidth = 1
    for (const link of links) {
      const n1 = nodeMap.get(link.source)
      const n2 = nodeMap.get(link.target)
      if (n1 && n2) {
        const isHighlighted = hovered && (link.source === hovered.id || link.target === hovered.id)
        ctx.strokeStyle = isHighlighted ? 'rgba(168, 85, 247, 0.85)' : 'rgba(255, 255, 255, 0.08)'
        ctx.beginPath()
        ctx.moveTo(n1.x, n1.y)
        ctx.lineTo(n2.x, n2.y)
        ctx.stroke()
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const isHovered = hovered && node.id === hovered.id
      const isConnected = hovered && connectedNodeIds.has(node.id)

      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius + (isHovered ? 2.5 : 0), 0, Math.PI * 2)
      if (isHovered) {
        ctx.fillStyle = '#c084fc'
        ctx.shadowColor = 'rgba(168, 85, 247, 0.7)'
        ctx.shadowBlur = 12
      } else if (isConnected) {
        ctx.fillStyle = '#a855f7'
        ctx.shadowBlur = 0
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.shadowBlur = 0
      }
      ctx.fill()
      ctx.shadowBlur = 0

      // Draw node label
      ctx.font = '500 11px Inter, sans-serif'
      ctx.fillStyle = isHovered || isConnected ? '#f4f4f5' : 'rgba(255, 255, 255, 0.4)'
      ctx.textAlign = 'center'
      ctx.fillText(node.name, node.x, node.y - 12)
    }

    ctx.restore()
  }, [nodes, links])

  // Physics simulation loop with energy threshold cooling
  const startSimulation = useCallback(() => {
    if (isSimulatingRef.current || nodes.length === 0) return

    isSimulatingRef.current = true

    const canvas = canvasRef.current
    if (!canvas) return

    const tick = (): void => {
      const cssWidth = canvas.clientWidth || 800
      const cssHeight = canvas.clientHeight || 600
      const centerX = cssWidth / 2
      const centerY = cssHeight / 2

      // 1. Calculate repulsion forces
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j]
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const distSqr = dx * dx + dy * dy || 1
          const dist = Math.sqrt(distSqr)

          if (dist < 320) {
            const force = repulsionStrength / distSqr
            const fx = (dx / dist) * force
            const fy = (dy / dist) * force
            n1.vx -= fx
            n1.vy -= fy
            n2.vx += fx
            n2.vy += fy
          }
        }
      }

      // 2. Calculate attraction forces
      const nodeMap = new Map<string, GraphNode>()
      nodes.forEach((n) => nodeMap.set(n.id, n))

      for (const link of links) {
        const n1 = nodeMap.get(link.source)
        const n2 = nodeMap.get(link.target)
        if (n1 && n2) {
          const dx = n2.x - n1.x
          const dy = n2.y - n1.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = dist * attractionStrength
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          n1.vx += fx
          n1.vy += fy
          n2.vx -= fx
          n2.vy -= fy
        }
      }

      // 3. Gravity towards center & velocity integration
      let totalKineticEnergy = 0
      for (const node of nodes) {
        const dx = centerX - node.x
        const dy = centerY - node.y
        node.vx += dx * gravityStrength
        node.vy += dy * gravityStrength

        if (node !== activeDraggedNodeRef.current) {
          node.x += node.vx
          node.y += node.vy
          node.vx *= friction
          node.vy *= friction
          totalKineticEnergy += node.vx * node.vx + node.vy * node.vy
        }
      }

      // 4. Render frame
      drawGraph()

      // 5. Check if simulation has cooled down
      const isInteracting = Boolean(activeDraggedNodeRef.current || isPanningRef.current)
      if (totalKineticEnergy < energyThreshold && !isInteracting) {
        isSimulatingRef.current = false
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current)
          animationIdRef.current = null
        }
        return
      }

      animationIdRef.current = requestAnimationFrame(tick)
    }

    animationIdRef.current = requestAnimationFrame(tick)
  }, [nodes, links, attractionStrength, drawGraph, friction, gravityStrength, repulsionStrength])

  // Trigger simulation whenever nodes or links change
  useEffect(() => {
    startSimulation()
    return (): void => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
        animationIdRef.current = null
      }
      isSimulatingRef.current = false
    }
  }, [startSimulation])

  // Redraw when transform changes even if simulation is sleeping
  useEffect(() => {
    drawGraph()
  }, [transform, drawGraph])

  // High-DPI canvas resize listener
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resize = (): void => {
      const parent = canvas.parentElement
      if (!parent) return
      const dpr = window.devicePixelRatio || 1
      const width = parent.clientWidth || 800
      const height = parent.clientHeight || 600

      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      drawGraph()
      startSimulation()
    }

    resize()
    window.addEventListener('resize', resize)
    return (): void => window.removeEventListener('resize', resize)
  }, [drawGraph, startSimulation])

  // Helper to convert screen mouse coords to Canvas graph coordinate space
  const getGraphCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const mouseX = clientX - rect.left
    const mouseY = clientY - rect.top
    const { x, y, zoom } = transformRef.current
    return {
      x: (mouseX - x) / zoom,
      y: (mouseY - y) / zoom
    }
  }

  // Mouse handlers for zoom, pan, drag
  const handleMouseDown = (e: React.MouseEvent): void => {
    const coords = getGraphCoords(e.clientX, e.clientY)

    let clickedNode: GraphNode | null = null
    for (const node of nodes) {
      const dx = coords.x - node.x
      const dy = coords.y - node.y
      if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
        clickedNode = node
        break
      }
    }

    if (clickedNode) {
      activeDraggedNodeRef.current = clickedNode
      startSimulation()
    } else {
      isPanningRef.current = true
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseMove = (e: React.MouseEvent): void => {
    const canvas = canvasRef.current
    if (!canvas) return

    const coords = getGraphCoords(e.clientX, e.clientY)

    let foundHover: GraphNode | null = null
    for (const node of nodes) {
      const dx = coords.x - node.x
      const dy = coords.y - node.y
      if (dx * dx + dy * dy < (node.radius + 10) * (node.radius + 10)) {
        foundHover = node
        break
      }
    }

    const prevHover = hoveredNodeRef.current
    hoveredNodeRef.current = foundHover

    if (foundHover !== prevHover) {
      drawGraph()
    }

    if (!dragStartRef.current) return

    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y

    if (activeDraggedNodeRef.current) {
      activeDraggedNodeRef.current.x = coords.x
      activeDraggedNodeRef.current.y = coords.y
      activeDraggedNodeRef.current.vx = 0
      activeDraggedNodeRef.current.vy = 0
      startSimulation()
    } else if (isPanningRef.current) {
      setTransform((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy
      }))
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleMouseUp = (e: React.MouseEvent): void => {
    if (dragStartRef.current) {
      const elapsedX = Math.abs(e.clientX - (dragStartRef.current.x || 0))
      const elapsedY = Math.abs(e.clientY - (dragStartRef.current.y || 0))

      if (activeDraggedNodeRef.current && elapsedX < 3 && elapsedY < 3) {
        onNodeClick(activeDraggedNodeRef.current.id)
      }
    }

    dragStartRef.current = null
    activeDraggedNodeRef.current = null
    isPanningRef.current = false
    startSimulation()
  }

  const handleWheel = (e: React.WheelEvent): void => {
    e.preventDefault()
    const zoomIntensity = 0.05
    const zoomFactor = e.deltaY < 0 ? 1 + zoomIntensity : 1 - zoomIntensity

    setTransform((prev) => {
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, 0.2), 4.0)
      return {
        ...prev,
        zoom: newZoom
      }
    })
  }

  // Navigation toolbar actions
  const handleReset = (): void => {
    setTransform({ x: 0, y: 0, zoom: 1.0 })
    startSimulation()
  }

  const handleZoomIn = (): void => {
    setTransform((prev) => ({ ...prev, zoom: Math.min(prev.zoom + 0.15, 4.0) }))
  }

  const handleZoomOut = (): void => {
    setTransform((prev) => ({ ...prev, zoom: Math.max(prev.zoom - 0.15, 0.2) }))
  }

  return (
    <div className="graph-container flex flex-1 flex-col bg-bg-primary relative overflow-hidden h-full">
      <div className="graph-title-overlay absolute top-4 left-6 pointer-events-none z-10">
        <div className="graph-title-text text-xl font-bold text-text-main tracking-tight">
          Graph View
        </div>
        <div className="graph-subtitle-text text-[11px] text-text-muted mt-0.5">
          {loading ? 'Analyzing link structure...' : `${nodes.length} notes, ${links.length} links`}
        </div>
      </div>

      <div className="graph-toolbar absolute top-4 right-4 bg-bg-sidebar/85 border border-border-color rounded p-1 flex gap-1 z-50 backdrop-blur-md shadow-lg">
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Refresh Graph"
          onClick={loadGraphData}
        >
          <RefreshCw size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Reset View"
          onClick={handleReset}
        >
          <Home size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Zoom In"
          onClick={handleZoomIn}
        >
          <ZoomIn size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Zoom Out"
          onClick={handleZoomOut}
        >
          <ZoomOut size={14} />
        </button>
        <button
          className="graph-btn bg-transparent border-none text-text-muted cursor-pointer p-1.5 rounded flex items-center justify-center hover:bg-bg-hover hover:text-text-main transition-all duration-150 ease"
          title="Close Graph"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      <canvas
        className="graph-canvas-element block w-full h-full cursor-grab active:cursor-grabbing"
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  )
}
