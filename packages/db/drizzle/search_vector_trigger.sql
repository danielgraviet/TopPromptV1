-- Run this after the initial Drizzle migration to set up full-text search
CREATE OR REPLACE FUNCTION prompts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.prompt_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prompts_search_vector_trigger
BEFORE INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION prompts_search_vector_update();
