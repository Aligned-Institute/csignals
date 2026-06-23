// terminal/src/components/ecosystem/ecosystemData.ts

// --- Interfaces ---

export interface AICompanyService {
  id: string;
  name: string;
  company: string;
  description: string;
  isKnown: boolean;
}

export interface FeatureItem {
  id: string;
  name: string;
}

export interface CategoryWithMapping {
  id: string;
  name: string;
  description: string;
  features: FeatureItem[];
  knownServices: AICompanyService[];
  serviceFeatureMap: Record<string, string[]>;
}

// --- Known Services ---

const SERVICES: Record<string, AICompanyService> = {
  'claude-3-opus': { id: 'claude-3-opus', name: 'Claude 3 Opus', company: 'Anthropic', description: 'Frontier AI model by Anthropic.', isKnown: true },
  'gpt-4o': { id: 'gpt-4o', name: 'GPT-4o', company: 'OpenAI', description: 'Flagship multimodal model from OpenAI.', isKnown: true },
  'gemini-advanced': { id: 'gemini-advanced', name: 'Gemini Advanced', company: 'Google/Deepmind', description: 'Google/Deepmind most capable model family.', isKnown: true },
  'llama-3': { id: 'llama-3', name: 'Llama 3', company: 'Meta', description: 'Meta open-source large language model.', isKnown: true },
  'grok-1': { id: 'grok-1', name: 'Grok-1', company: 'xAI', description: 'xAI first generation large language model.', isKnown: true },
  'deepseek-coder': { id: 'deepseek-coder', name: 'Deepseek Coder', company: 'Deepseek', description: 'Open-source coding LLM from Deepseek.', isKnown: true },
  'qwen-2': { id: 'qwen-2', name: 'Qwen-2', company: 'Qwen', description: 'Alibaba Cloud powerful LLM series.', isKnown: true },
  'mistral-large': { id: 'mistral-large', name: 'Mistral Large', company: 'Mistral AI', description: 'Mistral AI top-tier language model.', isKnown: true },
};

const s = (id: string) => SERVICES[id];

// --- Flat Category Data ---

export const ECOSYSTEM_CATEGORIES: CategoryWithMapping[] = [
  {
    id: 'agentic-ai',
    name: 'Agentic AI',
    description: 'Automate entire processes with AI.',
    features: [
      { id: 'agent-protocols', name: 'Agent Protocols' },
      { id: 'intent-preservation', name: 'Intent Preservation' },
      { id: 'self-improving-agents', name: 'Self-improving Agents' },
      { id: 'rollback-mechanisms', name: 'Rollback Mechanisms' },
      { id: 'feedback-loops-evaluators', name: 'Feedback Loops & Evaluators' },
      { id: 'cost-resource-management', name: 'Cost & Resource Management' },
      { id: 'long-term-autonomy', name: 'Long-term Autonomy & Goal Chaining' },
      { id: 'governance-safety-guardrails', name: 'Governance, Safety & Guardrails' },
      { id: 'memory-governance', name: 'Memory Governance & Retention Policies' },
      { id: 'observability-tracing', name: 'Observability & Tracing' },
      { id: 'delegation-handoff-protocols', name: 'Delegation & Handoff Protocols' },
      { id: 'risk-management-constraints', name: 'Risk Management & Constraints' },
      { id: 'agent-marketplaces-contracts', name: 'Agent Marketplaces & Contracts' },
      { id: 'failure-recovery-replanning', name: 'Failure Recovery & Replanning' },
      { id: 'dynamic-tooling', name: 'Dynamic Tooling' },
    ],
    knownServices: [s('claude-3-opus'), s('gpt-4o'), s('gemini-advanced'), s('llama-3')],
    serviceFeatureMap: {
      'claude-3-opus': [
        'agent-protocols', 'intent-preservation', 'governance-safety-guardrails',
        'memory-governance', 'observability-tracing', 'delegation-handoff-protocols',
        'risk-management-constraints', 'failure-recovery-replanning',
      ],
      'gpt-4o': [
        'agent-protocols', 'self-improving-agents', 'rollback-mechanisms',
        'feedback-loops-evaluators', 'cost-resource-management', 'long-term-autonomy',
        'dynamic-tooling',
      ],
      'gemini-advanced': [
        'agent-protocols', 'feedback-loops-evaluators', 'cost-resource-management',
        'observability-tracing', 'long-term-autonomy', 'agent-marketplaces-contracts',
      ],
      'llama-3': [
        'agent-protocols', 'self-improving-agents', 'dynamic-tooling', 'rollback-mechanisms',
      ],
    },
  },
  {
    id: 'ai-agents',
    name: 'AI Agents',
    description: 'Execute complex tasks autonomously.',
    features: [
      { id: 'agent-coordination', name: 'Agent Coordination & Communication' },
      { id: 'multi-agent-collaboration', name: 'Multi-agent Collaboration' },
      { id: 'state-persistence', name: 'State Persistence' },
      { id: 'planning', name: 'Planning (ReAct, CoT, ToT)' },
      { id: 'task-scheduling-prioritisation', name: 'Task Scheduling & Prioritisation' },
      { id: 'goal-decomposition', name: 'Goal Decomposition' },
      { id: 'tool-orchestration', name: 'Tool Orchestration (actions/plugins)' },
      { id: 'context-management', name: 'Context Management (state & history)' },
      { id: 'human-in-the-loop-oversight', name: 'Human-in-the-Loop Oversight' },
      { id: 'memory-systems', name: 'Memory Systems (short-term & long-term)' },
      { id: 'self-reflection-error-recovery', name: 'Self-reflection & Error Recovery' },
      { id: 'autonomous-execution', name: 'Autonomous Execution' },
      { id: 'output-validation', name: 'Output Validation' },
      { id: 'frameworks-runtimes', name: 'Frameworks & Runtimes' },
      { id: 'tool-use-function-calling', name: 'Tool Use & Function Calling' },
    ],
    knownServices: [
      s('claude-3-opus'), s('gpt-4o'), s('gemini-advanced'),
      s('llama-3'), s('grok-1'), s('mistral-large'),
    ],
    serviceFeatureMap: {
      'claude-3-opus': [
        'agent-coordination', 'state-persistence', 'planning', 'goal-decomposition',
        'context-management', 'human-in-the-loop-oversight', 'memory-systems',
        'self-reflection-error-recovery', 'tool-use-function-calling',
      ],
      'gpt-4o': [
        'agent-coordination', 'multi-agent-collaboration', 'planning', 'tool-orchestration',
        'autonomous-execution', 'output-validation', 'tool-use-function-calling',
        'frameworks-runtimes',
      ],
      'gemini-advanced': [
        'agent-coordination', 'state-persistence', 'planning',
        'task-scheduling-prioritisation', 'context-management', 'memory-systems',
        'output-validation',
      ],
      'llama-3': [
        'agent-coordination', 'planning', 'autonomous-execution',
        'frameworks-runtimes', 'tool-use-function-calling',
      ],
      'grok-1': [
        'agent-coordination', 'planning', 'autonomous-execution',
        'self-reflection-error-recovery',
      ],
      'mistral-large': [
        'agent-coordination', 'planning', 'tool-orchestration',
        'context-management', 'tool-use-function-calling',
      ],
    },
  },
  {
    id: 'gen-ai',
    name: 'Gen AI',
    description: 'Generate content and code at scale.',
    features: [
      { id: 'summarisation', name: 'Summarisation' },
      { id: 'personalisation', name: 'Personalisation' },
      { id: 'multimodal-generation', name: 'Multimodal Generation (text, image, audio)' },
      { id: 'hallucination-mitigation', name: 'Hallucination Mitigation' },
      { id: 'prompt-engineering', name: 'Prompt Engineering' },
      { id: 'rag', name: 'Retrieval-Augmented Generation (RAG)' },
      { id: 'speech-interfaces', name: 'Speech Interfaces (TTS & ASR)' },
      { id: 'audio-music-generation', name: 'Audio/Music Generation' },
      { id: 'video-generation', name: 'Video Generation' },
      { id: 'image-generation', name: 'Image Generation' },
      { id: 'code-generation', name: 'Code Generation' },
    ],
    knownServices: [
      s('claude-3-opus'), s('gpt-4o'), s('gemini-advanced'), s('llama-3'),
      s('grok-1'), s('deepseek-coder'), s('qwen-2'), s('mistral-large'),
    ],
    serviceFeatureMap: {
      'claude-3-opus': [
        'summarisation', 'hallucination-mitigation', 'prompt-engineering',
        'rag', 'code-generation', 'personalisation',
      ],
      'gpt-4o': [
        'summarisation', 'multimodal-generation', 'prompt-engineering',
        'rag', 'code-generation', 'personalisation', 'image-generation',
      ],
      'gemini-advanced': [
        'summarisation', 'multimodal-generation', 'prompt-engineering', 'rag',
        'code-generation', 'personalisation', 'image-generation', 'video-generation',
      ],
      'llama-3': [
        'summarisation', 'code-generation', 'prompt-engineering', 'rag',
      ],
      'grok-1': [
        'summarisation', 'code-generation', 'prompt-engineering',
      ],
      'deepseek-coder': [
        'code-generation', 'summarisation', 'rag',
      ],
      'qwen-2': [
        'summarisation', 'code-generation', 'multimodal-generation', 'prompt-engineering',
      ],
      'mistral-large': [
        'summarisation', 'code-generation', 'prompt-engineering', 'rag', 'personalisation',
      ],
    },
  },
  {
    id: 'neural-networks',
    name: 'Neural Networks',
    description: 'Complex business pattern detection.',
    features: [
      { id: 'transformers', name: 'Transformers' },
      { id: 'llms', name: 'Large Language Models (LLMs)' },
      { id: 'attention-mechanisms', name: 'Attention Mechanisms' },
      { id: 'pretraining-fine-tuning', name: 'Pretraining & Fine-tuning' },
      { id: 'transfer-learning', name: 'Transfer Learning' },
      { id: 'cnns', name: 'Convolutional Neural Networks (CNNs)' },
      { id: 'rnns-lstms', name: 'Recurrent Networks & LSTMs' },
    ],
    knownServices: [s('gpt-4o'), s('gemini-advanced'), s('claude-3-opus')],
    serviceFeatureMap: {
      'gpt-4o': [
        'transformers', 'attention-mechanisms', 'llms',
        'pretraining-fine-tuning', 'transfer-learning',
      ],
      'gemini-advanced': [
        'transformers', 'attention-mechanisms', 'llms',
        'pretraining-fine-tuning', 'transfer-learning', 'cnns',
      ],
      'claude-3-opus': [
        'transformers', 'attention-mechanisms', 'llms', 'pretraining-fine-tuning',
      ],
    },
  },
  {
    id: 'ai-ml',
    name: 'AI & ML',
    description: 'Turn your data into decisions.',
    features: [
      { id: 'reasoning-problem-solving', name: 'Reasoning & Problem Solving' },
      { id: 'natural-language-processing', name: 'Natural Language Processing' },
      { id: 'supervised-learning', name: 'Supervised Learning' },
      { id: 'unsupervised-learning', name: 'Unsupervised Learning' },
      { id: 'reinforcement-learning', name: 'Reinforcement Learning' },
    ],
    knownServices: [s('gemini-advanced'), s('llama-3')],
    serviceFeatureMap: {
      'gemini-advanced': [
        'reasoning-problem-solving', 'natural-language-processing',
        'supervised-learning', 'reinforcement-learning', 'unsupervised-learning',
      ],
      'llama-3': [
        'natural-language-processing', 'supervised-learning', 'unsupervised-learning',
      ],
    },
  },
];
