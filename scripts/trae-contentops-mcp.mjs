#!/usr/bin/env node
/**
 * Minimal MCP stdio bridge for TRAE Solo → ContentOps AI API.
 * Exposes topic generation and content drafting tools to TRAE IDE.
 */

const API_URL = process.env.CONTENTOPS_API_URL || 'http://localhost:3000'

const TOOLS = [
  {
    name: 'generate_content_topics',
    description:
      'Generate intent-scored content topics from a structured brief (key points + base content). Powered by TRAE Solo strategy agent.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Brief title' },
        goal: { type: 'string', description: 'Campaign goal' },
        keyPoints: {
          type: 'array',
          items: { type: 'string' },
          description: 'Core points, pain points, or messages',
        },
        baseContent: { type: 'string', description: 'Background content or product context' },
        targetAudience: { type: 'string' },
        tone: { type: 'string' },
        platforms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Target platforms: linkedin, instagram, facebook, x, email, carousel',
        },
        topicCount: { type: 'number', description: 'Number of topics (4-16)' },
      },
      required: ['keyPoints'],
    },
  },
  {
    name: 'generate_content_from_topic',
    description: 'Generate platform-specific content draft from a selected topic',
    inputSchema: {
      type: 'object',
      properties: {
        topic: {
          type: 'object',
          description: 'Topic object from generate_content_topics',
        },
        platform: { type: 'string', description: 'Target platform' },
      },
      required: ['topic', 'platform'],
    },
  },
  {
    name: 'get_trae_solo_capabilities',
    description: 'List TRAE Solo agent capabilities for ContentOps AI',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'generate_market_research',
    description: 'Generate market + competitor research for the active campaign context',
    inputSchema: {
      type: 'object',
      properties: {
        industry: { type: 'string' },
        targetCustomer: { type: 'string' },
        region: { type: 'string' },
        offer: { type: 'string' },
      },
    },
  },
  {
    name: 'generate_ai_topics',
    description: 'Generate a simple list of topic ideas (non-TRAE structured topics)',
    inputSchema: {
      type: 'object',
      properties: {
        goal: { type: 'string' },
        count: { type: 'number' },
      },
    },
  },
  {
    name: 'generate_content_drafts',
    description: 'Generate platform-native content drafts (one per requested platform)',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        platform: { type: 'string' },
        platforms: { type: 'array', items: { type: 'string' } },
        campaignId: { type: 'string' },
      },
    },
  },
  {
    name: 'generate_video_scripts',
    description: 'Generate short-form video scripts',
    inputSchema: {
      type: 'object',
      properties: {
        topic: { type: 'string' },
        count: { type: 'number' },
      },
    },
  },
  {
    name: 'check_brand_safety',
    description: 'Check content for brand safety / compliance risks',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string' },
      },
      required: ['content'],
    },
  },
  {
    name: 'generate_leads',
    description: 'Generate qualified lead profiles based on targeting criteria',
    inputSchema: {
      type: 'object',
      properties: {
        count: { type: 'number' },
        criteria: { type: 'string' },
      },
    },
  },
  {
    name: 'generate_outreach_message',
    description: 'Generate personalized outreach copy for a lead',
    inputSchema: {
      type: 'object',
      properties: {
        leadId: { type: 'string' },
        leadName: { type: 'string' },
        company: { type: 'string' },
        painPoint: { type: 'string' },
        matchReason: { type: 'string' },
      },
      required: ['leadId'],
    },
  },
]

async function callEndpoint(path, payload = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'API request failed')
  return json.data
}

async function callTraeSolo(action, payload = {}) {
  return callEndpoint('/api/trae/solo', { action, ...payload })
}

async function handleToolCall(name, args) {
  switch (name) {
    case 'generate_content_topics':
      return await callTraeSolo('generate_topics', { brief: args })
    case 'generate_content_from_topic':
      return await callTraeSolo('generate_content', { topic: args.topic, platform: args.platform })
    case 'get_trae_solo_capabilities':
      return await callTraeSolo('capabilities')
    case 'generate_market_research':
      return await callEndpoint('/api/research/generate', args)
    case 'generate_ai_topics':
      return await callEndpoint('/api/topics/generate', args)
    case 'generate_content_drafts':
      return await callEndpoint('/api/content/generate', args)
    case 'generate_video_scripts':
      return await callEndpoint('/api/video/generate', args)
    case 'check_brand_safety':
      return await callEndpoint('/api/safety/check', args)
    case 'generate_leads':
      return await callEndpoint('/api/leads/generate', args)
    case 'generate_outreach_message':
      return await callEndpoint('/api/outreach/generate', args)
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

function send(msg) {
  process.stdout.write(JSON.stringify(msg) + '\n')
}

let buffer = ''
process.stdin.on('data', (chunk) => {
  buffer += chunk.toString()
  const lines = buffer.split('\n')
  buffer = lines.pop() || ''
  for (const line of lines) {
    const cleaned = line.replace(/^\uFEFF/, '').replace(/\r$/, '').trim()
    if (!cleaned) continue
    handleMessage(JSON.parse(cleaned)).catch((err) => {
      send({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: err.message },
      })
    })
  }
})

async function handleMessage(msg) {
  const { id, method, params } = msg

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'contentops-ai', version: '1.0.0' },
      },
    })
    return
  }

  if (method === 'notifications/initialized') return

  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: TOOLS } })
    return
  }

  if (method === 'tools/call') {
    const result = await handleToolCall(params.name, params.arguments || {})
    send({
      jsonrpc: '2.0',
      id,
      result: {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      },
    })
    return
  }

  if (id !== undefined) {
    send({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } })
  }
}
