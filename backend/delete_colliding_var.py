import os
import requests

token = os.environ.get("HF_TOKEN", "")
repo_id = "gaurav711/cinenexuzz"
headers = {"Authorization": f"Bearer {token}"}

try:
    print("Deleting TMDB_API_KEY from variables...")
    # DELETE /api/spaces/{repo_id}/variables/{name}
    del_resp = requests.delete(f"https://huggingface.co/api/spaces/{repo_id}/variables/TMDB_API_KEY", headers=headers)
    print("Delete status:", del_resp.status_code)
    print("Delete response:", del_resp.text)

    print("Triggering restart...")
    restart_resp = requests.post(f"https://huggingface.co/api/spaces/{repo_id}/restart", headers=headers)
    print("Restart status:", restart_resp.status_code)

except Exception as e:
    print("Error:", e)
