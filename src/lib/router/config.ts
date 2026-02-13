/**
 * Clawer Smart Router — Default Configuration
 * 
 * Adapted from ClawRouter (BlockRunAI) - MIT License
 * Optimized for Clawer's model selection (user picks orchestrator + worker)
 */

import type { RoutingConfig } from './types';

export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  version: '1.0',

  scoring: {
    tokenCountThresholds: { simple: 20, complex: 200 },  // Lower thresholds

    // Multilingual keywords
    codeKeywords: [
      'function', 'class', 'import', 'def', 'SELECT', 'async', 'await',
      'const', 'let', 'var', 'return', '```',
      // Frameworks and patterns (avoid short words that match substrings)
      'react', 'component', 'endpoint', 'database', 'query',
      'typescript', 'javascript', 'python', 'golang',
      'authentication', 'jwt token', 'oauth', 'caching', 'redis',
      'docker', 'kubernetes', 'terraform', 'pipeline',
      'rest api', 'graphql', 'microservice',
      '函数', '类', '导入', '定义', '查询', '异步', '等待', '常量', '变量', '返回',
    ],
    
    reasoningKeywords: [
      'prove', 'theorem', 'derive', 'step by step', 'chain of thought',
      'formally', 'mathematical', 'proof', 'logically',
      'analyze', 'compare', 'evaluate', 'explain why', 'reason through',
      'what are the pros and cons', 'trade-offs', 'implications',
      'think through', 'consider all', 'weigh the options',
      '证明', '定理', '推导', '逐步', '思维链', '形式化', '数学', '逻辑',
      '分析', '比较', '评估', '解释为什么', '权衡',
    ],
    
    simpleKeywords: [
      'what is', 'define', 'translate', 'hello', 'yes or no', 'capital of',
      'how old', 'who is', 'when was',
      '什么是', '定义', '翻译', '你好', '是否', '首都', '多大', '谁是', '何时',
    ],
    
    technicalKeywords: [
      'algorithm', 'optimize', 'architecture', 'distributed', 'kubernetes',
      'microservice', 'database', 'infrastructure',
      '算法', '优化', '架构', '分布式', '微服务', '数据库', '基础设施',
    ],
    
    creativeKeywords: [
      'story', 'poem', 'compose', 'brainstorm', 'creative', 'imagine', 'write a',
      '故事', '诗', '创作', '头脑风暴', '创意', '想象', '写一个',
    ],

    imperativeVerbs: [
      'build', 'create', 'implement', 'design', 'develop', 'construct',
      'generate', 'deploy', 'configure', 'set up',
      '构建', '创建', '实现', '设计', '开发', '生成', '部署', '配置', '设置',
    ],
    
    constraintIndicators: [
      'under', 'at most', 'at least', 'within', 'no more than', 'o(',
      'maximum', 'minimum', 'limit', 'budget',
      '不超过', '至少', '最多', '在内', '最大', '最小', '限制', '预算',
    ],
    
    outputFormatKeywords: [
      'json', 'yaml', 'xml', 'table', 'csv', 'markdown', 'schema',
      'format as', 'structured',
      '表格', '格式化为', '结构化',
    ],
    
    referenceKeywords: [
      'above', 'below', 'previous', 'following', 'the docs', 'the api',
      'the code', 'earlier', 'attached',
      '上面', '下面', '之前', '接下来', '文档', '代码', '附件',
    ],
    
    negationKeywords: [
      "don't", 'do not', 'avoid', 'never', 'without', 'except',
      'exclude', 'no longer',
      '不要', '避免', '从不', '没有', '除了', '排除',
    ],
    
    domainSpecificKeywords: [
      'quantum', 'fpga', 'vlsi', 'risc-v', 'asic', 'photonics',
      'genomics', 'proteomics', 'topological', 'homomorphic',
      'zero-knowledge', 'lattice-based',
      '量子', '光子学', '基因组学', '蛋白质组学', '拓扑', '同态', '零知识', '格密码',
    ],

    // Dimension weights (sum to 1.0)
    // Tuned for Clawer: imperative tasks (build/create) should be COMPLEX
    dimensionWeights: {
      tokenCount: 0.05,           // Reduced - short prompts can be complex
      codePresence: 0.18,         // Increased - code = orchestrator
      reasoningMarkers: 0.18,     // Keep high
      technicalTerms: 0.12,       // Increased
      creativeMarkers: 0.05,
      simpleIndicators: 0.10,     // Reduced
      multiStepPatterns: 0.10,
      questionComplexity: 0.04,
      imperativeVerbs: 0.08,      // Increased - "build/create" = complex
      constraintCount: 0.04,
      outputFormat: 0.03,
      referenceComplexity: 0.01,
      negationComplexity: 0.01,
      domainSpecificity: 0.01,
    },

    tierBoundaries: {
      simpleMedium: -0.05,        // Lower bar for MEDIUM
      mediumComplex: 0.10,        // Lower bar for COMPLEX
      complexReasoning: 0.20,     // Lower bar for REASONING
    },

    confidenceSteepness: 8,       // Gentler sigmoid curve
    confidenceThreshold: 0.5,     // Lower threshold - allow more classifications
  },

  // Default tier → model mapping
  // Users can override via model selection
  tiers: {
    SIMPLE: {
      primary: 'gemini-2.0-flash-lite',
      fallback: ['gpt-4o-mini', 'gemini-2.0-flash'],
    },
    MEDIUM: {
      primary: 'gpt-4o-mini',
      fallback: ['gemini-2.0-flash', 'deepseek-chat'],
    },
    COMPLEX: {
      primary: 'minimax-m2.5',
      fallback: ['gpt-4o', 'gemini-3-flash', 'claude-sonnet-4'],
    },
    REASONING: {
      primary: 'deepseek-reasoner',
      fallback: ['gpt-4o', 'gemini-2.5-pro'],
    },
  },

  overrides: {
    maxTokensForceComplex: 100_000,
    ambiguousDefaultTier: 'MEDIUM',
  },
};

/**
 * Model pricing (per 1M tokens)
 * Used for cost estimation and savings calculation
 */
export const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  // Google
  'gemini-2.0-flash-lite': { input: 0.05, output: 0.20 },
  'gemini-2.0-flash': { input: 0.10, output: 0.40 },
  'gemini-3-flash': { input: 0.50, output: 3.00 },
  'gemini-2.5-pro': { input: 1.25, output: 10.00 },
  
  // OpenAI
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
  
  // Anthropic
  'claude-haiku-4.5': { input: 1.00, output: 5.00 },
  'claude-sonnet-4': { input: 3.00, output: 15.00 },
  'claude-opus-4': { input: 15.00, output: 75.00 },
  
  // DeepSeek
  'deepseek-chat': { input: 0.28, output: 0.42 },
  'deepseek-reasoner': { input: 0.28, output: 0.42 },
  
  // MiniMax
  'minimax-m2.5': { input: 0.30, output: 2.40 },
  
  // xAI
  'grok-4.1-fast': { input: 0.20, output: 0.50 },
  'grok-3': { input: 3.00, output: 15.00 },
};

/**
 * Baseline model for savings calculation
 */
export const BASELINE_MODEL = 'claude-opus-4';
