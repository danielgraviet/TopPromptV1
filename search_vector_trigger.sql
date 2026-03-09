-- Step 1: Create the trigger function
CREATE OR REPLACE FUNCTION prompts_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.prompt_text, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Attach the trigger to the prompts table
CREATE TRIGGER prompts_search_vector_trigger
BEFORE INSERT OR UPDATE ON prompts
FOR EACH ROW EXECUTE FUNCTION prompts_search_vector_update();

-- Step 3: Verify with a test insert (optional)
INSERT INTO prompts (id, title, description, prompt_text, creator_id, category, score, upvote_count, save_count, comment_count)
VALUES ('test-1', 'Test prompt', 'A test description', 'Do something cool', 'fake-user', 'general', 0, 0, 0, 0);

SELECT id, title, search_vector FROM prompts WHERE id = 'test-1';

-- Step 4: Clean up the test row
DELETE FROM prompts WHERE id = 'test-1';
