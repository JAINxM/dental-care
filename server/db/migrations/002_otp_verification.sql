CREATE TABLE IF NOT EXISTS otp_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  destination text NOT NULL,
  purpose text NOT NULL CHECK (purpose IN ('registration','login','password_reset','phone_change')),
  otp_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  attempts smallint NOT NULL DEFAULT 0 CHECK (attempts BETWEEN 0 AND 10),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS otp_verification_lookup_idx
  ON otp_verification_tokens(destination,purpose,expires_at DESC)
  WHERE verified_at IS NULL;
