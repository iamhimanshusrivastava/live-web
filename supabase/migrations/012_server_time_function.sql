-- Migration: Add server time function
-- This function returns the current server timestamp for client synchronization

-- Create function to get server time
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN NOW();
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute to anon and authenticated users
GRANT EXECUTE ON FUNCTION get_server_time() TO anon;
GRANT EXECUTE ON FUNCTION get_server_time() TO authenticated;

-- Add comment
COMMENT ON FUNCTION get_server_time() IS 'Returns current server timestamp for simulive synchronization. Client clocks are untrusted.';
