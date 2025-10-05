CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
    default_template_id uuid;
BEGIN
    -- Find the ID of the "PHD em Cálculo Trabalhista" AI template
    SELECT id INTO default_template_id
    FROM public.tbl_ai_prompt_templates
    WHERE title = 'PHD em Cálculo Trabalhista'
    LIMIT 1;

    -- Insert a new profile for the new user with the default AI template
    INSERT INTO public.profiles (id, first_name, last_name, default_ai_template_id)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'first_name',
        NEW.raw_user_meta_data ->> 'last_name',
        default_template_id
    );

    RETURN NEW;
END;
$$;