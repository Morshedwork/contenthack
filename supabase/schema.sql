-- ContentOps AI Database Schema
-- Run: npm run db:push

-- ─── Tables ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  company_name TEXT NOT NULL,
  industry TEXT,
  target_audience TEXT,
  region TEXT,
  product_service TEXT,
  campaign_goal TEXT,
  platforms TEXT[],
  tone TEXT,
  content_frequency TEXT,
  start_date DATE,
  end_date DATE,
  main_offer TEXT,
  cta_style TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brand_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  brand_name TEXT,
  brand_description TEXT,
  target_audience TEXT,
  tone TEXT,
  words_to_avoid TEXT[],
  content_rules TEXT[],
  product_description TEXT,
  main_offer TEXT,
  cta_style TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS model_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  model_id TEXT NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  agent_id TEXT NOT NULL,
  assigned_model TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  campaign_id UUID REFERENCES campaigns(id),
  status TEXT DEFAULT 'idle',
  progress INTEGER DEFAULT 0,
  confidence NUMERIC,
  output TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS agent_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id UUID REFERENCES agent_runs(id),
  name TEXT NOT NULL,
  assigned_agent TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'idle',
  output_preview TEXT,
  estimated_time_saved TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS market_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  data JSONB NOT NULL,
  opportunity_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  topic TEXT NOT NULL,
  intent_score INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS content_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  platform TEXT NOT NULL,
  hook TEXT,
  main_copy TEXT,
  cta TEXT,
  hashtags TEXT[],
  audience_fit_score INTEGER,
  brand_safety_score INTEGER,
  lead_potential_score INTEGER,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS video_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  title TEXT,
  hook TEXT,
  scenes JSONB,
  voiceover TEXT,
  ai_video_prompt TEXT,
  cta TEXT,
  duration TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS approval_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID,
  content_type TEXT,
  title TEXT,
  platform TEXT,
  preview TEXT,
  risk_level TEXT,
  brand_safety_score INTEGER,
  lead_potential_score INTEGER,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calendar_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  platform TEXT,
  title TEXT,
  scheduled_time TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled',
  owner TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  platform TEXT NOT NULL,
  connected BOOLEAN DEFAULT FALSE,
  mock_mode BOOLEAN DEFAULT TRUE,
  credentials JSONB,
  scopes TEXT[],
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT,
  title TEXT,
  status TEXT,
  published_url TEXT,
  error_message TEXT,
  published_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES campaigns(id),
  name TEXT,
  company TEXT,
  role TEXT,
  platform TEXT,
  match_reason TEXT,
  pain_point TEXT,
  suggested_offer TEXT,
  score INTEGER,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id),
  linkedin_connection TEXT,
  linkedin_follow_up TEXT,
  email_subject TEXT,
  email_body TEXT,
  short_pitch TEXT,
  personalization_reason TEXT,
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id),
  event_type TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.roi_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id),
  report_data JSONB,
  period_start DATE,
  period_end DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Full workspace snapshot (campaign, content, agents, settings, etc.)
CREATE TABLE IF NOT EXISTS public.workspace_state (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  state JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── New user bootstrap ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.workspaces (name, owner_id)
  VALUES ('My Workspace', NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publish_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roi_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_state ENABLE ROW LEVEL SECURITY;

-- Users: own row only
DROP POLICY IF EXISTS "users_select_own" ON public.users;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "users_update_own" ON public.users;
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Workspaces: owner access
DROP POLICY IF EXISTS "workspaces_owner_all" ON public.workspaces;
CREATE POLICY "workspaces_owner_all" ON public.workspaces
  FOR ALL USING (auth.uid() = owner_id);

-- Workspace-scoped tables
DROP POLICY IF EXISTS "campaigns_workspace" ON public.campaigns;
CREATE POLICY "campaigns_workspace" ON public.campaigns
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "brand_profiles_workspace" ON public.brand_profiles;
CREATE POLICY "brand_profiles_workspace" ON public.brand_profiles
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "model_configs_workspace" ON public.model_configs;
CREATE POLICY "model_configs_workspace" ON public.model_configs
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "agent_configs_workspace" ON public.agent_configs;
CREATE POLICY "agent_configs_workspace" ON public.agent_configs
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "platform_integrations_workspace" ON public.platform_integrations;
CREATE POLICY "platform_integrations_workspace" ON public.platform_integrations
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "analytics_events_workspace" ON public.analytics_events;
CREATE POLICY "analytics_events_workspace" ON public.analytics_events
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "roi_reports_workspace" ON public.roi_reports;
CREATE POLICY "roi_reports_workspace" ON public.roi_reports
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_state_owner" ON public.workspace_state;
CREATE POLICY "workspace_state_owner" ON public.workspace_state
  FOR ALL USING (
    workspace_id IN (SELECT id FROM public.workspaces WHERE owner_id = auth.uid())
  );

-- Campaign-scoped tables (via workspace ownership)
DROP POLICY IF EXISTS "campaign_children" ON public.agent_runs;
CREATE POLICY "campaign_children" ON public.agent_runs
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "market_research_campaign" ON public.market_research;
CREATE POLICY "market_research_campaign" ON public.market_research
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "content_topics_campaign" ON public.content_topics;
CREATE POLICY "content_topics_campaign" ON public.content_topics
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "content_drafts_campaign" ON public.content_drafts;
CREATE POLICY "content_drafts_campaign" ON public.content_drafts
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "video_scripts_campaign" ON public.video_scripts;
CREATE POLICY "video_scripts_campaign" ON public.video_scripts
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "calendar_posts_campaign" ON public.calendar_posts;
CREATE POLICY "calendar_posts_campaign" ON public.calendar_posts
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "leads_campaign" ON public.leads;
CREATE POLICY "leads_campaign" ON public.leads
  FOR ALL USING (
    campaign_id IN (
      SELECT c.id FROM public.campaigns c
      JOIN public.workspaces w ON c.workspace_id = w.id
      WHERE w.owner_id = auth.uid()
    )
  );

-- Authenticated read/write for remaining tables (demo-friendly)
DROP POLICY IF EXISTS "auth_agent_tasks" ON public.agent_tasks;
CREATE POLICY "auth_agent_tasks" ON public.agent_tasks FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_approval_items" ON public.approval_items;
CREATE POLICY "auth_approval_items" ON public.approval_items FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_publish_logs" ON public.publish_logs;
CREATE POLICY "auth_publish_logs" ON public.publish_logs FOR ALL TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_outreach" ON public.outreach_messages;
CREATE POLICY "auth_outreach" ON public.outreach_messages FOR ALL TO authenticated USING (true);
