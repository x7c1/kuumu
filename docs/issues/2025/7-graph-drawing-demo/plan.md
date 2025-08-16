# Graph Drawing Demo Application

## Overview
Create an independent web application for testing and validating graph drawing algorithms. The application will allow manual input of graph relationships and provide real-time visualization with hot reload functionality.

## Requirements

### Core Features
- Web application using Vite for development with hot reload
- Manual graph input via text interface (e.g., "a->b" format)
- Real-time graph visualization
- Algorithm hot-swapping for instant visual feedback
- Interactive graph display

### Input Format
- Text-based dependency notation: "a->b" (node a depends on node b)
- Sequential dependency addition: each new relationship gets added incrementally
- Numbered dependency display: "1:a->b", "2:b->c", etc.
- Support for multiple relationships building up the graph
- Parse and convert to internal graph representation

### Technical Stack
- Frontend: HTML/CSS/JavaScript (or TypeScript)
- Build tool: Vite with hot reload
- Visualization: SVG
- Graph parsing: Custom parser for dependency notation

### Architecture Components
- Graph parser: Convert text input to graph data structure
- Dependency tracker: Manage sequential addition and numbering of relationships
- Layout engine: Pluggable algorithm system for different positioning strategies
- Renderer: Visual display of nodes and edges
- UI controls: Input field, dependency list display, and configuration panel

## Implementation Plan

### Phase 1: Basic Application Setup
- Create new Vite project structure
- Set up development environment with hot reload
- Create basic HTML layout with input field and SVG area
- Implement simple graph data structure

### Phase 2: Graph Parsing and Basic Rendering
- Implement parser for "a->b" notation
- Create dependency tracking system with sequential numbering
- Create basic node and edge data structures
- Implement dependency list display (1:a->b, 2:b->c format)
- Implement simple static layout (e.g., grid or circle)
- Basic rendering with nodes and connecting lines

### Phase 3: Algorithm Framework
- Design pluggable layout algorithm interface
- Implement initial simple algorithms:
  - Random placement
  - Grid layout
  - Simple hierarchical layout

### Phase 4: Interactive Features
- Node dragging capability
- Zoom and pan functionality
- Algorithm parameter controls
- Visual styling improvements

### Phase 5: Algorithm Development Support
- Multiple algorithm comparison view
- Performance metrics display
- Algorithm debugging tools
- Export/import functionality for test cases

## Technical Considerations

### Graph Data Structure
```javascript
interface Node {
  id: string;
  x: number;
  y: number;
  dependencies: string[]; // IDs of nodes that this node depends on
}

interface Edge {
  id: number;
  from: string;
  to: string;
  label: string; // display text like "a->b"
}

interface Graph {
  nodes: Map<string, Node>; // key: node id, value: node object
  edges: Edge[];
}
```

### Algorithm Interface
```javascript
// TODO: Define specific parameter types for each algorithm
// interface ForceDirectedParameters {
//   springLength: number;
//   springStrength: number;
//   repulsionForce: number;
//   iterations: number;
// }
// 
// interface GridLayoutParameters {
//   spacing: number;
//   columns: number;
// }
// 
// type AlgorithmParameters = ForceDirectedParameters | GridLayoutParameters | ...;

interface LayoutAlgorithm {
  name: string;
  layout(graph: Graph): void;
  // parameters?: AlgorithmParameters;
}
```

### Development Workflow
- Modify algorithm in source code
- Vite hot reload triggers automatic re-layout
- Instant visual feedback on algorithm changes
- Iterative development and testing

## Project Configuration

### Workspace Integration
- Package name: `@kuumu/graph-drawing-demo`
- Port: 3002 (3001 is used by layouter-demo)
- Package manager: npm (consistent with existing workspace)
- Follow existing workspace conventions and vite-config-base structure

### Dependencies
- No Three.js dependency (SVG-only rendering)
- Include @kuumu/dev-logger for development experience
- TypeScript configuration consistent with other apps

### Vite Configuration
- Extends createBaseConfig with port 3002
- Includes dev-logger plugins for development workflow
- SVG rendering optimizations
- Hot reload for algorithm development

## File Structure
```
frontend/apps/graph-drawing-demo/
├── index.html
├── package.json
├── vite.config.ts
├── src/
│   ├── main.ts
│   ├── graph/
│   │   ├── parser.ts
│   │   ├── dependency-tracker.ts
│   │   ├── graph.ts
│   │   └── index.ts
│   ├── layout/
│   │   ├── algorithm-interface.ts
│   │   ├── simple-layouts.ts
│   │   └── index.ts
│   ├── renderer/
│   │   ├── svg-renderer.ts
│   │   └── index.ts
│   └── ui/
│       ├── controls.ts
│       └── index.ts
```

## Timeline Estimates

### Phase 1: Basic Setup (3 points)
- Project structure and Vite configuration
- Basic HTML/CSS layout
- Development environment verification

### Phase 2: Core Functionality (5 points)
- Graph parsing implementation
- Basic data structures
- Simple rendering system

### Phase 3: Algorithm Framework (4 points)
- Algorithm interface design
- Initial layout implementations
- Hot reload integration

### Phase 4: Interactive Features (3 points)
- User interaction handling
- Visual enhancements
- UI controls

### Phase 5: Development Tools (2 points)
- Algorithm comparison tools
- Performance monitoring
- Testing utilities

Total estimated effort: 17 points

## Success Criteria
- Text input "a->b" creates visual graph with nodes a and b connected
- Sequential dependencies are numbered and displayed (1:a->b, 2:b->c, etc.)
- Algorithm changes in source code immediately update visualization
- Smooth development experience with hot reload
- Easy algorithm experimentation and validation
- Foundation for future algorithm development and testing
