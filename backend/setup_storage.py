import os
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("setup_storage")

def setup():
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        log.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
        return

    supabase: Client = create_client(supabase_url, supabase_key)
    
    bucket_name = os.environ.get("SUPABASE_STORAGE_BUCKET_RESUMES", "resumes")
    
    try:
        buckets = supabase.storage.list_buckets()
        # Some older python clients might return a list of dicts or list of objects
        bucket_exists = False
        for b in buckets:
            b_name = b.name if hasattr(b, "name") else b.get("name")
            if b_name == bucket_name:
                bucket_exists = True
                break

        if bucket_exists:
            log.info(f"Bucket '{bucket_name}' already exists.")
        else:
            log.info(f"Creating bucket '{bucket_name}'...")
            supabase.storage.create_bucket(bucket_name, {"public": False})
            log.info(f"Bucket '{bucket_name}' created successfully as a private bucket.")
    except Exception as exc:
        log.error(f"Error setting up storage: {exc}")

if __name__ == "__main__":
    setup()
