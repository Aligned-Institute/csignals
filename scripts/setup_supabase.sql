-- 1. Enable the pgvector extension to work with embeddings
create extension if not exists vector;

-- 2. Create the RAG documents table
create table if not exists RAG_documents (
  id text primary key,
  document text not null,
  content text not null,
  embedding vector(768) not null,
  tenant_id text
);

-- Ensure tenant_id column exists if table was created previously
alter table RAG_documents add column if not exists tenant_id text;

-- Enable Row-Level Security
alter table RAG_documents enable row level security;

-- Policy: Select rows that match the user's tenant_id in JWT app_metadata
create policy "Users can read RAG documents by tenant_id"
  on RAG_documents
  for select
  using (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- Policy: Insert rows that match the user's tenant_id in JWT app_metadata
create policy "Users can insert RAG documents by tenant_id"
  on RAG_documents
  for insert
  with check (
    tenant_id = (auth.jwt() -> 'app_metadata' ->> 'tenant_id')
  );

-- 3. Create a similarity search function using cosine distance
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id text,
  document text,
  content text,
  score float
)
language plpgsql
as $$
begin
  return query
  select
    RAG_documents.id,
    RAG_documents.document,
    RAG_documents.content,
    1 - (RAG_documents.embedding <=> query_embedding) as score
  from RAG_documents
  where 1 - (RAG_documents.embedding <=> query_embedding) > match_threshold
  order by RAG_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
