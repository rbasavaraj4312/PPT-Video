import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  X, 
  Wand2, 
  Copy, 
  Check, 
  ArrowRight, 
  Play, 
  Layers, 
  Plus, 
  FilePlus2, 
  Trash2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Tv, 
  Smartphone 
} from 'lucide-react';

const SAMPLE_TEMPLATES = [
  {
    title: 'Project Astraea: Deep Space Drone Swarm (8 Slides)',
    theme: 'cyber-neon',
    outline: `Title: Project Astraea: Autonomous Deep Space Drone Swarm Protocol
Theme: cyber-neon

# Slide 1: Project Astraea: Autonomous Deep Space Drone Swarm
Layout: hero
Transition: morph
Duration: 3.5
(icon: zap) The 2035 Interplanetary Defense, Mining & Quantum Mesh Protocol for Sovereign Deep-Space Autonomous Fleets

# Slide 2: The Distributed Orbital Swarm Architecture
Layout: hub-spoke
Transition: morph
Duration: 4.0
(icon: cpu) Quantum Core Relay: Central photonic edge coordinator and consensus engine
(icon: globe) Sensor Lidar Array: 360-degree optical telemetry and gravitational wave sensing
(icon: shield) Kinetic Intercept Swarm: High-velocity autonomous deflector drones for planetary shielding
(icon: zap) Solar Induction Harvester: Continuous high-yield energy collection and beam distribution
(icon: database) Swarm Memory Mesh: Distributed holographic ledger storing fleet state and trajectory matrices

# Slide 3: Autonomous Threat Detection & Intercept Flow
Layout: flow
Transition: morph
Duration: 4.0
(icon: globe) Sensor Lidar Array: Deep-space optical & radar detection of high-velocity rogue asteroids
[Sensor Lidar Array] -> [Quantum Core Relay]
(icon: cpu) Quantum Core Relay: Microsecond orbital mechanics vectoring and drone strike allocation
[Quantum Core Relay] -> [Kinetic Intercept Swarm]
(icon: shield) Kinetic Intercept Swarm: Precision micro-thruster burn and kinetic deflection strike
[Kinetic Intercept Swarm] -> [Solar Induction Harvester]
(icon: zap) Solar Induction Harvester: Mineral telemetry capture and rare-earth ore beam extraction

# Slide 4: Earth Mission Control vs Sovereign Swarm Autonomy
Layout: comparison
Transition: morph
Duration: 4.0
Left: Earth Mission Control
(icon: server) Centralized Ground Uplink: 40-Minute Speed-of-Light Delay
- Tele-operation latency makes real-time asteroid interception impossible
- Catastrophic single point of failure if planetary ground stations degrade
- Rigid scheduled communication windows with extensive orbital blind spots

Right: Astraea Swarm Mesh
(icon: cpu) Autonomous Edge Consensus: 0.4ms Photonic Gossip
- Byzantine fault-tolerant consensus executed at edge across all drones
- Dynamic mesh self-heals instantaneously if individual units are damaged
- Continuous uninterrupted 360-degree planetary defense envelope

# Slide 5: Swarm Telemetry & Performance Matrix
Layout: metrics
Transition: morph
Duration: 4.0
(icon: zap) 0.4ms | Gossip Latency: Sub-millisecond peer-to-peer photonic optical crosslink
(icon: globe) 250,000 | Active Drones: Autonomous micro-units coordinated in synchronized orbit
(icon: shield) 99.999% | Intercept Precision: Micro-radian kinetic trajectory targeting accuracy
(icon: cpu) Zero | Ground Dependency: Fully autonomous sovereign operational decision loops

# Slide 6: Quantum Edge Autonomy: The Neural Core Engine
Layout: split
Transition: morph
Duration: 4.0
(icon: cpu) Astraea Photonic Neural Core: Radiation-hardened cryogenic processing unit executing 500 Tera-Operations per watt using optical tensor matrices. Operates continuously in deep vacuum at 4 Kelvin, calculating n-body orbital mechanics and kinetic intercept trajectories in microsecond cycles without thermal degradation.
(icon: shield) Radiation-Proof Diamond Substrate: Impervious to cosmic rays and intense solar radiation storms
(icon: globe) Multi-Band Optical Crosslink: 100 Gbps free-space laser interconnect across all swarm nodes
(icon: database) Holographic Synaptic Memory: Atomic-layer state preservation resistant to electromagnetic pulse

# Slide 7: Interplanetary Deployment Roadmap 2026-2035
Layout: timeline
Transition: morph
Duration: 4.0
(icon: globe) Phase 1: LEO Swarm Mesh: 10,000 unit testing constellation in low-Earth orbit
(icon: cpu) Phase 2: Lunar Orbital Gateway: Autonomous mining and kinetic relay stations at Lagrange points
(icon: shield) Phase 3: Asteroid Belt Intercept: Long-range planetary defense grid and resource extraction
(icon: zap) Phase 4: Interplanetary Sovereign Mesh: Autonomous solar-system-wide transport corridors

# Slide 8: The Sovereign Deep Space Frontier
Layout: hero
Transition: morph
Duration: 3.5
(icon: shield) Zero Latency. Zero Vulnerability. Planetary Defense Through Autonomous Swarm Intelligence.
`,
  },
  {
    title: 'RAG Masterclass (25 Slides)',
    theme: 'midnight',
    outline: `Title: Retrieval-Augmented Generation (RAG): Complete Architecture & Production Guide
Theme: midnight

# Slide 1: Retrieval-Augmented Generation (RAG)
Layout: hero
(icon: zap) Complete Architecture & Production Blueprint: Industrial-Grade LLM Systems with Grounded Knowledge Retrieval

# Slide 2: Limitations of Pure LLMs
Layout: cards
(icon: alert-triangle) Knowledge Cutoffs: Static Weights Cannot Answer Fresh Information
(icon: bug) Hallucinations: Confident Plausible Lies Without Ground Truth Verification
(icon: lock) Private Data Blindness: Internal Enterprise Documents Absent from Pretraining
(icon: cpu) Retraining Prohibitive: Continuous Fine-Tuning Costs Millions in Compute

# Slide 3: The Three Pillars of RAG
Layout: flow
(icon: folder) 1. Ingestion: Document Parsing Chunking & Vector Indexing
[1. Ingestion] -> [2. Retrieval]
(icon: search) 2. Retrieval: Semantic Hybrid Search & Context Re-Ranking
[2. Retrieval] -> [3. Generation]
(icon: cpu) 3. Generation: Grounded Synthesis with Citation Attribution

# Slide 4: Document Ingestion Pipeline
Layout: flow
(icon: file-text) Unstructured Data: Raw PDFs Markdown HTML & Audio Transcripts
[Unstructured Data] -> [Document Parsers]
(icon: code) Document Parsers: Layout-Aware OCR Table & Heading Extraction
[Document Parsers] -> [Clean Markdown]
(icon: check-circle) Clean Markdown: Normalized Text with Preserved Hierarchy

# Slide 5: Chunking Strategies Compared
Layout: comparison
Left: Fixed-Window Splitting
(icon: table) Arbitrary Token Count: Simple 512-Token Splits with 50-Token Overlap
- Fast and computationally trivial
- Often slices sentences and tables mid-thought
- Loses high-level conceptual boundaries

Right: Semantic & Recursive Splitting
(icon: binary) Structure-Aware Chunking: Splits by Headers Paragraphs & Embeddings
- Preserves complete thoughts and table schema
- Calculates cosine distance between adjacent sentences
- Yields significantly higher retrieval precision

# Slide 6: Dense Embedding Generation
Layout: flow
(icon: file-text) Clean Chunks: Text Blocks Sized for Embedding Context
[Clean Chunks] -> [Bi-Encoder Model]
(icon: cpu) Bi-Encoder Model: OpenAI Ada BGE-Large or GTE Transformers
[Bi-Encoder Model] -> [1536-D Vectors]
(icon: binary) 1536-D Vectors: Floating Point Embeddings in Semantic Space

# Slide 7: Vector Storage & Indexing
Layout: cards
(icon: database) Vector Database: Specialized Stores Like Milvus Pinecone Qdrant & pgvector
(icon: workflow) HNSW Graphs: Hierarchical Navigable Small World for Sub-Millisecond Search
(icon: archive) Product Quantization: Compresses High-Dim Vectors by 8x with Minimal Loss
(icon: hard-drive) Metadata Indexing: Co-locates Tenant IDs Dates and Access Permissions

# Slide 8: The Retrieval Execution Cycle
Layout: flow
(icon: terminal) User Query: Natural Language Question from Client
[User Query] -> [Query Embedder]
(icon: cpu) Query Embedder: Vectorizes User Query into Same Dimensional Space
[Query Embedder] -> [Vector DB]
(icon: database) Vector DB: Cosine Similarity Nearest Neighbors Scan
[Vector DB] -> [Top-K Chunks]
(icon: layers) Top-K Chunks: Candidate Document Segments Retrieved

# Slide 9: Dense vs Sparse Retrieval
Layout: comparison
Left: Dense Semantic Search
(icon: binary) Vector Embedding Similarity: Understands Synonyms Concepts & Intent
- Matches cardiac event to heart attack
- Captures abstract analogies and themes
- Struggles with exact part numbers, SKUs, and codes

Right: Sparse Lexical Search
(icon: search) BM25 & SPLADE Keyword Match: Strict Inverted Index Frequency
- Exact matching for acronyms, serials, and IDs
- No vocabulary mismatch on rare proper nouns
- Blind to paraphrasing and conceptual context

# Slide 10: Hybrid Search Architecture
Layout: flow
(icon: terminal) User Query: Single Inbound Query String
[User Query] -> [Dual Engine]
(icon: layers) Dual Engine: Parallel Execution of BM25 and Vector Search
[Dual Engine] -> [RRF Fusion]
(icon: workflow) RRF Fusion: Reciprocal Rank Fusion Combines Ranked Lists
[RRF Fusion] -> [Best Chunks]
(icon: check-circle) Best Chunks: High Recall Combining Semantic & Exact Terms

# Slide 11: Re-Ranking with Cross-Encoders
Layout: comparison
Left: Bi-Encoder 1st Stage
(icon: zap) Fast Approximate Retrieval: Searches Millions of Vectors in Under 10ms
- Computes query and chunk embeddings separately
- High recall but coarse relevance scores
- Filters 1,000,000 documents down to Top 50

Right: Cross-Encoder 2nd Stage
(icon: cpu) Deep Pairwise Re-Ranker: Cohere ReRank or BGE-Reranker-Large
- Jointly attends between query and candidate text
- Computes deep token-to-token semantic interaction
- Accurately re-orders Top 50 down to Top 5

# Slide 12: Context Compression & Deduplication
Layout: cards
(icon: scissors) LLMLingua: Removes Non-Essential Tokens While Retaining Information
(icon: layers) Semantic Deduplication: Discards Chunks with Near-Identical Embeddings
(icon: shield) Noise Filtering: Strips Disclaimers Navigation Footers and Boilers
(icon: clock) Latency Reduction: 60% Token Reduction Lowers LLM Time-to-First-Token

# Slide 13: Query Transformation Engine
Layout: flow
(icon: terminal) Vague Query: Ambiguous Multi-Part Question
[Vague Query] -> [Query Rewriter]
(icon: cpu) Query Rewriter: LLM Generates 3-5 Specific Sub-Questions
[Query Rewriter] -> [Parallel Search]
(icon: layers) Parallel Search: Dispatches Multi-Threaded Retrieval per Query
[Parallel Search] -> [Merged Evidence]
(icon: check-circle) Merged Evidence: Holistic Comprehensive Document Retrieval

# Slide 14: Hypothetical Document Embeddings (HyDE)
Layout: flow
(icon: terminal) User Question: Short Query Lacking Rich Vocabulary
[User Question] -> [Zero-Shot LLM]
(icon: cpu) Zero-Shot LLM: Generates Hypothetical Answer Hallucination
[Zero-Shot LLM] -> [Hypothetical Doc]
(icon: file-text) Hypothetical Doc: Answer Document with Target Lexicon
[Hypothetical Doc] -> [Vector DB]
(icon: database) Vector DB: Matches Document-to-Document Instead of Query-to-Doc

# Slide 15: Optimizing Context Placement
Layout: cards
(icon: eye) Lost in the Middle Effect: LLMs Recall Information at Ends Better Than Middle
(icon: workflow) Re-Ordering Strategy: Place Highest Re-Rank Scores at Very Top and Bottom
(icon: alert-triangle) Needle-in-a-Haystack: Distractor Chunks Degrade Reasoning Accuracy
(icon: check-circle) Bounded Context: Limit Total Injected Chunks to Under 4000 Tokens

# Slide 16: Grounded Generation Phase
Layout: flow
(icon: layers) Curated Context: Top-5 Re-Ranked Fact Chunks
[Curated Context] -> [System Prompt]
(icon: code) System Prompt: Strict Grounding Instructions & Citation Directives
[System Prompt] -> [LLM Generator]
(icon: cpu) LLM Generator: Synthesizes Fact-Checked Response
[LLM Generator] -> [Grounded Answer]
(icon: check-circle) Grounded Answer: Fact-Backed Response with Superscript Citations

# Slide 17: Self-Corrective RAG (CRAG)
Layout: flow
(icon: layers) Retrieved Chunks: Initial Candidate Evidence Set
[Retrieved Chunks] -> [Retrieval Evaluator]
(icon: shield-check) Retrieval Evaluator: Evaluates Relevance Score Above Confidence Threshold
[Retrieval Evaluator] -> [Dynamic Branching]
(icon: globe) Dynamic Branching: If Ambiguous Triggers Web Search or Fallback
[Dynamic Branching] -> [Synthesized Result]
(icon: check-circle) Synthesized Result: Zero-Hallucination Verified Output

# Slide 18: Agentic Multi-Index RAG
Layout: flow
(icon: terminal) Complex Request: Multi-Step Enterprise Question
[Complex Request] -> [Agent Router]
(icon: cpu) Agent Router: Decides Tools SQL Vector Graph or Web
[Agent Router] -> [Specialized Engines]
(icon: database) Specialized Engines: Executes SQL for Metrics and Vectors for Docs
[Specialized Engines] -> [Unified Synthesis]
(icon: check-circle) Unified Synthesis: Combines Structured & Unstructured Evidence

# Slide 19: Graph RAG Architecture
Layout: cards
(icon: workflow) Entity Extraction: Discovers People Systems Concepts and Explicit Relations
(icon: layers) Graph Topology: Connects Cross-Document Nodes via Knowledge Edges
(icon: binary) Community Summaries: Hierarchical Graph Summaries for Macro Understanding
(icon: search) Multi-Hop Traversal: Answers Complex Relationship Queries Vectors Miss

# Slide 20: Multimodal RAG Systems
Layout: cards
(icon: monitor) Visual Document Parsing: ColPali & Vision Models Read PDFs as Raw Images
(icon: table) Table Serialization: Converts Complex Financial Spreadsheets to Markdown/HTML
(icon: activity) Chart Interpretation: Translates Bar Graphs & Flowcharts into Data Tuples
(icon: hard-drive) Multimodal Vector Stores: Stores Image Embeddings & Text Embeddings Together

# Slide 21: RAG Evaluation Metrics (RAGAS)
Layout: cards
(icon: shield-check) Context Relevance: Are the Retrieved Chunks Focused Without Clutter?
(icon: check-circle) Groundedness (Faithfulness): Can Every Generated Claim Be Backed by Context?
(icon: activity) Answer Relevance: Does the Response Directly Address the User Prompt?
(icon: clock) Synthetic Test Generation: Uses LLMs to Generate Golden Question-Answer Sets

# Slide 22: Enterprise Guardrails Pipeline
Layout: flow
(icon: cpu) Raw LLM Output: Preliminary Generated Answer
[Raw LLM Output] -> [NLI Entailment]
(icon: shield) NLI Entailment: Verifies Strict Logical Entailment from Source Context
[NLI Entailment] -> [Policy Checks]
(icon: lock) Policy Checks: PII Redaction Prompt Injection Defense & Tone Guard
[Policy Checks] -> [Certified Output]
(icon: check-circle) Certified Output: Safe Auditable Response to User Client

# Slide 23: Production Caching & Latency
Layout: cards
(icon: zap) Semantic Cache: GPTCache Serves Cached Answers for Semantically Similar Queries
(icon: binary) Embedding Memoization: Caches Recurring User Query Vectors in Redis
(icon: activity) TTFT Optimization: Streams Chunks with Progressive Rendering to UI
(icon: server) Read Replicas: Horizontally Scales Vector DB Endpoints for 1000+ QPS

# Slide 24: Enterprise Multi-Tenancy & RBAC
Layout: cards
(icon: lock) Document-Level Permissions: Propagates Active Directory & IAM ACLs to Chunks
(icon: shield) Pre-Retrieval Filtering: Injects Tenant ID Metadata Constraint into Vector Query
(icon: fingerprint) Zero-Trust Isolation: Prevents Tenant A from Ever Seeing Tenant B Data
(icon: eye) Audit Logging: Complete Immutable Trace of Every Query Chunk & Answer

# Slide 25: The Future of RAG
Layout: hero
(icon: cpu) RAG Remains the Enterprise Backbone: Million-Token Contexts Complement RAG by Serving Deep Reasoning While Vectors Provide Cost-Effective Scalable Grounding
`,
  },
  {
    title: 'Microservices Flow & Morph',
    theme: 'modern-dark',
    outline: `Title: Cloud Microservices Architecture
Theme: modern-dark

# Slide 1: Ingestion & Gateway
Layout: flow
(icon: globe) Client App: Web & Mobile Traffic
[Client App] -> [API Gateway]
(icon: router) API Gateway: Reverse Proxy & Rate Limiting
[API Gateway] -> [Auth Service]
(icon: shield) Auth Service: OAuth2 & JWT Verification

# Slide 2: Core Processing & Storage
Layout: flow
(icon: router) API Gateway: Reverse Proxy & Rate Limiting
[API Gateway] -> [Compute Workers]
(icon: cpu) Compute Workers: Distributed Async Processing
[Compute Workers] -> [PostgreSQL DB]
(icon: database) PostgreSQL DB: Persistent Primary Store

# Slide 3: Resilience & Telemetry
Layout: cards
(icon: hard-drive) Read Replicas: High Availability & Low Read Latency
(icon: activity) OpenTelemetry: Distributed Tracing & APM Metrics
(icon: lock) Secret Vault: Zero-Trust Key Management
(icon: zap) Edge Cache: Global CDN Sub-10ms Delivery
`,
  },
  {
    title: 'SQL vs Vector Database',
    theme: 'midnight',
    outline: `Title: Relational vs Vector Storage
Theme: midnight

# Slide 1: Database Paradigm Comparison
Layout: comparison
Left: Relational SQL
(icon: database) PostgreSQL: ACID Transactions & Relational Schema
- Strict B-Tree Indices
- Exact Keyword & Foreign Key Queries
- Vertical Scaling & Structured Tables

Right: Vector Search Engine
(icon: binary) Milvus / Pinecone: High-Dimensional Semantic Embeddings
- HNSW Approximate Nearest Neighbors
- Dense Floating Point Similarity Cosine
- Horizontal Elastic Sharding for RAG

# Slide 2: Hybrid RAG Architecture
Layout: flow
(icon: terminal) User Prompt: Raw Query Text
[User Prompt] -> [Vector DB]
(icon: binary) Vector DB: Semantic Retrieval Top-K
[Vector DB] -> [LLM Synthesizer]
(icon: cpu) LLM Synthesizer: Context Augmentation & Generation
`,
  },
  {
    title: 'Modern CI/CD Pipeline',
    theme: 'emerald-dark',
    outline: `Title: Autonomous CI/CD Pipeline
Theme: emerald-dark

# Slide 1: Continuous Delivery Workflow
Layout: flow
(icon: git-commit) Git Push: Feature Branch Commit
[Git Push] -> [Test Automation]
(icon: bug) Test Automation: Parallel Unit & E2E Tests
[Test Automation] -> [Container Build]
(icon: boxes) Container Build: Multi-Stage Docker Image
[Container Build] -> [K8s Cluster]
(icon: layers) K8s Cluster: Blue-Green Zero-Downtime Deploy
`,
  },
  {
    title: 'System Design: Rate Limiter & Kafka (5 Slides)',
    theme: 'modern-dark',
    outline: `Title: System Design: Scalable Rate Limiter & Event Stream
Theme: modern-dark
Format: 16:9

# Slide 1: Distributed Token Bucket Limiter
Layout: code-walkthrough
Code: [rate_limiter.py]
def allow_request(user_id: str, capacity: int = 100, refill_rate: float = 10.0):
    current = redis.get(f"tokens:{user_id}")
    if current and int(current) > 0:
        redis.decr(f"tokens:{user_id}")
        return {"allowed": True, "remaining": int(current) - 1}
    return {"allowed": False, "retry_after": 60}
- (icon: clock) [1] Sliding Window Check: Evaluates remaining token quota in low-latency Redis cache
- (icon: zap) [2] Atomic Decrement: Safely consumes tokens under concurrent high-throughput traffic
- (icon: shield) [3] 429 Rejection Guard: Drops burst attacks and protects downstream services

# Slide 2: Production GenAI Cloud Architecture
Layout: architecture-layers
- (icon: globe) Layer 1 | Edge & CDN: Next.js 15, Cloudflare CDN, Edge Middleware
- (icon: router) Layer 2 | API Gateway: Kong Mesh, Token Bucket Rate Limiting, OAuth2
- (icon: cpu) Layer 3 | AI Compute Mesh: FastAPI, vLLM Clusters, Semantic Router
- (icon: database) Layer 4 | Storage Tier: Qdrant Vector DB, PostgreSQL, Redis Cache

# Slide 3: Database Overload: Polling vs Real-Time Push
Layout: problem-solution
Problem: Legacy HTTP Polling
- (icon: alert-triangle) 100,000 active clients pinging database every 2 seconds
- (icon: server) 99% of requests return identical empty 304 payloads
- (icon: bug) Connection pool exhaustion brings down auth service
Solution: Bidirectional WebSocket Mesh
- (icon: check-circle) Single persistent duplex TCP connection per client
- (icon: zap) Events pushed only when Postgres row state mutates
- (icon: activity) 94% reduction in server CPU and egress bandwidth

# Slide 4: Real-Time Clickstream Pipeline
Layout: event-stream
(icon: globe) Ingestion: Mobile & Web Telemetry SDKs
(icon: server) Kafka Broker: 16-Partition Distributed Queue
(icon: cpu) Flink Workers: 10s Tumbling Window Aggregator
(icon: database) ClickHouse: Columnar Real-Time Analytics Engine

# Slide 5: Storage Engine Decision Matrix
Layout: feature-matrix
PostgreSQL | Relational: ACID transactions, SQL joins, persistent OLTP storage
Redis | In-Memory: Sub-millisecond latency, RAM-based key-value caching
ClickHouse | Columnar OLAP: High-throughput batch inserts, real-time analytics
`,
  },
  {
    title: 'Node.js & DevOps: Event Loop & Bento (4 Slides)',
    theme: 'emerald-dark',
    outline: `Title: High-Performance DevOps & Runtime Architecture
Theme: emerald-dark
Format: 16:9

# Slide 1: Kubernetes Pod Reconciliation Loop
Layout: circular-loop
(icon: eye) 1. Observe: Kubelet detects desired vs actual replica count
(icon: cpu) 2. Diff: Controller manager calculates cluster state delta
(icon: zap) 3. Act: Scheduler assigns new pod to healthy worker node
(icon: check-circle) 4. Verify: Readiness probe confirms container health

# Slide 2: Turborepo 2.0 Architectural Overhaul
Layout: bento-box
(icon: zap) Remote Caching Engine: Zero-computation rebuilds across CI/CD workers with hash-addressed artifacts stored in global edge buckets
(icon: cpu) 10x | Build Speedup: Rust daemon replacing Go worker
(icon: workflow) Task Graph Pruning: Topological DAG execution
(icon: shield) Zero Config: Auto-discovers monorepo workspaces

# Slide 3: Synchronous vs Event-Driven Microservices
Layout: problem-solution
Problem: Synchronous REST Chain
- Cascading timeouts when one downstream service slows
- Thread starvation under burst traffic
- Tight coupling across microservice boundaries
Solution: Event-Driven Kafka Mesh
- Fully decoupled async publisher/subscriber model
- Backpressure handling with partitioned queues
- Zero downtime during consumer deployment

# Slide 4: Frontend Framework Tradeoff Matrix
Layout: feature-matrix
Next.js | Full-Stack: Server Actions, SSR, edge routing, enterprise ecosystem
Vite + React | Client SPA: Instant HMR, zero build overhead, simple hosting
Astro | Content-First: Zero JS by default, Island architecture, fast SEO
`,
  },
  {
    title: 'Starter Template (3 Slides)',
    theme: 'modern-dark',
    outline: `Title: Interactive Presentation
Theme: modern-dark

# Slide 1: Welcome to Slide Studio
Layout: hero
(icon: zap) High-Impact Animated Presentation Engine with 60 FPS Morphs

# Slide 2: Workflow Architecture
Layout: flow
(icon: edit) Markdown Outline: Human-readable slide syntax
[Markdown Outline] -> [Layout Engine]
(icon: cpu) Layout Engine: Smart coordinate & grid placement
[Layout Engine] -> [Morph Transitions]
(icon: activity) Morph Transitions: Seamless element interpolation

# Slide 3: Key Advantages
Layout: cards
(icon: zap) 90% Fewer Tokens: Fast outline generation
(icon: shield) Zero Overlap: Algorithmic positioning
(icon: globe) Multi-Platform: Export to PPTX & 4K MP4 Video
`,
  },
];

const PROMPT_GUIDE = `You are a presentation architect. Write slides using this concise semantic outline syntax (~60 tokens/slide):

Title: <Presentation Title>
Theme: modern-dark | midnight | emerald-dark | sunset | clean-light | cyber-neon | quantum-gold
Format: 16:9 | 9:16

# Slide 1: <Slide Title>
Layout: code-walkthrough | architecture-layers | problem-solution | circular-loop | event-stream | bento-box | feature-matrix | flow | hero | cards | comparison | metrics | timeline | split | hub-spoke
Transition: morph
Duration: 3.5

# Code walkthrough:
Code: [filename.py]
<code>
- [1] Step 1 title: Explanation

# Problem vs Solution:
Problem: <Issue Title>
- Bullet issues
Solution: <Fix Title>
- Bullet fixes

# Tiered Stack:
- Layer 1 | Tier: Tech stack details

# Entities & Connections:
(icon: <icon-name>) <Entity Title>: <Entity Subtitle>
[Source] -> [Target]
- Bullet point description

Available icons: database, server, cloud, globe, router, wifi, cpu, layers, boxes, hard-drive, folder, terminal, code, git-branch, workflow, shield, lock, key, user, users, building, laptop, smartphone, zap, activity, check-circle, clock, repeat, eye.
`;

export function AiOutlineModal({
  isOpen,
  onClose,
  onCompileOutline,
  isEditorMode = false,
  currentSlideCount = 0,
}) {
  const [outline, setOutline] = useState(SAMPLE_TEMPLATES[0].outline);
  const [selectedTheme, setSelectedTheme] = useState('modern-dark');
  const [isCompiling, setIsCompiling] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showSyntaxGuide, setShowSyntaxGuide] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const detectedSlideCount = useMemo(() => {
    if (!outline.trim()) return 0;
    const matches = outline.match(/^(?:#{1,4}\s*(?:Slide\s*\d*[:.]?)?|Slide\s+\d+[:.]?|---\s*(?:Slide\s*\d*[:.]?)?)\s*(.*)$/gmi);
    return matches ? matches.length : (outline.trim().length > 10 ? 1 : 0);
  }, [outline]);

  if (!isOpen) return null;

  const handleCompile = async (insertMode = false) => {
    if (!outline.trim()) return;
    setIsCompiling(true);
    setErrorMsg(null);
    try {
      await onCompileOutline(outline, selectedTheme, insertMode);
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to compile outline. Check syntax and try again.');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(PROMPT_GUIDE);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Approach 4: AI Semantic Outline Engine
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                  90% Token Reduction
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Write or paste human-readable outlines with icons and flow arrows. The engine generates exact 1280×720 layouts and 60 FPS morphs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates Bar */}
        <div className="px-6 py-2.5 bg-slate-100/60 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs overflow-x-auto">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium whitespace-nowrap flex items-center gap-1">
              <Layers size={14} /> Presets:
            </span>
            {SAMPLE_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => {
                  setOutline(tpl.outline);
                  setSelectedTheme(tpl.theme);
                }}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-blue-500 dark:hover:border-blue-500 transition font-medium whitespace-nowrap shadow-sm"
              >
                {tpl.title}
              </button>
            ))}
            <button
              onClick={() => {
                setOutline('Title: New Presentation\nTheme: modern-dark\nFormat: 16:9\n\n# Slide 1: Introduction\nLayout: hero\n(icon: zap) Enter subtitle or topic overview here\n');
              }}
              className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition font-medium whitespace-nowrap shadow-sm"
            >
              + Blank
            </button>
            <button
              onClick={() => setOutline('')}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-200/70 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition whitespace-nowrap"
              title="Clear text editor"
            >
              <Trash2 size={12} />
              <span>Clear</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSyntaxGuide(!showSyntaxGuide)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition whitespace-nowrap shadow-sm"
            >
              <HelpCircle size={13} className="text-blue-500" />
              <span>Syntax Guide</span>
              {showSyntaxGuide ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            <button
              onClick={handleCopyPrompt}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg transition whitespace-nowrap shadow-sm"
              title="Copy prompt instructions to give to Claude, GPT-4, or Gemini"
            >
              {copiedPrompt ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
              <span>{copiedPrompt ? 'Copied Prompt!' : 'Copy LLM Prompt'}</span>
            </button>
          </div>
        </div>

        {/* Optional Collapsible Syntax Guide Card */}
        {showSyntaxGuide && (
          <div className="px-6 py-3 bg-blue-50/70 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-900/60 text-xs text-slate-700 dark:text-slate-300 animate-in fade-in duration-150">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-[11px]">
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <div className="font-bold font-sans text-blue-700 dark:text-blue-300 mb-1">Header & Slide Tags</div>
                <div>Title: Presentation Name</div>
                <div>Theme: modern-dark | midnight | ...</div>
                <div>Format: 16:9 | 9:16 (Reels/Shorts)</div>
                <div># Slide 1: Slide Title</div>
                <div>Transition: morph | Duration: 3.5</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <div className="font-bold font-sans text-blue-700 dark:text-blue-300 mb-1">Tech Teaching Layouts</div>
                <div>Layout: code-walkthrough</div>
                <div>Layout: architecture-layers</div>
                <div>Layout: problem-solution</div>
                <div>Layout: circular-loop</div>
                <div>Layout: event-stream | bento-box</div>
                <div>Layout: feature-matrix | flow | hero</div>
              </div>
              <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-blue-100 dark:border-blue-900/40">
                <div className="font-bold font-sans text-blue-700 dark:text-blue-300 mb-1">Directives & Code Blocks</div>
                <div>Code: [filename.py]</div>
                <div>- [1] Step Title: Explanation</div>
                <div>Problem: Issue | Solution: Fix</div>
                <div>- Layer 1 | Tier: Tech stack</div>
                <div>(icon: cpu) [A] -&gt; [B]</div>
              </div>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 flex flex-col min-h-[320px] overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Slide Outline & Directives
              </label>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                detectedSlideCount > 0 
                  ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {detectedSlideCount} {detectedSlideCount === 1 ? 'slide' : 'slides'} detected
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Theme:</span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="modern-dark">Modern Dark (Blue)</option>
                <option value="midnight">Midnight (Indigo)</option>
                <option value="emerald-dark">Emerald Dark (Green)</option>
                <option value="sunset">Sunset (Amber/Orange)</option>
                <option value="clean-light">Clean Light (White)</option>
              </select>
            </div>
          </div>

          <textarea
            value={outline}
            onChange={(e) => setOutline(e.target.value)}
            placeholder="Type or paste outline here... (e.g., # Slide 1: Introduction&#10;Layout: hero&#10;(icon: zap) Main Concept)"
            className="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none min-h-[260px]"
          />

          {errorMsg && (
            <div className="mt-3 p-3 text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-600 dark:text-red-400 flex items-center gap-2">
              <X size={14} />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
            {detectedSlideCount > 0 ? (
              <span className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
                <Sparkles size={13} />
                <span>Ready to compile {detectedSlideCount} {detectedSlideCount === 1 ? 'slide' : 'slides'}</span>
              </span>
            ) : (
              <span>Tip: Outline lines like <code className="text-blue-500 dark:text-blue-400 font-semibold">[A] -&gt; [B]</code> connect elements with auto-aligned arrows.</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>

            {isEditorMode ? (
              <>
                <button
                  onClick={() => handleCompile(false)}
                  disabled={isCompiling || !outline.trim()}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition shadow-xs disabled:opacity-50"
                  title="Create a new presentation from this outline"
                >
                  <FilePlus2 size={14} />
                  <span>Open as New Deck</span>
                </button>
                <button
                  onClick={() => handleCompile(true)}
                  disabled={isCompiling || !outline.trim()}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition"
                  title="Insert the compiled slides into your current presentation"
                >
                  {isCompiling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Compiling Slides...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} />
                      <span>Insert into Current Presentation {detectedSlideCount > 0 ? `(+${detectedSlideCount})` : ''}</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => handleCompile(false)}
                disabled={isCompiling || !outline.trim()}
                className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-md transition"
              >
                {isCompiling ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Compiling Geometry & Morphs...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>Compile into Slides</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
