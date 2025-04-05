-- Create a function to insert a review bypassing RLS
CREATE OR REPLACE FUNCTION insert_review_admin(
  p_fullname text,
  p_text text,
  p_course text,
  p_courselink text DEFAULT '',
  p_student_picture text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- This will execute with the privileges of the function creator
AS $$
DECLARE
  new_id uuid;
  result json;
BEGIN
  -- Insert the review
  INSERT INTO "review" (
    "fullName",
    "text",
    "course",
    "courseLink",
    "student_picture"
  ) VALUES (
    p_fullname,
    p_text,
    p_course,
    p_courselink,
    p_student_picture
  )
  RETURNING id INTO new_id;
  
  -- Get the newly created review
  SELECT row_to_json(r) INTO result
  FROM "review" r
  WHERE r.id = new_id;
  
  RETURN result;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION insert_review_admin TO authenticated; 